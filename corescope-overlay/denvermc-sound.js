(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var api = window.__coloradoMeshSound;
  if (api && api.version) return;

  var MODE_STORAGE_KEY = 'coloradoMesh.map.soundMode';
  var VOLUME_STORAGE_KEY = 'coloradoMesh.map.soundVolume';
  var UPSTREAM_AUDIO_ENABLED_KEY = 'live-audio-enabled';
  var DEFAULT_VOLUME = 0.3;
  var ENSEMBLE_MANIFEST_URL = '/sound/orchestral/manifest.json';
  var DENSITY_WORKLET_URL = '/sound/denvermc-density-worklet.js';
  var TRAFFIC_WINDOW_MS = 4000;
  var MUSIC_QUEUE_MAX = 160;
  var MUSIC_SCHEDULE_AHEAD_SECONDS = 0.9;
  var MUSIC_TICK_MS = 28;
  var COALESCE_THRESHOLD = 3;
  var COALESCE_MAX_KEYS = 16;
  var COALESCE_STALE_MS = 9000;
  var HARMONY_TEMPO_BPM = 96;
  var HARMONY_BEATS_PER_BAR = 4;
  var HARMONY_PROGRESSION = [
    { name: 'Cm7',    root: 60, intervals: [0, 3, 7, 10] },
    { name: 'F7',     root: 53, intervals: [0, 4, 7, 10] },
    { name: 'EbMaj7', root: 63, intervals: [0, 4, 7, 11] },
    { name: 'Dm7',    root: 62, intervals: [0, 3, 7, 10] },
  ];
  var ENSEMBLE_ROOT_MIDI = 60;
  var ENSEMBLE_SCALE = [0, 2, 3, 5, 7, 9, 10];
  var CHIME_PARTIAL_RATIOS = [1, 2.756, 5.404, 8.933, 13.345];
  var CHIME_PARTIAL_GAINS = [1, 0.46, 0.24, 0.13, 0.07];
  var AudioCtor = window.AudioContext || window.webkitAudioContext || null;
  var modes = [
    { value: 'off', label: 'Sound Off' },
    { value: 'native', label: 'Native+' },
    { value: 'generative', label: 'Generative Key' },
    { value: 'ensemble', label: 'Orchestral Ensemble' },
    { value: 'chime', label: 'Wind Chimes' },
    { value: 'blaster', label: 'Space Blaster' },
  ];
  var modeLookup = modes.reduce(function (acc, mode) {
    acc[mode.value] = mode;
    return acc;
  }, {});
  var listeners = [];
  var audioCtx = null;
  var masterGain = null;
  var bedGain = null;
  var accentGain = null;
  var outputLimiter = null;
  var densityWorklet = null;
  var densityWorkletPromise = null;
  var densityFallbackTimer = null;
  var densitySchedulerTimer = null;
  var activeVoices = 0;
  var maxActiveVoices = 24;
  var cueGeneration = 0;
  var modeCooldowns = {};
  var cleanupTimers = new Set();
  var scheduledSources = new Set();
  var scheduledNodes = new Set();
  var cachedNoiseBuffer = null;
  var musicQueue = [];
  var musicTimer = null;
  var musicNextTime = 0;
  var musicOrdinal = 0;
  var ensembleRoundRobin = {};
  var sequencerState = {
    queued: 0,
    scheduled: 0,
    coalesced: 0,
    lastCue: null,
    lastMidi: null,
    lastSampleId: null,
    recentMidi: [],
    recentSampleIds: [],
    lastEnsembleRole: null,
    recentEnsembleRoles: [],
    lastEnsembleTemplate: null,
    recentEnsembleTemplates: [],
    lastBlasterFrequency: null,
    recentBlasterFrequencies: [],
    lastBlasterPitch: null,
    recentBlasterPitches: [],
    lastBlasterPatch: null,
    recentBlasterPatches: [],
    lastBlasterCue: null,
    recentBlasterCues: [],
    lastAdmission: null,
    lastBurst: null,
  };
  var coalesceState = new Map();
  var ensembleManifest = null;
  var ensembleManifestPromise = null;
  var ensembleBuffers = {};
  var ensembleBufferPromises = {};
  var ensembleWarnings = {};
  var ensembleState = {
    status: 'idle',
    loaded: false,
    failed: false,
    sampleCount: 0,
  };
  var suppressObserver = null;
  var suppressTimer = null;
  var dedupeWindowMs = 900;
  var dedupeSeen = new Map();
  var buckets = {
    priority: { capacity: 24, tokens: 24, refillPerSecond: 18, updatedAt: Date.now() },
    normal: { capacity: 24, tokens: 24, refillPerSecond: 14, updatedAt: Date.now() },
    low: { capacity: 12, tokens: 12, refillPerSecond: 6, updatedAt: Date.now() },
  };
  var lastNormalizedEvent = null;
  var lastEvent = null;
  var lastDroppedReason = null;
  var workletState = {
    status: 'idle',
    loaded: false,
    fallback: false,
    error: null,
    updates: 0,
  };
  var trafficState = {
    events: [],
    total: 0,
    density: 0,
    priority: 0,
    pulse: 0,
    replay: 0,
    lastUpdatedAt: 0,
  };
  var counters = {
    modeChanges: 0,
    volumeChanges: 0,
    unlockAttempts: 0,
    unlockFailures: 0,
    suppressions: 0,
    suppressedPackets: 0,
    testEvents: 0,
    received: 0,
    normalized: 0,
    routed: 0,
    ingested: 0,
    accentDropped: 0,
    densityUpdates: 0,
    dropped: 0,
    deduped: 0,
    throttled: 0,
    admitted: 0,
    coalesced: 0,
    burstAccents: 0,
    queueTrimmed: 0,
    locked: 0,
    off: 0,
    malformed: 0,
    priority: 0,
    played: 0,
  };

  function readStorage(key) {
    try { return window.localStorage.getItem(key); }
    catch { return null; }
  }

  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, value); }
    catch { /* ignore quota/private-mode */ }
  }

  function clampVolume(value) {
    var next = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(next)) return DEFAULT_VOLUME;
    return Math.max(0, Math.min(1, next));
  }

  function readMode() {
    var saved = readStorage(MODE_STORAGE_KEY);
    return modeLookup[saved] ? saved : 'off';
  }

  function readVolume() {
    var saved = readStorage(VOLUME_STORAGE_KEY);
    if (saved == null || saved === '') return DEFAULT_VOLUME;
    return clampVolume(saved);
  }

  var state = {
    mode: readMode(),
    volume: readVolume(),
    unlocked: false,
    status: 'bootstrap',
    available: !!AudioCtor,
  };

  function getModeOptions() {
    return modes.map(function (mode) {
      return { value: mode.value, label: mode.label };
    });
  }

  function cloneEvent(event) {
    if (!event) return null;
    return {
      id: event.id,
      type: event.type,
      modeHint: event.modeHint,
      channelName: event.channelName,
      channelHash: event.channelHash,
      isEmergency: event.isEmergency,
      isPriority: event.isPriority,
      isReplay: event.isReplay,
      observationCount: event.observationCount,
      hopCount: event.hopCount,
      intensity: event.intensity,
      seed: event.seed,
      timestamp: event.timestamp,
    };
  }

  function trafficSnapshot() {
    return {
      total: trafficState.total,
      density: trafficState.density,
      priority: trafficState.priority,
      pulse: trafficState.pulse,
      replay: trafficState.replay,
      activeWindowEvents: trafficState.events.length,
      lastUpdatedAt: trafficState.lastUpdatedAt,
    };
  }

  function workletSnapshot() {
    return Object.assign({}, workletState, {
      active: !!densityWorklet,
      schedulerActive: !!densitySchedulerTimer,
      fallbackActive: !!densityFallbackTimer,
    });
  }

  function sequencerSnapshot() {
    return Object.assign({}, sequencerState, {
      queueLength: musicQueue.length,
      active: !!musicTimer,
      nextTime: musicNextTime,
    });
  }

  function getState() {
    return {
      mode: state.mode,
      volume: state.volume,
      unlocked: state.unlocked,
      status: state.status,
      available: state.available,
      counters: Object.assign({}, counters),
      lastNormalizedEvent: cloneEvent(lastNormalizedEvent),
      lastEvent: cloneEvent(lastEvent),
      lastDroppedReason: lastDroppedReason,
      traffic: trafficSnapshot(),
      worklet: workletSnapshot(),
      activeVoices: activeVoices,
      scheduledSources: scheduledSources.size,
      scheduledNodes: scheduledNodes.size,
      cleanupTimers: cleanupTimers.size,
      sequencer: sequencerSnapshot(),
      ensemble: Object.assign({}, ensembleState),
    };
  }

  function audioContextIsRunning() {
    return !!(audioCtx && audioCtx.state === 'running');
  }

  function updateStatus() {
    if (audioCtx && audioCtx.state === 'closed') {
      state.available = false;
      state.unlocked = false;
    }
    if (!state.available) {
      state.status = 'unavailable';
    } else if (state.mode === 'off') {
      state.status = 'off';
    } else if (audioCtx && audioCtx.state === 'suspended') {
      state.unlocked = false;
      state.status = 'suspended';
    } else if (!state.unlocked) {
      state.status = 'locked';
    } else if (!audioContextIsRunning()) {
      state.unlocked = false;
      state.status = 'locked';
    } else {
      state.status = 'ready';
    }
    if (api) api.status = state.status;
  }

  function notify() {
    updateStatus();
    var snapshot = getState();
    listeners.slice().forEach(function (listener) {
      try { listener(snapshot); }
      catch { /* keep other listeners alive */ }
    });
    try {
      window.dispatchEvent(new CustomEvent('coloradoMeshSoundChange', { detail: snapshot }));
    } catch { /* CustomEvent can fail in very old browsers */ }
  }

  function applyVolume() {
    if (!masterGain || !audioCtx) return;
    var target = state.unlocked && state.mode !== 'off' ? state.volume : 0;
    try {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.015);
    } catch {
      masterGain.gain.value = target;
    }
    updateDensityOutput();
  }

  function modeWorkletValue() {
    if (state.mode === 'native') return 0.18;
    if (state.mode === 'generative') return 0.42;
    if (state.mode === 'ensemble') return 0.66;
    if (state.mode === 'chime') return 0.55;
    if (state.mode === 'blaster') return 0.92;
    return 0;
  }

  function updateDensityOutput(snapshot) {
    if (!audioCtx) return;
    var traffic = snapshot || trafficSnapshot();
    var level = state.unlocked && state.mode !== 'off' ? 1 : 0;
    var density = clamp(traffic.density, 0, 1);
    var priority = clamp(traffic.priority, 0, 1);
    var pulse = clamp(traffic.pulse, 0, 1);
    try {
      if (densityWorklet && densityWorklet.parameters) {
        var at = audioCtx.currentTime + 0.025;
        densityWorklet.parameters.get('density').linearRampToValueAtTime(density, at);
        densityWorklet.parameters.get('priority').linearRampToValueAtTime(priority, at);
        densityWorklet.parameters.get('pulse').linearRampToValueAtTime(pulse, at);
        densityWorklet.parameters.get('mode').linearRampToValueAtTime(modeWorkletValue(), at);
        densityWorklet.parameters.get('level').linearRampToValueAtTime(level, at);
        workletState.updates += 1;
      } else if (bedGain) {
        bedGain.gain.setTargetAtTime(level * (0.018 + density * 0.09 + priority * 0.03), audioCtx.currentTime, 0.08);
      }
    } catch {
      workletState.status = 'degraded';
      workletState.fallback = true;
      if (bedGain) bedGain.gain.value = level * (0.015 + density * 0.06);
    }
  }

  function stopDensityScheduler(removeNode) {
    if (densitySchedulerTimer) {
      window.clearInterval(densitySchedulerTimer);
      densitySchedulerTimer = null;
    }
    if (densityFallbackTimer) {
      window.clearInterval(densityFallbackTimer);
      densityFallbackTimer = null;
    }
    if (removeNode && densityWorklet) {
      try { if (densityWorklet.port && densityWorklet.port.close) densityWorklet.port.close(); }
      catch { /* ignore worklet port close */ }
      safeDisconnect(densityWorklet);
      densityWorklet = null;
    }
    if (bedGain && audioCtx) {
      try { bedGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02); }
      catch { bedGain.gain.value = 0; }
    }
  }

  function scheduleFallbackPulse() {
    if (!audioCtx || !bedGain || densityFallbackTimer || !audioContextIsRunning()) return;
    workletState.fallback = true;
    densityFallbackTimer = window.setInterval(function () {
      if (!audioContextIsRunning() || state.mode === 'off') return;
      var traffic = snapshotTraffic(Date.now());
      var density = clamp(traffic.density, 0, 1);
      if (density < 0.03) return;
      var start = audioCtx.currentTime + 0.035;
      var freq = state.mode === 'blaster' ? 176 : state.mode === 'native' ? 124 : state.mode === 'generative' ? 146 : 132;
      scheduleTone(freq * (1 + density * 0.18), start, 0.18, {
        destination: bedGain,
        type: state.mode === 'blaster' ? 'triangle' : 'sine',
        gain: Math.min(0.045, 0.012 + density * 0.04) * state.volume,
        attack: 0.05,
        decay: 0.08,
        sustain: 0.008,
        release: 0.28,
        filterFrequency: 900 + density * 1800,
        q: 0.5,
      });
    }, 180);
  }

  function startDensityScheduler() {
    if (densitySchedulerTimer || !audioContextIsRunning()) return;
    densitySchedulerTimer = window.setInterval(function () {
      if (!audioContextIsRunning() || state.mode === 'off') return;
      updateDensityOutput(snapshotTraffic(Date.now()));
    }, 80);
    updateDensityOutput(snapshotTraffic(Date.now()));
  }

  function soundCanRenderDensity() {
    return !!(audioCtx && bedGain && state.unlocked && state.mode !== 'off' && audioContextIsRunning());
  }

  function createDensityWorkletNode() {
    if (!soundCanRenderDensity()) return false;
    try {
      densityWorklet = new AudioWorkletNode(audioCtx, 'colorado-mesh-density', { numberOfOutputs: 1, outputChannelCount: [2] });
    } catch (error) {
      workletState.status = 'fallback';
      workletState.fallback = true;
      workletState.error = error && error.message ? error.message : 'node create failed';
      densityWorklet = null;
      scheduleFallbackPulse();
      notify();
      return false;
    }
    densityWorklet.onprocessorerror = function () {
      workletState.status = 'degraded';
      workletState.error = 'processorerror';
      workletState.fallback = true;
      safeDisconnect(densityWorklet);
      densityWorklet = null;
      scheduleFallbackPulse();
      notify();
    };
    densityWorklet.connect(bedGain);
    workletState.status = 'ready';
    workletState.loaded = true;
    workletState.fallback = false;
    updateDensityOutput(snapshotTraffic(Date.now()));
    notify();
    return true;
  }

  function ensureDensityWorklet() {
    if (!audioCtx || !bedGain || densityWorklet) return Promise.resolve(!!densityWorklet);
    if (!soundCanRenderDensity()) return Promise.resolve(false);
    if (!audioCtx.audioWorklet || typeof AudioWorkletNode === 'undefined') {
      workletState.status = 'fallback';
      workletState.fallback = true;
      scheduleFallbackPulse();
      return Promise.resolve(false);
    }
    if (workletState.loaded) return Promise.resolve(createDensityWorkletNode());
    if (densityWorkletPromise) return densityWorkletPromise.then(function (loaded) {
      return loaded && !densityWorklet ? createDensityWorkletNode() : !!densityWorklet;
    });
    workletState.status = 'loading';
    workletState.error = null;
    densityWorkletPromise = audioCtx.audioWorklet.addModule(DENSITY_WORKLET_URL).then(function () {
      workletState.loaded = true;
      densityWorkletPromise = null;
      return createDensityWorkletNode();
    }).catch(function (error) {
      densityWorkletPromise = null;
      workletState.status = 'fallback';
      workletState.loaded = false;
      workletState.fallback = true;
      workletState.error = error && error.message ? error.message : 'load failed';
      scheduleFallbackPulse();
      notify();
      return false;
    });
    return densityWorkletPromise;
  }

  function clearMusicQueue() {
    if (musicTimer) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
    musicQueue = [];
    musicNextTime = 0;
    sequencerState.queued = 0;
  }

  function resetSequencerDiagnostics() {
    sequencerState.queued = 0;
    sequencerState.scheduled = 0;
    sequencerState.coalesced = 0;
    sequencerState.lastCue = null;
    sequencerState.lastMidi = null;
    sequencerState.lastSampleId = null;
    sequencerState.recentMidi = [];
    sequencerState.recentSampleIds = [];
    sequencerState.lastEnsembleRole = null;
    sequencerState.recentEnsembleRoles = [];
    sequencerState.lastEnsembleTemplate = null;
    sequencerState.recentEnsembleTemplates = [];
    sequencerState.lastBlasterFrequency = null;
    sequencerState.recentBlasterFrequencies = [];
    sequencerState.lastBlasterPitch = null;
    sequencerState.recentBlasterPitches = [];
    sequencerState.lastBlasterPatch = null;
    sequencerState.recentBlasterPatches = [];
    sequencerState.lastBlasterCue = null;
    sequencerState.recentBlasterCues = [];
    sequencerState.lastAdmission = null;
    sequencerState.lastBurst = null;
  }

  function stopAccentCues() {
    clearMusicQueue();
    resetSequencerDiagnostics();
    scheduledSources.forEach(function (source) {
      if (source && typeof source.stop === 'function') {
        try { source.stop(audioCtx ? audioCtx.currentTime : 0); }
        catch { /* source may already be stopped */ }
      }
    });
    scheduledSources.clear();
    scheduledNodes.forEach(safeDisconnect);
    scheduledNodes.clear();
    cleanupTimers.forEach(function (timer) { window.clearTimeout(timer); });
    cleanupTimers.clear();
    cueGeneration += 1;
    modeCooldowns = {};
    coalesceState.clear();
    activeVoices = 0;
  }

  function stopAllScheduledCues() {
    stopAccentCues();
    stopDensityScheduler(true);
  }

  function suspendAudioContext() {
    state.unlocked = false;
    stopAllScheduledCues();
    applyVolume();
    if (audioCtx && audioCtx.state === 'running' && typeof audioCtx.suspend === 'function') {
      try { audioCtx.suspend(); }
      catch { /* ignore browser-specific suspend errors */ }
    }
  }

  function ensureAudioContext() {
    if (!AudioCtor) {
      state.available = false;
      state.unlocked = false;
      updateStatus();
      return false;
    }

    try {
      if (!audioCtx) {
        audioCtx = new AudioCtor();
        masterGain = audioCtx.createGain();
        bedGain = audioCtx.createGain();
        accentGain = audioCtx.createGain();
        masterGain.gain.value = 0;
        bedGain.gain.value = 0;
        accentGain.gain.value = 0.82;
        outputLimiter = audioCtx.createDynamicsCompressor();
        outputLimiter.threshold.value = -12;
        outputLimiter.knee.value = 10;
        outputLimiter.ratio.value = 8;
        outputLimiter.attack.value = 0.006;
        outputLimiter.release.value = 0.16;
        bedGain.connect(masterGain);
        accentGain.connect(masterGain);
        masterGain.connect(outputLimiter);
        outputLimiter.connect(audioCtx.destination);
      }
      applyVolume();
      if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        var resumed = audioCtx.resume();
        if (resumed && typeof resumed.then === 'function') {
          resumed.then(function () {
            state.unlocked = audioContextIsRunning();
            if (state.unlocked) {
              ensureDensityWorklet();
              startDensityScheduler();
            }
            if (state.mode === 'ensemble' && state.unlocked) primeEnsembleSamples();
            applyVolume();
            notify();
          }).catch(function () {
            counters.unlockFailures += 1;
            state.unlocked = false;
            applyVolume();
            notify();
          });
        }
      }
      state.unlocked = audioContextIsRunning();
      if (state.unlocked) {
        ensureDensityWorklet();
        startDensityScheduler();
      }
      if (state.mode === 'ensemble' && state.unlocked) primeEnsembleSamples();
      applyVolume();
      updateStatus();
      return state.unlocked;
    } catch {
      counters.unlockFailures += 1;
      state.available = false;
      state.unlocked = false;
      updateStatus();
      return false;
    }
  }

  function setMode(mode, options) {
    if (!modeLookup[mode]) return false;
    var userGesture = !!(options && options.userGesture);
    var previousMode = state.mode;
    var changed = previousMode !== mode;
    if (changed) stopAccentCues();
    state.mode = mode;
    writeStorage(MODE_STORAGE_KEY, mode);
    if (changed) counters.modeChanges += 1;

    if (mode === 'off') {
      suspendAudioContext();
    } else if (userGesture) {
      counters.unlockAttempts += 1;
      ensureAudioContext();
      if (mode === 'ensemble' && state.unlocked) primeEnsembleSamples();
    } else {
      state.unlocked = false;
      applyVolume();
    }

    suppressCoreScopeAudio();
    notify();
    return true;
  }

  function setVolume(value) {
    var next = clampVolume(value);
    var changed = state.volume !== next;
    state.volume = next;
    writeStorage(VOLUME_STORAGE_KEY, String(next));
    applyVolume();
    if (changed) counters.volumeChanges += 1;
    notify();
    return true;
  }

  function isUnlocked() {
    updateStatus();
    return state.mode !== 'off' && state.unlocked && audioContextIsRunning();
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return function () {};
    listeners.push(listener);
    try { listener(getState()); }
    catch { /* ignore listener init errors */ }
    return function () {
      listeners = listeners.filter(function (candidate) { return candidate !== listener; });
    };
  }

  function numberFrom(value, fallback) {
    var next = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(next)) return fallback;
    return next;
  }

  function intFrom(value, fallback) {
    var next = Math.round(numberFrom(value, fallback));
    return Number.isFinite(next) ? next : fallback;
  }

  function stringFrom(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  function parseMaybeJson(value) {
    if (!value || typeof value !== 'string') return null;
    try { return JSON.parse(value); }
    catch { return null; }
  }

  function decodedFromPacket(pkt) {
    if (!pkt || typeof pkt !== 'object') return {};
    if (pkt.decoded && typeof pkt.decoded === 'object') return pkt.decoded;
    var decoded = parseMaybeJson(pkt.decoded_json);
    return decoded && typeof decoded === 'object' ? decoded : {};
  }

  function pathFromPacket(pkt, decoded) {
    var path = decoded && decoded.path && typeof decoded.path === 'object' ? decoded.path : {};
    if (Array.isArray(path.hops)) return path.hops;
    var parsed = parseMaybeJson(pkt && pkt.path_json);
    return Array.isArray(parsed) ? parsed : [];
  }

  function firstString(values) {
    for (var i = 0; i < values.length; i++) {
      var value = stringFrom(values[i]).trim();
      if (value) return value;
    }
    return '';
  }

  function firstValue(values) {
    for (var i = 0; i < values.length; i++) {
      if (values[i] != null && values[i] !== '') return values[i];
    }
    return null;
  }

  function isEmergencyChannel(channelName, channelHash, type) {
    var name = stringFrom(channelName).toLowerCase();
    var hash = stringFrom(channelHash).toLowerCase();
    return name.indexOf('emergency') !== -1
        || hash.indexOf('emergency') !== -1
        || stringFrom(type).toUpperCase() === 'EMERGENCY';
  }

  function normalizeChannelHash(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var raw = stringFrom(value).trim();
    if (!raw) return null;
    return raw;
  }

  function eventLane(event) {
    if (event.isPriority) return 'priority';
    if (event.type === 'ADVERT' || event.type === 'NODEINFO') return 'low';
    return 'normal';
  }

  function modeDensityMultiplier() {
    if (state.mode === 'native') return 0.74;
    if (state.mode === 'generative') return 0.9;
    if (state.mode === 'ensemble') return 1;
    if (state.mode === 'chime') return 0.7;
    if (state.mode === 'blaster') return 0.82;
    return 0;
  }

  function pruneTraffic(now) {
    while (trafficState.events.length && now - trafficState.events[0].at > TRAFFIC_WINDOW_MS) {
      trafficState.events.shift();
    }
  }

  function snapshotTraffic(now) {
    now = now || Date.now();
    pruneTraffic(now);
    var weighted = 0;
    var priority = 0;
    var pulse = 0;
    var replay = 0;
    trafficState.events.forEach(function (item) {
      var age = Math.max(0, now - item.at);
      var falloff = Math.max(0, 1 - age / TRAFFIC_WINDOW_MS);
      var laneWeight = item.lane === 'priority' ? 1.7 : item.lane === 'low' ? 0.55 : 1;
      var replayWeight = item.event.isReplay ? 0.62 : 1;
      var contribution = item.event.intensity * laneWeight * replayWeight * (0.28 + falloff * 0.72);
      weighted += contribution;
      if (item.lane === 'priority') priority += contribution;
      if (item.event.isReplay) replay += contribution;
      pulse += falloff * (item.lane === 'low' ? 0.35 : 0.75);
    });
    trafficState.density = clamp((weighted / 7.5) * modeDensityMultiplier(), 0, 1);
    trafficState.priority = clamp(priority / 3.2, 0, 1);
    trafficState.pulse = clamp(pulse / 10, 0, 1);
    trafficState.replay = clamp(replay / 4, 0, 1);
    return trafficSnapshot();
  }

  function ingestTraffic(event, now) {
    now = now || Date.now();
    pruneTraffic(now);
    trafficState.events.push({ at: now, lane: eventLane(event), event: cloneEvent(event) });
    if (trafficState.events.length > 160) trafficState.events.splice(0, trafficState.events.length - 160);
    trafficState.total += 1;
    trafficState.lastUpdatedAt = now;
    counters.ingested += 1;
    counters.densityUpdates += 1;
    return snapshotTraffic(now);
  }

  function clamp(value, min, max) {
    var next = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(next)) return min;
    return Math.max(min, Math.min(max, next));
  }

  function hashSeed(value) {
    var text = stringFrom(value);
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }

  function eventSeed(event, salt) {
    return hashSeed([event.id, event.type, event.channelName, event.channelHash, event.timestamp, salt].join('|'));
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function safeDisconnect(node) {
    if (!node || typeof node.disconnect !== 'function') return;
    try { node.disconnect(); }
    catch { /* node may already be disconnected */ }
  }

  function nearestInScaleMidi(target, root, scale, min, max) {
    var best = root;
    var bestDistance = Infinity;
    for (var octave = -3; octave <= 4; octave++) {
      for (var i = 0; i < scale.length; i++) {
        var midi = root + octave * 12 + scale[i];
        if (midi < min || midi > max) continue;
        var distance = Math.abs(midi - target);
        if (distance < bestDistance) {
          best = midi;
          bestDistance = distance;
        }
      }
    }
    return best;
  }

  function harmonyClockSeconds() {
    if (audioCtx) return audioCtx.currentTime;
    if (typeof performance !== 'undefined' && performance.now) return performance.now() / 1000;
    return Date.now() / 1000;
  }

  function currentHarmonyContext(atSeconds) {
    var now = typeof atSeconds === 'number' ? atSeconds : harmonyClockSeconds();
    var beatSeconds = 60 / HARMONY_TEMPO_BPM;
    var sixteenthSeconds = beatSeconds / 4;
    var barSeconds = beatSeconds * HARMONY_BEATS_PER_BAR;
    var totalBars = Math.floor(now / barSeconds);
    var len = HARMONY_PROGRESSION.length;
    var chordIndex = ((totalBars % len) + len) % len;
    var chord = HARMONY_PROGRESSION[chordIndex];
    var positionInBar = now - totalBars * barSeconds;
    var beatPosition = positionInBar / beatSeconds;
    return {
      now: now,
      chord: chord,
      chordIndex: chordIndex,
      bar: totalBars,
      beatSeconds: beatSeconds,
      sixteenthSeconds: sixteenthSeconds,
      barSeconds: barSeconds,
      beatPosition: beatPosition,
      barPosition: positionInBar,
    };
  }

  function quantizeAudioTime(rawTime) {
    if (!audioCtx) return rawTime;
    var earliest = Math.max(rawTime, audioCtx.currentTime + 0.025);
    var ctx = currentHarmonyContext(earliest);
    var step = ctx.sixteenthSeconds;
    var tickIndex = Math.ceil(earliest / step);
    var snapped = tickIndex * step;
    if (tickIndex % 2 !== 0) snapped += step * 0.14;
    return Math.max(snapped, audioCtx.currentTime + 0.02);
  }

  var MELODIC_PATTERNS = {
    bass:    { degrees: [0,0,0,0,2,2,2,2,0,0,0,0,2,2,2,2], octave: -2 },
    root:    { degrees: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], octave:  0 },
    third:   { degrees: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], octave:  0 },
    fifth:   { degrees: [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], octave:  0 },
    seventh: { degrees: [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3], octave:  0 },
    melody:  { degrees: [0,1,2,1,0,1,2,1,0,2,3,2,0,2,1,0], octave:  0 },
    harmony: { degrees: [1,3,1,3,2,3,1,3,1,3,2,3,1,3,2,3], octave:  0 },
    sparkle: { degrees: [0,1,2,3,2,1,0,3,1,2,3,0,3,2,1,0], octave:  1 },
    support: { degrees: [2,2,1,1,2,2,1,1,2,2,3,3,2,2,1,1], octave:  0 },
  };

  function patternedChordMidi(role, lane, atSeconds) {
    var ctx = currentHarmonyContext(typeof atSeconds === 'number' ? atSeconds : undefined);
    var sixteenth = ctx.sixteenthSeconds || (60 / HARMONY_TEMPO_BPM / 4);
    var barSeconds = ctx.barSeconds || (60 / HARMONY_TEMPO_BPM * HARMONY_BEATS_PER_BAR);
    var t = typeof atSeconds === 'number' ? atSeconds : ctx.now;
    var positionInBar = t - Math.floor(t / barSeconds) * barSeconds;
    var idx = Math.round(positionInBar / sixteenth);
    idx = ((idx % 16) + 16) % 16;
    var pattern = MELODIC_PATTERNS[role] || MELODIC_PATTERNS.melody;
    var degrees = ctx.chord.intervals;
    var degreeIdx = pattern.degrees[idx] % degrees.length;
    var degree = degrees[degreeIdx];
    var laneStr = stringFrom(lane) || 'normal';
    var laneAdjust = 0;
    if (laneStr === 'priority' && role !== 'bass' && role !== 'root') laneAdjust = -1;
    if (laneStr === 'low' && role !== 'bass') laneAdjust = 1;
    return ctx.chord.root + (pattern.octave + laneAdjust) * 12 + degree;
  }

  function scheduleCleanup(nodes, delaySeconds) {
    nodes.forEach(function (node) { scheduledNodes.add(node); });
    var timer = window.setTimeout(function () {
      cleanupTimers.delete(timer);
      nodes.forEach(function (node) {
        scheduledNodes.delete(node);
        safeDisconnect(node);
      });
    }, Math.max(120, Math.min(7000, delaySeconds * 1000)));
    cleanupTimers.add(timer);
    return timer;
  }

  function envelopeGain(gain, start, duration, peak, attack, decay, sustain, release) {
    var floor = 0.0001;
    var attackEnd = start + Math.max(0.004, attack || 0.01);
    var decayEnd = attackEnd + Math.max(0.01, decay || 0.04);
    var releaseStart = start + Math.max(0.02, duration);
    var releaseTime = Math.max(0.02, release || 0.08);
    peak = Math.max(floor, peak);
    sustain = Math.max(floor, Math.min(peak, sustain));
    gain.gain.setValueAtTime(floor, start);
    gain.gain.exponentialRampToValueAtTime(peak, attackEnd);
    gain.gain.exponentialRampToValueAtTime(sustain, decayEnd);
    gain.gain.setTargetAtTime(floor, releaseStart, releaseTime / 4);
    return releaseStart + releaseTime;
  }

  function scheduleTone(frequency, start, duration, options) {
    options = options || {};
    var osc = audioCtx.createOscillator();
    var env = audioCtx.createGain();
    var filter = null;
    var nodes = [osc, env];
    var destination = options.destination || accentGain || masterGain;
    var end = start + duration;
    osc.type = options.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, frequency), start);
    if (options.endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFrequency), Math.max(start + 0.01, end));
    }
    if (options.detune) osc.detune.setValueAtTime(options.detune, start);
    var releaseEnd = envelopeGain(env, start, duration, options.gain || 0.08, options.attack, options.decay, options.sustain || (options.gain || 0.08) * 0.35, options.release);
    osc.connect(env);
    if (options.filterFrequency) {
      filter = audioCtx.createBiquadFilter();
      filter.type = options.filterType || 'lowpass';
      filter.frequency.setValueAtTime(options.filterFrequency, start);
      if (options.endFilterFrequency) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(40, options.endFilterFrequency), Math.max(start + 0.01, end));
      }
      filter.Q.value = options.q || 0.8;
      env.connect(filter);
      filter.connect(destination);
      nodes.push(filter);
    } else {
      env.connect(destination);
    }
    scheduledSources.add(osc);
    osc.start(start);
    osc.stop(releaseEnd + 0.04);
    osc.onended = function () {
      scheduledSources.delete(osc);
      nodes.forEach(function (node) {
        scheduledNodes.delete(node);
        safeDisconnect(node);
      });
    };
    scheduleCleanup(nodes, releaseEnd - audioCtx.currentTime + 0.2);
    return releaseEnd - audioCtx.currentTime;
  }

  function getNoiseBuffer() {
    if (cachedNoiseBuffer) return cachedNoiseBuffer;
    var length = Math.max(1, Math.floor(audioCtx.sampleRate * 0.4));
    cachedNoiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    var data = cachedNoiseBuffer.getChannelData(0);
    for (var i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return cachedNoiseBuffer;
  }

  function scheduleNoiseBurst(start, duration, gainValue, filterFrequency, options) {
    options = options || {};
    var source = audioCtx.createBufferSource();
    var env = audioCtx.createGain();
    var filter = audioCtx.createBiquadFilter();
    var nodes = [source, env, filter];
    var end = start + duration;
    source.buffer = getNoiseBuffer();
    source.loop = true;
    filter.type = options.filterType || 'bandpass';
    filter.frequency.setValueAtTime(filterFrequency || 1600, start);
    if (options.endFilterFrequency) filter.frequency.exponentialRampToValueAtTime(Math.max(40, options.endFilterFrequency), Math.max(start + 0.01, end));
    filter.Q.value = options.q || 1.2;
    envelopeGain(env, start, duration, gainValue, options.attack || 0.004, options.decay || 0.03, gainValue * 0.12, options.release || 0.08);
    source.connect(filter);
    filter.connect(env);
    env.connect(options.destination || accentGain || masterGain);
    scheduledSources.add(source);
    source.start(start);
    source.stop(end + (options.release || 0.08) + 0.05);
    source.onended = function () {
      scheduledSources.delete(source);
      nodes.forEach(function (node) {
        scheduledNodes.delete(node);
        safeDisconnect(node);
      });
    };
    scheduleCleanup(nodes, end - audioCtx.currentTime + 0.4);
    return end - audioCtx.currentTime + (options.release || 0.08);
  }

  function scheduleChime(midi, start, options) {
    options = options || {};
    if (!audioCtx) return 0;
    var baseFreq = midiToFreq(midi);
    var gain = options.gain != null ? options.gain : 0.06;
    var attack = options.attack != null ? options.attack : 0.012;
    var decay = options.decay != null ? options.decay : 0.42;
    var release = options.release != null ? options.release : 1.8;
    var duration = options.duration != null ? options.duration : 0.55;
    var brightness = options.brightness != null ? options.brightness : 0.9;
    var detune = options.detune != null ? options.detune : 6;
    var partials = options.partials || CHIME_PARTIAL_RATIOS;
    var partialGains = options.partialGains || CHIME_PARTIAL_GAINS;
    var destination = options.destination || accentGain || masterGain;
    var filterCeiling = options.maxFilterFrequency != null ? options.maxFilterFrequency : 16500;
    var partialCeiling = options.maxPartialFrequency != null ? options.maxPartialFrequency : 16500;
    var totalRelease = release;
    for (var i = 0; i < partials.length; i++) {
      var ratio = partials[i];
      var freq = baseFreq * ratio;
      if (freq > partialCeiling || freq < 18) continue;
      var weight = partialGains[i] != null ? partialGains[i] : Math.pow(0.55, i);
      var partialGain = gain * weight * brightness;
      if (partialGain < 0.00045) continue;
      var partialDecay = decay * Math.max(0.42, 1 - i * 0.14);
      var partialRelease = release * Math.max(0.36, 1 - i * 0.16);
      var partialDuration = duration * Math.max(0.32, 1 - i * 0.14);
      var ringEnd = scheduleTone(freq, start + i * 0.0015, partialDuration, {
        type: 'sine',
        gain: partialGain,
        attack: attack + i * 0.0025,
        decay: partialDecay,
        sustain: partialGain * 0.18,
        release: partialRelease,
        filterFrequency: Math.min(filterCeiling, baseFreq * (3.0 + brightness * 2.4)),
        q: 0.4,
        detune: i === 0 ? 0 : (i % 2 === 0 ? detune : -detune),
        destination: destination,
      });
      totalRelease = Math.max(totalRelease, ringEnd);
    }
    if (options.airGain && options.airGain > 0) {
      totalRelease = Math.max(totalRelease, scheduleNoiseBurst(start, Math.min(0.18, duration * 0.6), options.airGain, baseFreq * 4.5, {
        attack: 0.012,
        decay: 0.05,
        release: 0.18,
        q: 1.4,
        filterType: 'bandpass',
        destination: destination,
      }));
    }
    return totalRelease;
  }

  function chimeProfileForMode(mode, lane, intensity, burst) {
    var laneStr = stringFrom(lane) || 'normal';
    var hot = clamp(numberFrom(intensity, 0.5), 0.05, 1);
    var burstLift = burst ? 1.2 : 1;
    if (mode === 'chime') {
      return {
        gain: (laneStr === 'priority' ? 0.034 : laneStr === 'low' ? 0.018 : 0.024) * (0.78 + hot * 0.42) * burstLift,
        attack: 0.024,
        decay: 0.7,
        release: laneStr === 'priority' ? 3.2 : laneStr === 'low' ? 2.0 : 2.6,
        duration: laneStr === 'priority' ? 1.0 : laneStr === 'low' ? 0.45 : 0.7,
        brightness: 0.55 + hot * 0.18,
        airGain: 0,
        detune: 10,
        maxFilterFrequency: 3800,
        maxPartialFrequency: 7500,
        partials: [1, 2.756, 5.404, 8.933],
        partialGains: [1, 0.34, 0.14, 0.06],
      };
    }
    if (mode === 'ensemble') {
      return {
        gain: (laneStr === 'priority' ? 0.082 : laneStr === 'low' ? 0.038 : 0.052) * (0.78 + hot * 0.46) * burstLift,
        attack: 0.014,
        decay: laneStr === 'priority' ? 0.7 : 0.55,
        release: laneStr === 'priority' ? 2.4 : laneStr === 'low' ? 1.5 : 2.0,
        duration: laneStr === 'priority' ? 0.85 : laneStr === 'low' ? 0.45 : 0.65,
        brightness: 0.78 + hot * 0.18,
        airGain: laneStr === 'priority' ? 0.012 : 0.006,
        detune: 7,
      };
    }
    if (mode === 'generative') {
      return {
        gain: (laneStr === 'priority' ? 0.07 : laneStr === 'low' ? 0.034 : 0.05) * (0.78 + hot * 0.44) * burstLift,
        attack: 0.01,
        decay: 0.38,
        release: laneStr === 'priority' ? 1.6 : 1.2,
        duration: laneStr === 'priority' ? 0.5 : 0.42,
        brightness: 0.82 + hot * 0.16,
        airGain: 0,
        detune: 5,
      };
    }
    if (mode === 'blaster') {
      return {
        gain: (laneStr === 'priority' ? 0.072 : laneStr === 'low' ? 0.034 : 0.05) * (0.8 + hot * 0.42) * burstLift,
        attack: 0.006,
        decay: 0.26,
        release: laneStr === 'priority' ? 1.0 : 0.78,
        duration: laneStr === 'priority' ? 0.4 : 0.32,
        brightness: 1.0 + hot * 0.16,
        airGain: laneStr === 'priority' ? 0.018 : 0.01,
        detune: 9,
        partials: [1, 2.4, 4.1, 6.7, 9.2],
        partialGains: [1, 0.5, 0.3, 0.18, 0.1],
      };
    }
    return {
      gain: (laneStr === 'priority' ? 0.06 : laneStr === 'low' ? 0.03 : 0.044) * (0.8 + hot * 0.36) * burstLift,
      attack: 0.008,
      decay: 0.26,
      release: laneStr === 'priority' ? 1.0 : 0.72,
      duration: laneStr === 'priority' ? 0.38 : 0.3,
      brightness: 0.88 + hot * 0.14,
      airGain: 0,
      detune: 4,
    };
  }

  function schedulePluck(midi, start, options) {
    options = options || {};
    if (!audioCtx) return 0;
    var baseFreq = midiToFreq(midi);
    var gain = options.gain != null ? options.gain : 0.06;
    var attack = options.attack != null ? options.attack : 0.005;
    var decay = options.decay != null ? options.decay : 0.18;
    var release = options.release != null ? options.release : 0.4;
    var duration = options.duration != null ? options.duration : 0.32;
    var brightness = options.brightness != null ? options.brightness : 0.9;
    var detuneCents = options.detune != null ? options.detune : 7;
    var q = options.q != null ? options.q : 2.1;
    var destination = options.destination || accentGain || masterGain;
    var voices = options.voices || [
      { type: 'sawtooth', detune: 0,             gainScale: 0.46, freqMul: 1 },
      { type: 'sawtooth', detune: detuneCents,   gainScale: 0.36, freqMul: 1 },
      { type: 'sawtooth', detune: -detuneCents,  gainScale: 0.36, freqMul: 1 },
      { type: 'sine',     detune: 0,             gainScale: 0.55, freqMul: 0.5 },
      { type: 'triangle', detune: 3,             gainScale: 0.28, freqMul: 2 },
    ];
    var filterStart = Math.min(15000, baseFreq * (7 + brightness * 7));
    var filterEnd = Math.max(380, baseFreq * (1.4 + brightness * 1.2));
    var total = 0;
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      var freq = baseFreq * v.freqMul;
      if (freq > 16000 || freq < 18) continue;
      var voiceGain = gain * v.gainScale;
      if (voiceGain < 0.0006) continue;
      var voiceFilterStart = filterStart * (v.freqMul > 1 ? 0.7 : 1);
      var voiceFilterEnd = filterEnd * (v.freqMul > 1 ? 0.85 : 1);
      var voiceRelease = release * (v.freqMul > 1 ? 0.82 : 1);
      var voiceDuration = duration * (v.freqMul < 1 ? 1.05 : 1);
      var ringEnd = scheduleTone(freq, start + i * 0.0008, voiceDuration, {
        type: v.type,
        gain: voiceGain,
        attack: attack + (v.freqMul > 1 ? 0.002 : 0),
        decay: decay,
        sustain: voiceGain * 0.18,
        release: voiceRelease,
        filterFrequency: voiceFilterStart,
        endFilterFrequency: voiceFilterEnd,
        q: q,
        detune: v.detune,
        destination: destination,
      });
      total = Math.max(total, ringEnd);
    }
    return total;
  }

  function pluckProfileForMode(mode, lane, intensity, burst) {
    var laneStr = stringFrom(lane) || 'normal';
    var hot = clamp(numberFrom(intensity, 0.5), 0.05, 1);
    var burstLift = burst ? 1.18 : 1;
    if (mode === 'generative') {
      return {
        gain: (laneStr === 'priority' ? 0.082 : laneStr === 'low' ? 0.034 : 0.058) * (0.78 + hot * 0.44) * burstLift,
        attack: 0.005,
        decay: 0.14,
        release: laneStr === 'priority' ? 0.55 : 0.42,
        duration: laneStr === 'priority' ? 0.36 : 0.28,
        brightness: 0.9 + hot * 0.16,
        detune: 8,
        q: 2.0,
      };
    }
    return {
      gain: (laneStr === 'priority' ? 0.088 : laneStr === 'low' ? 0.04 : 0.064) * (0.78 + hot * 0.42) * burstLift,
      attack: 0.004,
      decay: 0.12,
      release: laneStr === 'priority' ? 0.5 : 0.32,
      duration: laneStr === 'priority' ? 0.32 : 0.22,
      brightness: 0.8 + hot * 0.18,
      detune: 6,
      q: 1.8,
    };
  }

  function warnEnsembleOnce(key, message) {
    if (ensembleWarnings[key]) return;
    ensembleWarnings[key] = true;
    try { console.warn('[Colorado Mesh sound]', message); }
    catch { /* console can be unavailable in hardened contexts */ }
  }

  function fetchJson(url) {
    if (typeof window.fetch !== 'function') return Promise.reject(new Error('fetch unavailable'));
    return window.fetch(url, { cache: 'force-cache' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    });
  }

  function loadEnsembleManifest() {
    if (ensembleManifest) return Promise.resolve(ensembleManifest);
    if (ensembleManifestPromise) return ensembleManifestPromise;
    ensembleState.status = 'loading';
    ensembleManifestPromise = fetchJson(ENSEMBLE_MANIFEST_URL).then(function (manifest) {
      if (!manifest || !Array.isArray(manifest.samples) || !manifest.roles) throw new Error('invalid manifest');
      ensembleManifest = manifest;
      ensembleState.status = 'manifest-ready';
      ensembleState.failed = false;
      ensembleState.sampleCount = manifest.samples.length;
      notify();
      return manifest;
    }).catch(function (err) {
      ensembleState.status = 'degraded';
      ensembleState.failed = true;
      warnEnsembleOnce('manifest', 'Orchestral manifest unavailable; using procedural fallback.');
      notify();
      throw err;
    });
    return ensembleManifestPromise;
  }

  function sampleById(id) {
    if (!ensembleManifest || !Array.isArray(ensembleManifest.samples)) return null;
    for (var i = 0; i < ensembleManifest.samples.length; i++) {
      if (ensembleManifest.samples[i].id === id) return ensembleManifest.samples[i];
    }
    return null;
  }

  function ensembleRoleIds(role) {
    if (!ensembleManifest || !ensembleManifest.roles) return [];
    var ids = ensembleManifest.roles[role];
    return Array.isArray(ids) ? ids : [];
  }

  function decodeAudioData(arrayBuffer) {
    return new Promise(function (resolve, reject) {
      var decoded;
      try { decoded = audioCtx.decodeAudioData(arrayBuffer, resolve, reject); }
      catch (err) { reject(err); return; }
      if (decoded && typeof decoded.then === 'function') decoded.then(resolve).catch(reject);
    });
  }

  function loadEnsembleSample(sample) {
    if (!sample || !sample.id || !sample.url) return Promise.reject(new Error('invalid sample'));
    if (ensembleBuffers[sample.id]) return Promise.resolve(ensembleBuffers[sample.id]);
    if (ensembleBufferPromises[sample.id]) return ensembleBufferPromises[sample.id];
    ensembleBufferPromises[sample.id] = window.fetch(sample.url, { cache: 'force-cache' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.arrayBuffer();
    }).then(decodeAudioData).then(function (buffer) {
      ensembleBuffers[sample.id] = buffer;
      ensembleState.loaded = Object.keys(ensembleBuffers).length > 0;
      ensembleState.status = ensembleState.failed ? 'degraded' : Object.keys(ensembleBuffers).length >= ensembleState.sampleCount ? 'ready' : 'loading';
      notify();
      return buffer;
    }).catch(function (err) {
      ensembleState.status = 'degraded';
      ensembleState.failed = true;
      warnEnsembleOnce(sample.id, 'Orchestral sample failed to load: ' + sample.id);
      notify();
      throw err;
    });
    return ensembleBufferPromises[sample.id];
  }

  function primeEnsembleSamples() {
    loadEnsembleManifest().then(function (manifest) {
      manifest.samples.forEach(function (sample) {
        loadEnsembleSample(sample).catch(function () {});
      });
    }).catch(function () {});
  }

  function chooseEnsembleRole(event, options) {
    var lane = eventLane(event);
    if (event.isEmergency) return 'priority';
    if (options && options.coalesced) return 'messages';
    if (event.type === 'ADVERT' || event.type === 'NODEINFO') return 'node';
    if (event.type === 'GRP_TXT' || event.type === 'CHAN' || event.type === 'TEXT') return 'messages';
    if (event.isPriority || lane === 'priority') return 'priority';
    return 'messages';
  }

  function ensembleRoleList(roles) {
    if (Array.isArray(roles)) return roles;
    return roles ? [roles] : ['messages'];
  }

  function loadedSamplesForRole(role) {
    var ids = ensembleRoleIds(role);
    var candidates = [];
    ids.forEach(function (id) {
      var sample = sampleById(id);
      if (sample && ensembleBuffers[id]) candidates.push(sample);
    });
    return candidates;
  }

  function loadedSampleForRole(role, seed, ordinal) {
    var candidates = loadedSamplesForRole(role);
    if (!candidates.length) return null;
    var offset = seed % candidates.length;
    var cursor = ensembleRoundRobin[role] || 0;
    ensembleRoundRobin[role] = cursor + 1;
    return candidates[(offset + cursor + (ordinal || 0)) % candidates.length];
  }

  function loadedSampleForAnyRole(roles, seed, ordinal) {
    var roleNames = ensembleRoleList(roles);
    for (var i = 0; i < roleNames.length; i++) {
      var role = roleNames[i];
      var sample = loadedSampleForRole(role, seed + i * 11, (ordinal || 0) + i);
      if (sample) return { role: role, sample: sample };
    }
    return null;
  }

  function noteForEnsembleEvent(event, role, atSeconds) {
    var lane = eventLane(event);
    if (role === 'priority' || role === 'percussion' || role === 'brass') {
      return patternedChordMidi('root', 'priority', atSeconds);
    }
    if (role === 'node' || role === 'strings') {
      return patternedChordMidi('root', lane, atSeconds);
    }
    return patternedChordMidi('melody', lane, atSeconds);
  }

  function noteForEnsembleLayer(event, role, atSeconds, layer) {
    var lane = eventLane(event);
    var pitchRole = layer.pitch;
    if (pitchRole === 'bass'
      || pitchRole === 'root'
      || pitchRole === 'fifth'
      || pitchRole === 'support'
      || pitchRole === 'harmony'
      || pitchRole === 'melody'
      || pitchRole === 'sparkle'
    ) {
      return patternedChordMidi(pitchRole, lane, atSeconds);
    }
    return noteForEnsembleEvent(event, role, atSeconds);
  }

  function clampSampleMidi(sample, midi) {
    var root = intFrom(sample.rootNote, midi);
    var min = intFrom(sample.minMidi, root - 7);
    var max = intFrom(sample.maxMidi, root + 7);
    if (midi >= min && midi <= max) return midi;
    return nearestInScaleMidi(midi, ENSEMBLE_ROOT_MIDI, ENSEMBLE_SCALE, min, max);
  }

  function rememberSequencerValue(key, listKey, value, limit) {
    sequencerState[key] = value;
    sequencerState[listKey].push(value);
    if (sequencerState[listKey].length > (limit || 24)) sequencerState[listKey].shift();
  }

  function rememberEnsembleTemplate(name) {
    rememberSequencerValue('lastEnsembleTemplate', 'recentEnsembleTemplates', name, 32);
  }

  function rememberEnsembleRole(role) {
    rememberSequencerValue('lastEnsembleRole', 'recentEnsembleRoles', role, 48);
  }

  function scheduleSample(sample, midi, start, duration, gainValue, options) {
    options = options || {};
    var buffer = ensembleBuffers[sample.id];
    if (!buffer) return 0;
    var source = audioCtx.createBufferSource();
    var env = audioCtx.createGain();
    var nodes = [source, env];
    var end = start + duration;
    source.buffer = buffer;
    midi = clampSampleMidi(sample, midi);
    source.playbackRate.value = Math.pow(2, (midi - sample.rootNote) / 12);
    rememberSequencerValue('lastMidi', 'recentMidi', midi);
    rememberSequencerValue('lastSampleId', 'recentSampleIds', sample.id);
    envelopeGain(env, start, duration, gainValue, options.attack || 0.006, options.decay || 0.08, options.sustain || gainValue * 0.45, options.release || 0.18);
    source.connect(env);
    env.connect(options.destination || accentGain || masterGain);
    scheduledSources.add(source);
    source.start(start);
    source.stop(Math.min(start + buffer.duration / source.playbackRate.value, end + (options.release || 0.18) + 0.08));
    source.onended = function () {
      scheduledSources.delete(source);
      nodes.forEach(function (node) {
        scheduledNodes.delete(node);
        safeDisconnect(node);
      });
    };
    scheduleCleanup(nodes, duration + (options.release || 0.18) + 0.4);
    return end - audioCtx.currentTime + (options.release || 0.18);
  }

  function ensembleIntent(event, options) {
    options = options || {};
    var lane = eventLane(event);
    var role = chooseEnsembleRole(event, options);
    var burstCount = Math.max(1, intFrom(options.burstCount, 1));
    var observationCount = Math.max(1, intFrom(event.observationCount, 1));
    var burst = !!options.coalesced || burstCount >= COALESCE_THRESHOLD || observationCount >= 5;
    var templateName = 'message-phrase';
    if (burst && role === 'priority') templateName = 'priority-burst';
    else if (burst) templateName = 'traffic-burst';
    else if (event.isReplay) templateName = 'replay-echo';
    else if (role === 'priority') templateName = 'priority-fanfare';
    else if (role === 'node') templateName = 'node-pizzicato';
    return {
      lane: lane,
      role: role,
      templateName: templateName,
      burstCount: burstCount,
      replay: !!event.isReplay,
      intensity: clamp(event.intensity, 0.05, 1),
    };
  }

  function ensembleTemplate(intent) {
    if (intent.templateName === 'priority-burst') {
      return { name: 'priority-burst', tone: { pitch: 'fifth', offset: 0.04, duration: 0.44, gain: 0.016, type: 'triangle', filterFrequency: 1900 }, layers: [
        { roles: ['priority', 'percussion'], pitch: 'bass', offset: 0, duration: 0.38, gain: 0.12, attack: 0.004, decay: 0.055, sustain: 0.026, release: 0.26 },
        { roles: ['brass', 'priority'], pitch: 'fifth', offset: 0.065, duration: 0.52, gain: 0.068, attack: 0.028, decay: 0.12, sustain: 0.038, release: 0.34 },
        { roles: ['percussion', 'priority'], pitch: 'bass', offset: 0.13, duration: 0.24, gain: 0.05, attack: 0.004, decay: 0.04, sustain: 0.014, release: 0.18 },
        { roles: ['messages', 'woodwinds', 'mallets'], pitch: 'harmony', offset: 0.19, duration: 0.28, gain: 0.036, attack: 0.01, decay: 0.07, sustain: 0.018, release: 0.2 },
      ] };
    }
    if (intent.templateName === 'traffic-burst') {
      return { name: 'traffic-burst', tone: { pitch: 'support', offset: 0.05, duration: 0.34, gain: 0.014, type: 'sine', filterFrequency: 2200 }, layers: [
        { roles: ['priority', 'percussion'], pitch: 'bass', offset: 0, duration: 0.3, gain: 0.076, attack: 0.005, decay: 0.06, sustain: 0.018, release: 0.22 },
        { roles: ['strings', 'node'], pitch: 'support', offset: 0.045, duration: 0.28, gain: 0.044, attack: 0.01, decay: 0.055, sustain: 0.018, release: 0.18 },
        { roles: ['messages', 'woodwinds'], pitch: 'melody', offset: 0.13, duration: 0.3, gain: 0.052, attack: 0.012, decay: 0.07, sustain: 0.022, release: 0.2 },
        { roles: ['mallets', 'messages'], pitch: 'harmony', offset: 0.23, duration: 0.22, gain: 0.034, attack: 0.006, decay: 0.045, sustain: 0.014, release: 0.16 },
      ] };
    }
    if (intent.templateName === 'priority-fanfare') {
      return { name: 'priority-fanfare', tone: { pitch: 'fifth', offset: 0.045, duration: 0.32, gain: 0.014, type: 'triangle', filterFrequency: 1800 }, layers: [
        { roles: ['priority', 'percussion'], pitch: 'bass', offset: 0, duration: 0.34, gain: 0.11, attack: 0.004, decay: 0.06, sustain: 0.024, release: 0.24 },
        { roles: ['brass', 'priority'], pitch: 'fifth', offset: 0.075, duration: 0.44, gain: 0.056, attack: 0.026, decay: 0.1, sustain: 0.03, release: 0.3 },
        { roles: ['messages', 'woodwinds'], pitch: 'harmony', offset: 0.16, duration: 0.24, gain: 0.028, attack: 0.012, decay: 0.06, sustain: 0.014, release: 0.18 },
      ] };
    }
    if (intent.templateName === 'node-pizzicato') {
      return { name: 'node-pizzicato', tone: { pitch: 'support', offset: 0.018, duration: 0.18, gain: 0.01, type: 'sine', filterFrequency: 2600 }, layers: [
        { roles: ['node', 'strings'], pitch: 'root', offset: 0, duration: 0.2, gain: 0.065, attack: 0.006, decay: 0.04, sustain: 0.014, release: 0.14 },
        { roles: ['mallets', 'messages'], pitch: 'harmony', offset: 0.075, duration: 0.22, gain: 0.032, attack: 0.006, decay: 0.045, sustain: 0.014, release: 0.16 },
      ] };
    }
    if (intent.templateName === 'replay-echo') {
      return { name: 'replay-echo', tone: null, layers: [
        { roles: ['woodwinds', 'messages'], pitch: 'melody', offset: 0, duration: 0.24, gain: 0.046, attack: 0.018, decay: 0.07, sustain: 0.016, release: 0.22 },
        { roles: ['mallets', 'messages'], pitch: 'harmony', offset: 0.14, duration: 0.2, gain: 0.026, attack: 0.012, decay: 0.05, sustain: 0.01, release: 0.18 },
      ] };
    }
    return { name: 'message-phrase', tone: { pitch: 'support', offset: 0.045, duration: 0.24, gain: 0.012, type: 'sine', filterFrequency: 2800 }, layers: [
      { roles: ['messages', 'woodwinds'], pitch: 'melody', offset: 0, duration: 0.3, gain: 0.078, attack: 0.01, decay: 0.07, sustain: 0.028, release: 0.2 },
      { roles: ['woodwinds', 'messages'], pitch: 'harmony', offset: 0.11, duration: 0.26, gain: 0.038, attack: 0.012, decay: 0.06, sustain: 0.016, release: 0.18 },
      { roles: ['mallets', 'messages'], pitch: 'harmony', offset: 0.19, duration: 0.2, gain: 0.029, attack: 0.006, decay: 0.045, sustain: 0.012, release: 0.15 },
    ] };
  }

  function hasLoadedEnsembleTemplate(template) {
    for (var i = 0; i < template.layers.length; i++) {
      var roles = ensembleRoleList(template.layers[i].roles);
      for (var j = 0; j < roles.length; j++) {
        if (loadedSamplesForRole(roles[j]).length) return true;
      }
    }
    return false;
  }

  function ensembleLayerGain(layer, intent) {
    var burstLift = Math.min(1.26, 1 + Math.max(0, intent.burstCount - 1) * 0.045);
    var replayTrim = intent.replay ? 0.62 : 1;
    return layer.gain * (0.7 + intent.intensity * 0.48) * burstLift * replayTrim;
  }

  function scheduleEnsembleLayer(event, intent, layer, start, seed, ordinal) {
    var selected = loadedSampleForAnyRole(layer.roles, seed + intFrom(layer.seedOffset, 0), ordinal + intFrom(layer.ordinalOffset, 0));
    if (!selected) return 0;
    var layerStart = start + numberFrom(layer.offset, 0);
    var midi = noteForEnsembleLayer(event, selected.role, layerStart, layer);
    var total = scheduleSample(selected.sample, midi, layerStart, numberFrom(layer.duration, 0.24), ensembleLayerGain(layer, intent), {
      attack: layer.attack,
      decay: layer.decay,
      sustain: layer.sustain,
      release: layer.release,
    });
    if (total) rememberEnsembleRole(selected.role);
    return total;
  }

  function scheduleEnsembleTone(event, intent, template, start) {
    if (!template.tone) return 0;
    var tone = template.tone;
    var toneStart = start + numberFrom(tone.offset, 0);
    var midi = noteForEnsembleLayer(event, intent.role, toneStart, tone);
    var gain = tone.gain * (0.7 + intent.intensity * 0.35) * (intent.replay ? 0.55 : 1);
    return scheduleTone(midiToFreq(midi), toneStart, numberFrom(tone.duration, 0.22), {
      type: tone.type || 'sine',
      gain: gain,
      attack: tone.attack || 0.024,
      decay: tone.decay || 0.08,
      sustain: gain * 0.3,
      release: tone.release || 0.2,
      filterFrequency: tone.filterFrequency || 2400,
      q: 0.4,
    });
  }

  function fallbackEnsemble(event, options) {
    var lane = eventLane(event);
    if (lane === 'priority') return playGenerative(event, options);
    return playNative(event, options);
  }

  function playEnsemble(event, options) {
    options = options || {};
    if (!ensembleManifest) {
      primeEnsembleSamples();
      return fallbackEnsemble(event, options);
    }
    var intent = ensembleIntent(event, options);
    var template = ensembleTemplate(intent);
    var seed = eventSeed(event, 'ensemble');
    if (!hasLoadedEnsembleTemplate(template)) {
      primeEnsembleSamples();
      return fallbackEnsemble(event, options);
    }
    return scheduleModeCue('ensemble', event, function (soundEvent, cueOptions) {
      var rawStart = cueOptions.start || audioCtx.currentTime + 0.018;
      var start = quantizeAudioTime(rawStart);
      var soundIntent = ensembleIntent(soundEvent, cueOptions);
      var soundTemplate = ensembleTemplate(soundIntent);
      var total = 0;
      rememberEnsembleTemplate(soundTemplate.name);
      for (var i = 0; i < soundTemplate.layers.length; i++) {
        total = Math.max(total, scheduleEnsembleLayer(soundEvent, soundIntent, soundTemplate.layers[i], start, seed + i * 17, (cueOptions.ordinal || 0) + i));
      }
      total = Math.max(total, scheduleEnsembleTone(soundEvent, soundIntent, soundTemplate, start));
      return total || 0.08;
    }, options);
  }

  function cooldownForMode(mode, event) {
    var lane = eventLane(event);
    if (mode === 'ensemble') return lane === 'priority' ? 60 : lane === 'low' ? 200 : 90;
    if (mode === 'chime') return lane === 'priority' ? 50 : lane === 'low' ? 220 : 80;
    if (mode === 'generative') return lane === 'priority' ? 40 : lane === 'low' ? 180 : 70;
    if (mode === 'blaster') return lane === 'priority' ? 50 : lane === 'low' ? 180 : 80;
    return lane === 'priority' ? 30 : lane === 'low' ? 120 : 55;
  }

  function scheduleModeCue(mode, event, play, options) {
    options = options || {};
    if (!audioCtx || !masterGain || state.mode === 'off' || !audioContextIsRunning()) return false;
    var lane = eventLane(event);
    var nowMs = Date.now();
    var key = mode + ':' + lane;
    if (activeVoices >= maxActiveVoices) {
      counters.throttled += 1;
      rememberAccentDrop('audio-cap');
      return false;
    }
    if (!options.sequenced && nowMs - (modeCooldowns[key] || 0) < cooldownForMode(mode, event)) {
      counters.throttled += 1;
      rememberAccentDrop('audio-cooldown:' + lane);
      return false;
    }
    if (!options.sequenced) modeCooldowns[key] = nowMs;
    activeVoices += 1;
    try {
      var generation = cueGeneration;
      var duration = Math.max(0.05, numberFrom(play(event, options), 0.25));
      var timer = window.setTimeout(function () {
        cleanupTimers.delete(timer);
        if (generation === cueGeneration) activeVoices = Math.max(0, activeVoices - 1);
      }, Math.min(6500, duration * 1000 + 250));
      cleanupTimers.add(timer);
      return true;
    } catch {
      activeVoices = Math.max(0, activeVoices - 1);
      rememberDrop('audio-error');
      return false;
    }
  }

  function currentMusicStep(event) {
    var lane = eventLane(event);
    if (lane === 'priority') return 0.07;
    if (lane === 'low') return 0.11;
    return 0.085;
  }

  function drainMusicQueue() {
    if (!audioCtx || state.mode === 'off' || !audioContextIsRunning()) {
      clearMusicQueue();
      return;
    }
    var now = audioCtx.currentTime;
    if (!musicNextTime || musicNextTime < now + 0.025) musicNextTime = quantizeAudioTime(now + 0.035);
    var horizon = now + MUSIC_SCHEDULE_AHEAD_SECONDS;
    var scheduled = 0;
    while (musicQueue.length && musicNextTime <= horizon && scheduled < 24 && activeVoices < maxActiveVoices) {
      var item = musicQueue.shift();
      sequencerState.queued = musicQueue.length;
      var accepted = playCurrentMode(item.event, {
        start: musicNextTime,
        ordinal: item.ordinal,
        sequenced: true,
        coalesced: item.coalesced,
        burstCount: item.burstCount,
        admissionReason: item.admissionReason,
      });
      if (accepted) {
        sequencerState.scheduled += 1;
        counters.played += 1;
        lastEvent = cloneEvent(item.event);
      }
      musicNextTime += currentMusicStep(item.event);
      scheduled += 1;
    }
    if (!musicQueue.length && musicTimer) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function cueEventSnapshot(event, ordinal, meta) {
    meta = meta || {};
    return {
      mode: state.mode,
      type: event.type,
      lane: eventLane(event),
      ordinal: ordinal,
      coalesced: !!meta.coalesced,
      burstCount: meta.burstCount || 1,
      admissionReason: meta.admissionReason || 'admitted',
    };
  }

  function enqueueMusicalEvent(event, meta) {
    meta = meta || {};
    if (!audioCtx || state.mode === 'off' || !audioContextIsRunning()) return false;
    var ordinal = musicOrdinal += 1;
    if (musicQueue.length >= MUSIC_QUEUE_MAX) {
      var keep = Math.max(0, MUSIC_QUEUE_MAX - 12);
      musicQueue.splice(0, musicQueue.length - keep);
      sequencerState.coalesced += 1;
      counters.coalesced += 1;
      counters.queueTrimmed += 1;
    }
    var item = {
      event: cloneEvent(event),
      ordinal: ordinal,
      coalesced: !!meta.coalesced,
      burstCount: meta.burstCount || 1,
      admissionReason: meta.admissionReason || 'admitted',
    };
    musicQueue.push(item);
    sequencerState.queued = musicQueue.length;
    sequencerState.lastCue = cueEventSnapshot(event, ordinal, item);
    if (item.coalesced) {
      sequencerState.coalesced += 1;
      counters.coalesced += 1;
      counters.burstAccents += 1;
      sequencerState.lastBurst = sequencerState.lastCue;
    }
    if (!musicTimer) musicTimer = window.setInterval(drainMusicQueue, MUSIC_TICK_MS);
    drainMusicQueue();
    return true;
  }

  function playNative(event, options) {
    options = options || {};
    return scheduleModeCue('native', event, function (soundEvent, cueOptions) {
      var lane = eventLane(soundEvent);
      var rawStart = cueOptions.start || audioCtx.currentTime + 0.018;
      var start = quantizeAudioTime(rawStart);
      var intensity = clamp(soundEvent.intensity, 0.05, 1);
      var role = lane === 'priority' ? 'root' : 'melody';
      var midi = patternedChordMidi(role, lane, start);
      var profile = pluckProfileForMode('native', lane, intensity, !!cueOptions.coalesced);
      var total = schedulePluck(midi, start, profile);
      rememberSequencerValue('lastMidi', 'recentMidi', midi);
      if (lane === 'priority') {
        var supportMidi = patternedChordMidi('fifth', lane, start + 0.06);
        total = Math.max(total, schedulePluck(supportMidi, start + 0.06, Object.assign({}, profile, {
          gain: profile.gain * 0.55,
          duration: profile.duration * 0.72,
          release: profile.release * 0.72,
          brightness: profile.brightness * 0.92,
        })));
        rememberSequencerValue('lastMidi', 'recentMidi', supportMidi);
      }
      return total;
    }, options);
  }

  function playGenerative(event, options) {
    options = options || {};
    return scheduleModeCue('generative', event, function (soundEvent, cueOptions) {
      var seed = eventSeed(soundEvent, 'generative') + (cueOptions.ordinal || 0);
      var lane = eventLane(soundEvent);
      var rawStart = cueOptions.start || audioCtx.currentTime + 0.025;
      var start = quantizeAudioTime(rawStart);
      var intensity = clamp(soundEvent.intensity, 0.05, 1);
      var hopCount = Math.max(1, intFrom(soundEvent.hopCount, 1));
      var notes = lane === 'priority' ? 4 : lane === 'low' ? 1 : 2 + (seed % 2);
      var ctx = currentHarmonyContext();
      var gap = lane === 'priority' ? ctx.sixteenthSeconds * 0.95 : ctx.sixteenthSeconds * 1.15;
      var profile = pluckProfileForMode('generative', lane, intensity, !!cueOptions.coalesced);
      var arpRoles = lane === 'priority'
        ? ['root', 'fifth', 'seventh', 'melody']
        : lane === 'low'
          ? ['melody']
          : ['melody', 'harmony', 'fifth'];
      var total = 0;
      for (var i = 0; i < notes; i++) {
        var role = arpRoles[(i + hopCount) % arpRoles.length];
        var noteStart = start + i * gap;
        var midi = patternedChordMidi(role, lane, noteStart);
        var noteProfile = Object.assign({}, profile, {
          gain: profile.gain * (i === 0 ? 1 : Math.max(0.55, 1 - i * 0.12)),
          duration: profile.duration * (i === 0 ? 1 : 0.82),
          brightness: profile.brightness * (i === 0 ? 1 : 1.04),
        });
        total = Math.max(total, schedulePluck(midi, noteStart, noteProfile));
        rememberSequencerValue('lastMidi', 'recentMidi', midi);
      }
      if (lane === 'priority' || soundEvent.observationCount >= 4) {
        var chordStart = start + notes * gap + 0.04;
        ['root', 'third', 'fifth'].forEach(function (role, idx) {
          var midi = patternedChordMidi(role, lane, chordStart + idx * 0.005);
          var chordProfile = Object.assign({}, profile, {
            gain: profile.gain * (0.45 - idx * 0.08),
            duration: profile.duration * 1.4,
            release: profile.release * 1.3,
            brightness: profile.brightness * 0.88,
          });
          total = Math.max(total, schedulePluck(midi, chordStart, chordProfile));
          rememberSequencerValue('lastMidi', 'recentMidi', midi);
        });
      }
      return total;
    }, options);
  }

  function blasterPatchForEvent(event, options) {
    options = options || {};
    var lane = eventLane(event);
    var burstCount = Math.max(1, intFrom(options.burstCount, 1));
    var observationCount = Math.max(1, intFrom(event.observationCount, 1));
    var burst = !!options.coalesced || burstCount >= COALESCE_THRESHOLD || observationCount >= 5;
    if (burst && lane === 'priority') {
      return { name: 'priority-surge', lane: lane, rootMidi: 48, degrees: [0, 3, 7, 10], glide: 2, type: 'triangle', duration: 0.28, gain: 0.06, attack: 0.018, decay: 0.07, sustain: 0.02, release: 0.22, filterFrequency: 2300, endFilterFrequency: 1300, q: 1.1, supportInterval: 12, supportOffset: 0.08, supportDuration: 0.28, supportGain: 0.026, supportQ: 0.55, extraInterval: 7, extraOffset: 0.16, extraDuration: 0.22, extraGain: 0.018, noiseGain: 0.022, noiseDuration: 0.07, noiseOffset: 0.035, noiseFrequency: 1180, noiseQ: 1.05, burstCount: burstCount, coalesced: !!options.coalesced };
    }
    if (burst) {
      return { name: 'traffic-sweep', lane: lane, rootMidi: 50, degrees: [0, 3, 5, 7], glide: -1, type: 'triangle', duration: 0.24, gain: 0.05, attack: 0.02, decay: 0.065, sustain: 0.017, release: 0.2, filterFrequency: 2050, endFilterFrequency: 1150, q: 0.95, supportInterval: 10, supportOffset: 0.07, supportDuration: 0.22, supportGain: 0.021, supportQ: 0.5, extraInterval: 5, extraOffset: 0.15, extraDuration: 0.18, extraGain: 0.015, noiseGain: 0.014, noiseDuration: 0.055, noiseOffset: 0.04, noiseFrequency: 980, noiseQ: 0.9, burstCount: burstCount, coalesced: !!options.coalesced };
    }
    if (lane === 'priority') {
      return { name: 'priority-chime', lane: lane, rootMidi: 50, degrees: [0, 3, 7, 10], glide: 1, type: 'triangle', duration: 0.24, gain: 0.054, attack: 0.016, decay: 0.06, sustain: 0.018, release: 0.18, filterFrequency: 2400, endFilterFrequency: 1450, q: 0.95, supportInterval: 12, supportOffset: 0.075, supportDuration: 0.2, supportGain: 0.022, supportQ: 0.5, noiseGain: 0.012, noiseDuration: 0.045, noiseOffset: 0.03, noiseFrequency: 1100, noiseQ: 0.85, burstCount: burstCount, coalesced: false };
    }
    if (lane === 'low') {
      return { name: 'node-beacon', lane: lane, rootMidi: 52, degrees: [0, 3, 7], glide: -1, type: 'sine', duration: 0.16, gain: 0.032, attack: 0.018, decay: 0.05, sustain: 0.012, release: 0.13, filterFrequency: 1550, endFilterFrequency: 1050, q: 0.65, supportInterval: 7, supportOffset: 0.055, supportDuration: 0.14, supportGain: 0.012, supportQ: 0.42, noiseGain: 0, noiseDuration: 0, noiseOffset: 0, noiseFrequency: 0, noiseQ: 0, burstCount: burstCount, coalesced: false };
    }
    return { name: 'signal-pulse', lane: lane, rootMidi: 53, degrees: [0, 3, 7, 10], glide: -2, type: 'triangle', duration: 0.19, gain: 0.04, attack: 0.016, decay: 0.052, sustain: 0.014, release: 0.16, filterFrequency: 2100, endFilterFrequency: 1200, q: 0.8, supportInterval: 7, supportOffset: 0.07, supportDuration: 0.16, supportGain: 0.016, supportQ: 0.45, noiseGain: 0.006, noiseDuration: 0.035, noiseOffset: 0.028, noiseFrequency: 920, noiseQ: 0.7, burstCount: burstCount, coalesced: false };
  }

  function blasterCueGain(value, intensity, replay) {
    return value * (0.74 + clamp(intensity, 0.05, 1) * 0.42) * (replay ? 0.62 : 1);
  }

  function rememberBlasterCue(cue) {
    rememberSequencerValue('lastBlasterFrequency', 'recentBlasterFrequencies', cue.maxFrequency);
    rememberSequencerValue('lastBlasterPatch', 'recentBlasterPatches', cue.patch);
    rememberSequencerValue('lastBlasterPitch', 'recentBlasterPitches', cue);
    rememberSequencerValue('lastBlasterCue', 'recentBlasterCues', cue, 48);
  }

  function blasterRoleFromPatch(name, lane) {
    if (name === 'priority-surge') return 'root';
    if (name === 'traffic-sweep') return 'fifth';
    if (name === 'priority-chime') return lane === 'priority' ? 'root' : 'fifth';
    if (name === 'node-beacon') return 'sparkle';
    return 'melody';
  }

  function clampBlasterMidi(midi) {
    var m = midi;
    while (m < 48) m += 12;
    while (m > 67) m -= 12;
    return m;
  }

  function playBlaster(event, options) {
    options = options || {};
    return scheduleModeCue('blaster', event, function (soundEvent, cueOptions) {
      var seed = eventSeed(soundEvent, 'blaster') + (cueOptions.ordinal || 0);
      var rawStart = cueOptions.start || audioCtx.currentTime + 0.012;
      var start = quantizeAudioTime(rawStart);
      var intensity = clamp(soundEvent.intensity, 0.05, 1);
      var patch = blasterPatchForEvent(soundEvent, cueOptions);
      var lane = patch.lane;
      var role = blasterRoleFromPatch(patch.name, lane);
      var baseMidi = clampBlasterMidi(patternedChordMidi(role, lane, start));
      var supportMidi = clampBlasterMidi(patternedChordMidi('third', lane, start + (patch.supportOffset || 0.06)));
      if (supportMidi === baseMidi) supportMidi = clampBlasterMidi(baseMidi + 5);
      var extraMidi = patch.extraInterval ? clampBlasterMidi(patternedChordMidi('fifth', lane, start + (patch.extraOffset || 0.12))) : null;
      var base = midiToFreq(baseMidi);
      var support = midiToFreq(supportMidi);
      var endMidi = baseMidi + (patch.glide || 0);
      var end = midiToFreq(endMidi);
      var extraFreq = extraMidi !== null ? midiToFreq(extraMidi) : 0;
      var maxFrequency = Math.max(base, end, support, extraFreq);
      var replayTrim = soundEvent.isReplay ? 0.62 : 1;
      var total = scheduleTone(base, start, patch.duration, {
        type: patch.type,
        endFrequency: end,
        gain: blasterCueGain(patch.gain, intensity, soundEvent.isReplay),
        attack: patch.attack,
        decay: patch.decay,
        sustain: patch.sustain,
        release: patch.release,
        filterFrequency: patch.filterFrequency,
        endFilterFrequency: patch.endFilterFrequency,
        q: patch.q,
      });
      total = Math.max(total, scheduleTone(support, start + patch.supportOffset, patch.supportDuration, {
        type: 'sine',
        gain: blasterCueGain(patch.supportGain, intensity, soundEvent.isReplay),
        attack: 0.026,
        decay: 0.07,
        sustain: patch.supportGain * 0.35,
        release: patch.release,
        filterFrequency: Math.max(780, patch.filterFrequency * 0.58),
        endFilterFrequency: Math.max(620, patch.endFilterFrequency * 0.62),
        q: patch.supportQ,
      }));
      if (extraFreq) {
        total = Math.max(total, scheduleTone(extraFreq, start + patch.extraOffset, patch.extraDuration, {
          type: 'sine',
          gain: blasterCueGain(patch.extraGain, intensity, soundEvent.isReplay),
          attack: 0.02,
          decay: 0.06,
          sustain: patch.extraGain * 0.3,
          release: patch.release * 0.75,
          filterFrequency: Math.max(760, patch.filterFrequency * 0.5),
          endFilterFrequency: Math.max(560, patch.endFilterFrequency * 0.58),
          q: 0.48,
        }));
      }
      if (patch.noiseGain > 0) {
        total = Math.max(total, scheduleNoiseBurst(start + patch.noiseOffset, patch.noiseDuration, blasterCueGain(patch.noiseGain, intensity, soundEvent.isReplay) * replayTrim, patch.noiseFrequency + (seed % 120), {
          q: patch.noiseQ,
          attack: 0.008,
          decay: 0.03,
          release: 0.075,
          filterType: 'bandpass',
        }));
      }
      var cueDuration = Math.max(
        patch.duration + patch.release,
        patch.supportOffset + patch.supportDuration + patch.release,
        patch.extraInterval ? patch.extraOffset + patch.extraDuration + patch.release * 0.75 : 0,
        patch.noiseGain > 0 ? patch.noiseOffset + patch.noiseDuration + 0.075 : 0
      );
      var cue = {
        patch: patch.name,
        lane: patch.lane,
        baseFrequency: base,
        endFrequency: end,
        maxFrequency: maxFrequency,
        semitoneGlide: Math.abs(12 * Math.log(end / base) / Math.log(2)),
        filterQ: Math.max(patch.q, patch.supportQ, patch.noiseQ || 0),
        noiseGain: patch.noiseGain,
        duration: cueDuration,
        coalesced: patch.coalesced,
        burstCount: patch.burstCount,
      };
      rememberBlasterCue(cue);
      rememberSequencerValue('lastMidi', 'recentMidi', baseMidi);
      return total;
    }, options);
  }

  function liftToChimeRegister(midi) {
    var m = midi;
    while (m < 76) m += 12;
    while (m > 96) m -= 12;
    return m;
  }

  function playChime(event, options) {
    options = options || {};
    return scheduleModeCue('chime', event, function (soundEvent, cueOptions) {
      var seed = eventSeed(soundEvent, 'chime') + (cueOptions.ordinal || 0);
      var lane = eventLane(soundEvent);
      var rawStart = cueOptions.start || audioCtx.currentTime + 0.02;
      var start = quantizeAudioTime(rawStart);
      var intensity = clamp(soundEvent.intensity, 0.05, 1);
      var profile = chimeProfileForMode('chime', lane, intensity, !!cueOptions.coalesced);
      var tubes = lane === 'priority' ? 3 : lane === 'low' ? 1 : 2;
      var tubeRoles = ['sparkle', 'melody', 'harmony'];
      var total = 0;
      for (var i = 0; i < tubes; i++) {
        var role = tubeRoles[i % tubeRoles.length];
        var jitter = ((seed + i * 31) % 26) * 0.001;
        var tubeStart = start + i * 0.022 + jitter;
        var midi = liftToChimeRegister(patternedChordMidi(role, lane, tubeStart));
        var tubeProfile = Object.assign({}, profile, {
          gain: profile.gain * (i === 0 ? 1 : (0.6 - i * 0.12)),
          brightness: profile.brightness * (1 + i * 0.04),
          detune: profile.detune + (i % 2 === 0 ? i * 3 : -i * 3),
          airGain: i === 0 ? profile.airGain : profile.airGain * 0.35,
          release: profile.release * (i === 0 ? 1 : 0.85),
        });
        total = Math.max(total, scheduleChime(midi, tubeStart, tubeProfile));
        rememberSequencerValue('lastMidi', 'recentMidi', midi);
      }
      return total;
    }, options);
  }

  function playCurrentMode(event, options) {
    if (state.mode === 'native') return playNative(event, options);
    if (state.mode === 'generative') return playGenerative(event, options);
    if (state.mode === 'blaster') return playBlaster(event, options);
    if (state.mode === 'ensemble') return playEnsemble(event, options);
    if (state.mode === 'chime') return playChime(event, options);
    return false;
  }

  function normalizePacket(pkt) {
    if (!pkt || typeof pkt !== 'object') return null;
    var decoded = decodedFromPacket(pkt);
    var header = decoded.header || {};
    var payload = decoded.payload || decoded;
    var type = firstString([
      header.payloadTypeName,
      header.type,
      payload.payloadTypeName,
      payload.type,
      pkt.type,
    ]).toUpperCase() || 'UNKNOWN';
    var hops = pathFromPacket(pkt, decoded);
    var hash = firstString([
      pkt.hash,
      pkt.packet && pkt.packet.hash,
      payload.hash,
      pkt.id,
    ]);
    if (!hash && type === 'UNKNOWN') return null;

    var channelName = firstString([
      payload.channelName,
      payload.channel,
      payload.channel_name,
      decoded.channelName,
      pkt.channelName,
      pkt.channel,
    ]);
    var channelHash = normalizeChannelHash(firstValue([
      payload.channelHash,
      payload.channelHashByte,
      payload.channel_hash,
      decoded.channelHash,
      decoded.channelHashByte,
      pkt.channelHash,
      pkt.channelHashByte,
    ]));
    var observationCount = Math.max(1, intFrom(pkt.observation_count || (pkt.packet && pkt.packet.observation_count), 1));
    var hopCount = Math.max(1, intFrom(hops.length || payload.hopCount || decoded.hopCount || pkt.hop_count, 1));
    var isEmergency = isEmergencyChannel(channelName, channelHash, type);
    var isPriority = isEmergency || type === 'GRP_TXT' || type === 'CHAN' || observationCount >= 4;
    var timestamp = intFrom(pkt._ts || pkt.timestamp || pkt.received_at || Date.now(), Date.now());
    var seed = hashSeed([hash, type, channelName, channelHash, observationCount, hopCount, timestamp].join('|'));
    var typeWeight = type === 'GRP_TXT' || type === 'TEXT' || type === 'CHAN' ? 0.18 : type === 'NODEINFO' || type === 'ADVERT' ? 0.08 : 0.12;
    var intensity = Math.max(0.05, Math.min(1, 0.14 + typeWeight + Math.min(observationCount, 8) * 0.055 + Math.min(hopCount, 8) * 0.025 + (seed % 37) / 370));
    var isReplay = !!(pkt.replay || pkt.isReplay || pkt.historical || pkt.playback || pkt._replay);

    return {
      id: hash || [type, channelName || channelHash || 'no-channel', timestamp].join(':'),
      type: type,
      modeHint: eventLane({ type: type, isPriority: isPriority }),
      channelName: channelName || null,
      channelHash: channelHash,
      isEmergency: isEmergency,
      isPriority: isPriority,
      isReplay: isReplay,
      observationCount: observationCount,
      hopCount: hopCount,
      intensity: intensity,
      seed: seed,
      timestamp: timestamp,
    };
  }

  function rememberDrop(reason) {
    counters.dropped += 1;
    lastDroppedReason = reason;
  }

  function rememberAccentDrop(reason) {
    counters.accentDropped += 1;
    lastDroppedReason = reason;
  }

  function pruneDedupe(now) {
    dedupeSeen.forEach(function (seenAt, id) {
      if (now - seenAt > dedupeWindowMs) dedupeSeen.delete(id);
    });
  }

  function acceptDedupe(event, now) {
    if (!event.id) return { accepted: true, reason: 'dedupe-ok' };
    pruneDedupe(now);
    var seenAt = dedupeSeen.get(event.id);
    if (seenAt && now - seenAt < dedupeWindowMs) {
      counters.deduped += 1;
      rememberAccentDrop('dedupe');
      return { accepted: false, reason: 'dedupe' };
    }
    dedupeSeen.set(event.id, now);
    return { accepted: true, reason: 'dedupe-ok' };
  }

  function acceptBucket(event, now) {
    var lane = eventLane(event);
    var bucket = buckets[lane] || buckets.normal;
    var elapsed = Math.max(0, (now - bucket.updatedAt) / 1000);
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsed * bucket.refillPerSecond);
    bucket.updatedAt = now;
    if (bucket.tokens < 1) {
      counters.throttled += 1;
      rememberAccentDrop('throttle:' + lane);
      return { accepted: false, reason: 'throttle:' + lane };
    }
    bucket.tokens -= 1;
    return { accepted: true, reason: 'bucket-ok' };
  }

  function recordAdmission(event, accepted, reason, meta) {
    sequencerState.lastAdmission = Object.assign({
      type: event.type,
      lane: eventLane(event),
      accepted: !!accepted,
      reason: reason,
    }, meta || {});
  }

  function coalesceKeyFor(event) {
    return [state.mode, eventLane(event), event.type || 'UNKNOWN'].join(':');
  }

  function pruneCoalesceState(now) {
    coalesceState.forEach(function (entry, key) {
      if (now - entry.lastAt > COALESCE_STALE_MS) coalesceState.delete(key);
    });
    while (coalesceState.size > COALESCE_MAX_KEYS) {
      coalesceState.delete(coalesceState.keys().next().value);
    }
  }

  function maybeCoalesceDeniedAccent(event, reason, now) {
    var lane = eventLane(event);
    if (lane === 'low' || activeVoices >= maxActiveVoices) return null;
    pruneCoalesceState(now);
    var key = coalesceKeyFor(event);
    var entry = coalesceState.get(key);
    if (!entry) entry = { denied: 0, lastAt: now, event: null };
    entry.denied += 1;
    entry.lastAt = now;
    entry.reason = reason;
    entry.event = cloneEvent(event);
    coalesceState.set(key, entry);
    if (entry.denied < COALESCE_THRESHOLD) return null;
    var burstCount = entry.denied;
    coalesceState.delete(key);
    var burstEvent = Object.assign({}, event, {
      id: [event.id || key, 'burst', now].join(':'),
      observationCount: Math.max(intFrom(event.observationCount, 1), burstCount),
      intensity: clamp(numberFrom(event.intensity, 0.4) + Math.min(0.28, burstCount * 0.035), 0.05, 1),
      seed: eventSeed(event, 'coalesced-' + burstCount + '-' + now),
      timestamp: event.timestamp || now,
    });
    return { event: burstEvent, burstCount: burstCount, reason: reason };
  }

  function markPlayed(event, meta) {
    var accepted = enqueueMusicalEvent(event, meta);
    if (!accepted) return false;
    lastEvent = cloneEvent(event);
    return true;
  }

  function routeEvent(event) {
    if (!event) {
      counters.malformed += 1;
      rememberDrop('malformed');
      notify();
      return false;
    }
    if (state.mode === 'off') {
      counters.off += 1;
      rememberDrop('off');
      notify();
      return false;
    }
    if (!state.unlocked || !state.available) {
      counters.locked += 1;
      rememberDrop(state.available ? 'locked' : 'unavailable');
      notify();
      return false;
    }
    if (!audioContextIsRunning()) {
      state.unlocked = false;
      stopAllScheduledCues();
      applyVolume();
      counters.locked += 1;
      rememberDrop(state.available ? 'suspended' : 'unavailable');
      notify();
      return false;
    }

    var now = Date.now();
    var traffic = ingestTraffic(event, now);
    updateDensityOutput(traffic);
    var dedupeAdmission = acceptDedupe(event, now);
    var bucketAdmission = dedupeAdmission.accepted ? acceptBucket(event, now) : { accepted: false, reason: dedupeAdmission.reason };
    var accepted = false;

    if (dedupeAdmission.accepted && bucketAdmission.accepted) {
      counters.admitted += 1;
      recordAdmission(event, true, 'admitted', { coalesced: false, burstCount: 1 });
      accepted = markPlayed(event, { admissionReason: 'admitted' });
    } else {
      var deniedReason = dedupeAdmission.accepted ? bucketAdmission.reason : dedupeAdmission.reason;
      var burst = maybeCoalesceDeniedAccent(event, deniedReason, now);
      if (burst) {
        counters.admitted += 1;
        recordAdmission(burst.event, true, 'coalesced:' + deniedReason, { coalesced: true, burstCount: burst.burstCount });
        accepted = markPlayed(burst.event, {
          coalesced: true,
          burstCount: burst.burstCount,
          admissionReason: 'coalesced:' + deniedReason,
        });
      } else {
        recordAdmission(event, false, deniedReason, { coalesced: false, burstCount: 1 });
      }
    }

    counters.routed += 1;
    if (event.isPriority) counters.priority += 1;
    if (accepted) {
      lastDroppedReason = null;
    } else if (dedupeAdmission.accepted && bucketAdmission.accepted) {
      rememberAccentDrop('sequencer');
    }
    notify();
    return true;
  }

  function handlePacket(pkt) {
    counters.received += 1;
    var event = normalizePacket(pkt);
    if (!event) {
      counters.malformed += 1;
      rememberDrop('malformed');
      notify();
      return false;
    }
    counters.normalized += 1;
    lastNormalizedEvent = cloneEvent(event);
    return routeEvent(event);
  }

  function injectTestEvent(eventOrPacket) {
    counters.testEvents += 1;
    if (eventOrPacket && typeof eventOrPacket === 'object' && eventOrPacket.type && eventOrPacket.id) {
      lastNormalizedEvent = cloneEvent(eventOrPacket);
      return routeEvent(Object.assign({}, eventOrPacket));
    }
    return handlePacket(eventOrPacket || {
      hash: 'test-' + counters.testEvents,
      raw_hex: '010203040506',
      observation_count: 1,
      decoded: { header: { payloadTypeName: 'TEST' }, payload: {} },
    });
  }

  function persistCoreScopeDisabled() {
    writeStorage(UPSTREAM_AUDIO_ENABLED_KEY, 'false');
  }

  function markSuppressed(el) {
    if (!el || el.dataset.coloradoMeshAudioSuppressed === '1') return false;
    el.dataset.coloradoMeshAudioSuppressed = '1';
    counters.suppressions += 1;
    return true;
  }

  function suppressCoreScopeDom() {
    var toggle = document.getElementById('liveAudioToggle');
    if (toggle) {
      toggle.checked = false;
      toggle.disabled = true;
      toggle.tabIndex = -1;
      toggle.setAttribute('aria-hidden', 'true');
      markSuppressed(toggle);
      var label = toggle.closest ? toggle.closest('label') : null;
      if (label) {
        label.hidden = true;
        label.setAttribute('aria-hidden', 'true');
        markSuppressed(label);
      }
    }

    var controls = document.getElementById('audioControls');
    if (controls) {
      controls.classList.add('hidden');
      controls.hidden = true;
      controls.setAttribute('aria-hidden', 'true');
      markSuppressed(controls);
    }
  }

  function patchCoreScopeAudio() {
    var meshAudio = window.MeshAudio;
    if (!meshAudio || meshAudio.__coloradoMeshAudioSuppressed) return !!meshAudio;

    var originalSetEnabled = typeof meshAudio.setEnabled === 'function' ? meshAudio.setEnabled.bind(meshAudio) : null;
    var originalRestore = typeof meshAudio.restore === 'function' ? meshAudio.restore.bind(meshAudio) : null;

    function forceOff() {
      persistCoreScopeDisabled();
      if (originalSetEnabled) {
        try { originalSetEnabled(false); }
        catch { /* ignore upstream audio errors */ }
      }
    }

    meshAudio.setEnabled = function () {
      forceOff();
      return false;
    };
    meshAudio.isEnabled = function () { return false; };
    meshAudio.restore = function () {
      forceOff();
      if (originalRestore) {
        try { originalRestore(); }
        catch { /* ignore upstream restore errors */ }
      }
      forceOff();
      return false;
    };
    meshAudio.sonifyPacket = function (pkt) {
      counters.suppressedPackets += 1;
      return handlePacket(pkt);
    };

    try {
      Object.defineProperty(meshAudio, '__coloradoMeshAudioSuppressed', { value: true });
    } catch {
      meshAudio.__coloradoMeshAudioSuppressed = true;
    }

    forceOff();
    return true;
  }

  function suppressCoreScopeAudio() {
    persistCoreScopeDisabled();
    patchCoreScopeAudio();
    suppressCoreScopeDom();
  }

  function startSuppressionWatch() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startSuppressionWatch, { once: true });
      return;
    }
    suppressCoreScopeAudio();

    if (!suppressObserver && typeof MutationObserver !== 'undefined') {
      suppressObserver = new MutationObserver(function () {
        suppressCoreScopeAudio();
      });
      suppressObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (!suppressTimer) {
      var attempts = 0;
      suppressTimer = window.setInterval(function () {
        attempts += 1;
        suppressCoreScopeAudio();
        if (attempts >= 40 || (window.MeshAudio && document.getElementById('liveAudioToggle'))) {
          window.clearInterval(suppressTimer);
          suppressTimer = null;
        }
      }, 250);
    }
  }

  updateStatus();

  api = {
    version: 2,
    status: state.status,
    storageKeys: {
      mode: MODE_STORAGE_KEY,
      volume: VOLUME_STORAGE_KEY,
    },
    getModeOptions: getModeOptions,
    getState: getState,
    setMode: setMode,
    setVolume: setVolume,
    isUnlocked: isUnlocked,
    subscribe: subscribe,
    normalizePacket: normalizePacket,
    routeEvent: routeEvent,
    injectTestEvent: injectTestEvent,
    suppressCoreScopeAudio: suppressCoreScopeAudio,
  };

  window.__coloradoMeshSound = api;
  window.__denvermcMapSound = api;

  suppressCoreScopeAudio();
  startSuppressionWatch();
  notify();
})();

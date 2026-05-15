(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var api = window.__coloradoMeshSound;
  if (api && api.version) return;

  var MODE_STORAGE_KEY = 'coloradoMesh.map.soundMode';
  var VOLUME_STORAGE_KEY = 'coloradoMesh.map.soundVolume';
  var UPSTREAM_AUDIO_ENABLED_KEY = 'live-audio-enabled';
  var DEFAULT_VOLUME = 0.3;
  var AudioCtor = window.AudioContext || window.webkitAudioContext || null;
  var modes = [
    { value: 'off', label: 'Sound Off' },
    { value: 'native', label: 'Native+' },
    { value: 'generative', label: 'Generative Key' },
    { value: 'ensemble', label: 'Orchestral Ensemble' },
    { value: 'blaster', label: 'Space Blaster' },
  ];
  var modeLookup = modes.reduce(function (acc, mode) {
    acc[mode.value] = mode;
    return acc;
  }, {});
  var listeners = [];
  var audioCtx = null;
  var masterGain = null;
  var outputLimiter = null;
  var activeVoices = 0;
  var maxActiveVoices = 14;
  var cueGeneration = 0;
  var modeCooldowns = {};
  var cleanupTimers = new Set();
  var scheduledSources = new Set();
  var scheduledNodes = new Set();
  var cachedNoiseBuffer = null;
  var suppressObserver = null;
  var suppressTimer = null;
  var dedupeWindowMs = 2500;
  var dedupeSeen = new Map();
  var buckets = {
    priority: { capacity: 6, tokens: 6, refillPerSecond: 3, updatedAt: Date.now() },
    normal: { capacity: 4, tokens: 4, refillPerSecond: 1.5, updatedAt: Date.now() },
    low: { capacity: 2, tokens: 2, refillPerSecond: 0.75, updatedAt: Date.now() },
  };
  var lastNormalizedEvent = null;
  var lastEvent = null;
  var lastDroppedReason = null;
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
    dropped: 0,
    deduped: 0,
    throttled: 0,
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
      observationCount: event.observationCount,
      hopCount: event.hopCount,
      intensity: event.intensity,
      timestamp: event.timestamp,
    };
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
  }

  function stopAllScheduledCues() {
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
    activeVoices = 0;
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
        masterGain.gain.value = 0;
        outputLimiter = audioCtx.createDynamicsCompressor();
        outputLimiter.threshold.value = -10;
        outputLimiter.knee.value = 8;
        outputLimiter.ratio.value = 10;
        outputLimiter.attack.value = 0.004;
        outputLimiter.release.value = 0.12;
        masterGain.connect(outputLimiter);
        outputLimiter.connect(audioCtx.destination);
      }
      applyVolume();
      if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        var resumed = audioCtx.resume();
        if (resumed && typeof resumed.then === 'function') {
          resumed.then(function () {
            state.unlocked = audioContextIsRunning();
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
    var changed = state.mode !== mode;
    if (changed) stopAllScheduledCues();
    state.mode = mode;
    writeStorage(MODE_STORAGE_KEY, mode);
    if (changed) counters.modeChanges += 1;

    if (mode === 'off') {
      suspendAudioContext();
    } else if (userGesture) {
      counters.unlockAttempts += 1;
      ensureAudioContext();
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

  function rawHexFromPacket(pkt) {
    return stringFrom(pkt && (pkt.raw || pkt.raw_hex || (pkt.packet && (pkt.packet.raw || pkt.packet.raw_hex))));
  }

  function byteAt(hex, index, fallback) {
    if (!hex || hex.length < index * 2 + 2) return fallback;
    var parsed = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    return Number.isFinite(parsed) ? parsed : fallback;
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

  function scaleFreq(seed, root, intervals, octaves) {
    var span = intervals.length * octaves;
    var index = seed % span;
    var octave = Math.floor(index / intervals.length);
    return midiToFreq(root + octave * 12 + intervals[index % intervals.length]);
  }

  function safeDisconnect(node) {
    if (!node || typeof node.disconnect !== 'function') return;
    try { node.disconnect(); }
    catch { /* node may already be disconnected */ }
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
    var destination = options.destination || masterGain;
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
    env.connect(options.destination || masterGain);
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

  function cooldownForMode(mode, event) {
    var lane = eventLane(event);
    if (mode === 'generative') return lane === 'priority' ? 110 : lane === 'low' ? 520 : 220;
    if (mode === 'blaster') return lane === 'priority' ? 70 : lane === 'low' ? 240 : 130;
    return lane === 'priority' ? 45 : lane === 'low' ? 160 : 85;
  }

  function scheduleModeCue(mode, event, play) {
    if (!audioCtx || !masterGain || state.mode === 'off' || !audioContextIsRunning()) return false;
    var lane = eventLane(event);
    var nowMs = Date.now();
    var key = mode + ':' + lane;
    if (activeVoices >= maxActiveVoices) {
      counters.throttled += 1;
      rememberDrop('audio-cap');
      return false;
    }
    if (nowMs - (modeCooldowns[key] || 0) < cooldownForMode(mode, event)) {
      counters.throttled += 1;
      rememberDrop('audio-cooldown:' + lane);
      return false;
    }
    modeCooldowns[key] = nowMs;
    activeVoices += 1;
    try {
      var generation = cueGeneration;
      var duration = Math.max(0.05, numberFrom(play(event), 0.25));
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

  function playNative(event) {
    return scheduleModeCue('native', event, function (soundEvent) {
      var seed = eventSeed(soundEvent, 'native');
      var lane = eventLane(soundEvent);
      var start = audioCtx.currentTime + 0.018;
      var intensity = clamp(soundEvent.intensity, 0.05, 1);
      var root = soundEvent.isPriority ? 57 : 50;
      var freq = scaleFreq(seed, root, [0, 2, 4, 7, 9], 3);
      var duration = lane === 'priority' ? 0.22 : lane === 'low' ? 0.105 : 0.145;
      var gain = (lane === 'priority' ? 0.12 : lane === 'low' ? 0.045 : 0.07) * (0.75 + intensity * 0.7);
      var wave = soundEvent.type === 'GRP_TXT' ? 'triangle' : soundEvent.type === 'NODEINFO' ? 'sine' : 'sine';
      var total = scheduleTone(freq, start, duration, {
        type: wave,
        gain: gain,
        attack: 0.006,
        decay: 0.05,
        release: 0.09,
        filterFrequency: lane === 'low' ? 1800 : 4200,
        endFilterFrequency: lane === 'priority' ? 6200 : 2400,
        q: lane === 'priority' ? 1.4 : 0.8,
      });
      if (lane === 'priority') {
        total = Math.max(total, scheduleTone(freq * 1.5, start + 0.035, 0.16, {
          type: 'triangle',
          gain: gain * 0.55,
          attack: 0.004,
          decay: 0.035,
          release: 0.12,
          filterFrequency: 5200,
          q: 1.1,
        }));
      }
      return total;
    });
  }

  function playGenerative(event) {
    return scheduleModeCue('generative', event, function (soundEvent) {
      var seed = eventSeed(soundEvent, 'generative');
      var lane = eventLane(soundEvent);
      var start = audioCtx.currentTime + 0.025;
      var scale = [0, 2, 3, 5, 7, 9, 10];
      var intensity = clamp(soundEvent.intensity, 0.05, 1);
      var hopCount = Math.max(1, intFrom(soundEvent.hopCount, 1));
      var notes = lane === 'priority' ? 5 : lane === 'low' ? 2 : 3 + (seed % 2);
      var root = lane === 'priority' ? 50 : 62;
      var gap = lane === 'priority' ? 0.075 : 0.105;
      var total = 0;
      for (var i = 0; i < notes; i++) {
        var degreeSeed = seed + i * (17 + hopCount);
        var freq = scaleFreq(degreeSeed, root, scale, 2);
        var noteStart = start + i * gap;
        var noteDur = lane === 'priority' ? 0.16 : 0.18;
        total = Math.max(total, scheduleTone(freq, noteStart, noteDur, {
          type: i % 2 === 0 ? 'triangle' : 'sine',
          gain: (0.035 + intensity * 0.045) * (lane === 'low' ? 0.58 : 1),
          attack: 0.012,
          decay: 0.06,
          sustain: 0.022,
          release: 0.16,
          filterFrequency: lane === 'priority' ? 5200 : 3400,
          q: 0.7,
        }));
      }
      if (lane === 'priority' || soundEvent.observationCount >= 4) {
        var chordStart = start + notes * gap + 0.035;
        var base = scaleFreq(seed + 31, 50, scale, 2);
        [1, 1.25, 1.5].forEach(function (ratio, idx) {
          total = Math.max(total, scheduleTone(base * ratio, chordStart, 0.34, {
            type: 'sine',
            gain: (0.028 + intensity * 0.025) / (idx + 1),
            attack: 0.025,
            decay: 0.09,
            sustain: 0.018,
            release: 0.22,
            filterFrequency: 4100,
            q: 0.55,
          }));
        });
      }
      return total;
    });
  }

  function playBlaster(event) {
    return scheduleModeCue('blaster', event, function (soundEvent) {
      var seed = eventSeed(soundEvent, 'blaster');
      var lane = eventLane(soundEvent);
      var start = audioCtx.currentTime + 0.012;
      var intensity = clamp(soundEvent.intensity, 0.05, 1);
      var base = 260 + (seed % 360);
      var total;
      if (lane === 'priority') {
        total = scheduleTone(base * 3.2, start, 0.24, {
          type: 'sawtooth',
          endFrequency: Math.max(90, base * 0.62),
          gain: 0.075 + intensity * 0.075,
          attack: 0.003,
          decay: 0.025,
          sustain: 0.012,
          release: 0.13,
          filterFrequency: 6200,
          endFilterFrequency: 760,
          q: 5.5,
        });
        total = Math.max(total, scheduleNoiseBurst(start + 0.025, 0.13, 0.05 + intensity * 0.045, 1600 + (seed % 2200), { q: 6, release: 0.12 }));
        total = Math.max(total, scheduleTone(base * 0.48, start + 0.09, 0.28, {
          type: 'triangle',
          endFrequency: Math.max(55, base * 0.28),
          gain: 0.04 + intensity * 0.03,
          attack: 0.015,
          decay: 0.06,
          release: 0.22,
          filterFrequency: 900,
          q: 1.8,
        }));
        return total;
      }
      total = scheduleTone(base * (lane === 'low' ? 1.4 : 2.1), start, lane === 'low' ? 0.105 : 0.16, {
        type: lane === 'low' ? 'square' : 'sawtooth',
        endFrequency: base * (lane === 'low' ? 0.9 : 0.42),
        gain: (lane === 'low' ? 0.034 : 0.058) + intensity * 0.035,
        attack: 0.002,
        decay: 0.022,
        sustain: 0.008,
        release: lane === 'low' ? 0.055 : 0.11,
        filterFrequency: lane === 'low' ? 3100 : 5400,
        endFilterFrequency: lane === 'low' ? 1500 : 520,
        q: lane === 'low' ? 3 : 4.8,
      });
      if (lane === 'normal') {
        total = Math.max(total, scheduleNoiseBurst(start + 0.018, 0.07, 0.025 + intensity * 0.025, 2400 + (seed % 2600), { q: 5, release: 0.07 }));
      }
      return total;
    });
  }

  function playCurrentMode(event) {
    if (state.mode === 'native') return playNative(event);
    if (state.mode === 'generative') return playGenerative(event);
    if (state.mode === 'blaster') return playBlaster(event);
    if (state.mode === 'ensemble') return true;
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
    var rawHex = rawHexFromPacket(pkt);
    var hash = firstString([
      pkt.hash,
      pkt.packet && pkt.packet.hash,
      payload.hash,
      rawHex ? rawHex.slice(0, 16) : '',
    ]);
    if (!hash && type === 'UNKNOWN' && !rawHex) return null;

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
    var byteSeed = byteAt(rawHex, 3, observationCount * 17 + hopCount * 13);
    var intensity = Math.max(0.05, Math.min(1, (byteSeed / 255) * 0.65 + Math.min(observationCount, 6) * 0.05 + Math.min(hopCount, 8) * 0.025));
    var isEmergency = isEmergencyChannel(channelName, channelHash, type);
    var isPriority = isEmergency || type === 'GRP_TXT' || type === 'CHAN' || observationCount >= 4;
    var timestamp = intFrom(pkt._ts || pkt.timestamp || pkt.received_at || Date.now(), Date.now());

    return {
      id: hash || [type, channelName || channelHash || 'no-channel', timestamp].join(':'),
      type: type,
      modeHint: eventLane({ type: type, isPriority: isPriority }),
      channelName: channelName || null,
      channelHash: channelHash,
      isEmergency: isEmergency,
      isPriority: isPriority,
      observationCount: observationCount,
      hopCount: hopCount,
      intensity: intensity,
      timestamp: timestamp,
    };
  }

  function rememberDrop(reason) {
    counters.dropped += 1;
    lastDroppedReason = reason;
  }

  function pruneDedupe(now) {
    dedupeSeen.forEach(function (seenAt, id) {
      if (now - seenAt > dedupeWindowMs) dedupeSeen.delete(id);
    });
  }

  function acceptDedupe(event, now) {
    if (!event.id) return true;
    pruneDedupe(now);
    var seenAt = dedupeSeen.get(event.id);
    if (seenAt && now - seenAt < dedupeWindowMs) {
      counters.deduped += 1;
      rememberDrop('dedupe');
      return false;
    }
    dedupeSeen.set(event.id, now);
    return true;
  }

  function acceptBucket(event, now) {
    var lane = eventLane(event);
    var bucket = buckets[lane] || buckets.normal;
    var elapsed = Math.max(0, (now - bucket.updatedAt) / 1000);
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsed * bucket.refillPerSecond);
    bucket.updatedAt = now;
    if (bucket.tokens < 1) {
      counters.throttled += 1;
      rememberDrop('throttle:' + lane);
      return false;
    }
    bucket.tokens -= 1;
    return true;
  }

  function markPlayed(event) {
    var accepted = playCurrentMode(event);
    if (!accepted) return false;
    counters.played += 1;
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
    if (!acceptDedupe(event, now)) {
      notify();
      return false;
    }
    if (!acceptBucket(event, now)) {
      notify();
      return false;
    }

    var accepted = markPlayed(event);
    if (accepted) {
      counters.routed += 1;
      if (event.isPriority) counters.priority += 1;
      lastDroppedReason = null;
    }
    notify();
    return accepted;
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

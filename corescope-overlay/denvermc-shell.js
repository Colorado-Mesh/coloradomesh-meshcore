/* denvermc-shell.js — Colorado Mesh overlay on top of CoreScope.
 *
 * Goals:
 *   - Default /map to a polished Colorado Mesh live-map shell that
 *     hides nonessential CoreScope chrome.
 *   - Default the route to #/live whenever the user lands on /map.
 *   - Provide a clear, accessible control to expose the full CoreScope
 *     analyzer (#/packets, #/nodes, #/channels, #/analytics, #/perf,
 *     etc.) without leaving the page.
 *   - Provide a zero-distraction "Focus" mode that strips every piece
 *     of chrome down to map + nodes, with a single discoverable exit.
 *   - Stay friendly to upstream CoreScope updates: only touches body
 *     classes and DOM elements it owns; never edits vendor files.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__denvermcShell) return; // singleton across SPA mounts
  window.__denvermcShell = { version: 2 };

  var PATH_PREFIX = '/map';
  var STORAGE_KEY = 'denvermc.shell.userPreference';
  var DEFAULT_HASH = '#/live';
  var BRAND_LOGO_SRC = '/brand/color/mesh-color-256.png'; // Vendored Colorado Mesh color logo (same-origin)

  // Where Colorado Mesh's site root lives. This overlay is served from
  // the same origin as the Next app via nginx, so a relative path works.
  var SITE_HOME_HREF = '/';

  // -- Path detection ---------------------------------------------------
  function isMapPath() {
    var p = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    return p === PATH_PREFIX || p.indexOf(PATH_PREFIX + '/') === 0;
  }

  function currentHashRoute() {
    var h = window.location.hash || '';
    if (!h || h === '#' || h === '#/') return '';
    var stripped = h.replace(/^#/, '').split('?')[0];
    return stripped;
  }

  function isLiveRoute() {
    var r = currentHashRoute();
    return r === '' || r === '/' || r === '/live' || r.indexOf('/live/') === 0;
  }

  // -- User preference --------------------------------------------------
  // Stored values: 'minimal' | 'analyzer' | null (default = minimal on live).
  // Note: 'focus' is intentionally transient — entering Focus mode does
  // not write a preference; ESC / exit pill return the operator to the
  // last persistent mode (minimal by default).
  function readPreference() {
    try { return window.localStorage.getItem(STORAGE_KEY); }
    catch { return null; }
  }
  function writePreference(value) {
    try {
      if (value == null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, value);
    } catch { /* ignore quota/private-mode */ }
  }

  // -- Default route redirect: /map -> /map#/live -----------------------
  function ensureDefaultRoute() {
    if (!isMapPath()) return;
    var h = window.location.hash;
    if (!h || h === '#' || h === '#/') {
      window.location.replace(
        window.location.pathname + window.location.search + DEFAULT_HASH
      );
    }
  }

  // -- Mode resolution --------------------------------------------------
  // Focus is a transient session-only flag layered on top of persistent
  // mode (minimal | analyzer). When focus is active and we're on the live
  // route, the UI renders as `focus` regardless of persistent mode.
  var focusActive = false;

  function resolveMode() {
    if (!isMapPath()) return 'off';
    if (focusActive && isLiveRoute()) return 'focus';
    if (!isLiveRoute()) return 'analyzer';
    var pref = readPreference();
    if (pref === 'analyzer') return 'analyzer';
    return 'minimal';
  }

  // -- Shell DOM (idempotent) -------------------------------------------
  var topbarEl = null;
  var statusEl = null;
  var fabEl = null;
  var focusBtnEl = null;
  var analyzerToggleBtnEl = null;
  var focusExitEl = null;
  var soundGroupEl = null;
  var soundSelectEl = null;
  var soundVolumeEl = null;
  var soundStatusEl = null;
  var soundUnsubscribe = null;
  var soundReadyTimer = null;
  var syncingSoundControls = false;
  var soundTriggerBtnEl = null;
  var soundTriggerStatusEl = null;
  var soundSheetEl = null;
  var soundSheetBodyEl = null;
  var soundSheetBackdropEl = null;
  var soundSheetCloseBtnEl = null;
  var soundSheetStatusEl = null;
  var soundSheetMql = null;
  var soundSheetOpen = false;
  var soundSheetLastFocus = null;
  var SOUND_MODE_OPTIONS = [
    { value: 'off', label: 'Sound Off' },
    { value: 'native', label: 'Native+' },
    { value: 'generative', label: 'Generative Key' },
    { value: 'ensemble', label: 'Orchestral Ensemble' },
    { value: 'chime', label: 'Wind Chimes' },
    { value: 'blaster', label: 'Space Blaster' },
  ];

  function svgIcon(d, viewBox) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox || '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'denvermc-btn__icon');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    return svg;
  }

  function buildBrandMark() {
    // Real Colorado Mesh logo (served by Next public/). Falls back to a
    // CSS gradient if the image fails to load so the brand never breaks.
    var mark = document.createElement('span');
    mark.className = 'denvermc-topbar__mark';
    mark.setAttribute('aria-hidden', 'true');

    var img = document.createElement('img');
    img.className = 'denvermc-topbar__mark-img';
    img.src = BRAND_LOGO_SRC;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.width = 32;
    img.height = 32;
    img.addEventListener('error', function () {
      mark.classList.add('denvermc-topbar__mark--fallback');
      img.remove();
    });
    mark.appendChild(img);
    return mark;
  }

  function getSoundApi() {
    return window.__coloradoMeshSound || window.__denvermcMapSound || null;
  }

  function soundOptionsFromApi(api) {
    if (api && typeof api.getModeOptions === 'function') {
      try { return api.getModeOptions(); }
      catch { /* fall through to static options */ }
    }
    return SOUND_MODE_OPTIONS.slice();
  }

  function buildSoundControls() {
    if (soundGroupEl) return soundGroupEl;

    var group = document.createElement('div');
    group.className = 'denvermc-sound';
    group.setAttribute('aria-label', 'Colorado Mesh map sound');
    group.dataset.mode = 'off';
    group.dataset.status = 'bootstrap';

    var label = document.createElement('label');
    label.className = 'denvermc-sound__mode-label';
    label.setAttribute('for', 'coloradoMeshSoundMode');
    label.textContent = 'Sound';

    var select = document.createElement('select');
    select.id = 'coloradoMeshSoundMode';
    select.className = 'denvermc-sound__select';
    select.setAttribute('aria-label', 'Colorado Mesh map sound mode');

    soundOptionsFromApi(getSoundApi()).forEach(function (option) {
      var el = document.createElement('option');
      el.value = option.value;
      el.textContent = option.label;
      select.appendChild(el);
    });

    var volumeWrap = document.createElement('label');
    volumeWrap.className = 'denvermc-sound__volume-label';
    volumeWrap.setAttribute('for', 'coloradoMeshSoundVolume');
    var volumeText = document.createElement('span');
    volumeText.className = 'denvermc-sound__volume-text';
    volumeText.textContent = 'Vol';
    var volume = document.createElement('input');
    volume.id = 'coloradoMeshSoundVolume';
    volume.className = 'denvermc-sound__volume';
    volume.type = 'range';
    volume.min = '0';
    volume.max = '100';
    volume.step = '1';
    volume.setAttribute('aria-label', 'Colorado Mesh map sound volume');
    volumeWrap.appendChild(volumeText);
    volumeWrap.appendChild(volume);

    var status = document.createElement('span');
    status.className = 'denvermc-sound__status';
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    select.addEventListener('pointerdown', function () {
      if (syncingSoundControls || select.value === 'off') return;
      var api = getSoundApi();
      var state = api && api.getState && api.getState();
      if (api && state && !state.unlocked && typeof api.setMode === 'function') {
        api.setMode(select.value, { userGesture: true });
      }
    });

    select.addEventListener('keydown', function (e) {
      if (syncingSoundControls || select.value === 'off') return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var api = getSoundApi();
      var state = api && api.getState && api.getState();
      if (api && state && !state.unlocked && typeof api.setMode === 'function') {
        api.setMode(select.value, { userGesture: true });
      }
    });

    select.addEventListener('change', function () {
      if (syncingSoundControls) return;
      var api = getSoundApi();
      if (api && typeof api.setMode === 'function') {
        api.setMode(select.value, { userGesture: true });
      }
    });

    volume.addEventListener('input', function () {
      if (syncingSoundControls) return;
      var api = getSoundApi();
      if (api && typeof api.setVolume === 'function') {
        api.setVolume(Number(volume.value) / 100);
      }
    });

    group.appendChild(label);
    group.appendChild(select);
    group.appendChild(volumeWrap);
    group.appendChild(status);

    soundGroupEl = group;
    soundSelectEl = select;
    soundVolumeEl = volume;
    soundStatusEl = status;
    return group;
  }

  function syncSoundControls(snapshot) {
    if (!soundSelectEl || !soundVolumeEl) return;
    var state = snapshot || (getSoundApi() && getSoundApi().getState && getSoundApi().getState()) || {};
    var mode = state.mode || 'off';
    var volume = typeof state.volume === 'number' ? state.volume : 0.3;
    syncingSoundControls = true;
    soundSelectEl.value = mode;
    soundVolumeEl.value = String(Math.round(Math.max(0, Math.min(1, volume)) * 100));
    soundVolumeEl.removeAttribute('disabled');
    soundSelectEl.removeAttribute('disabled');
    syncingSoundControls = false;

    if (soundGroupEl) {
      soundGroupEl.dataset.mode = mode;
      soundGroupEl.dataset.status = state.status || 'bootstrap';
    }
    if (soundStatusEl) {
      if (state.available === false) soundStatusEl.textContent = 'Unavailable';
      else if (mode === 'off') soundStatusEl.textContent = '';
      else if (state.unlocked) soundStatusEl.textContent = 'On';
      else soundStatusEl.textContent = 'Tap to start';
    }
    syncSoundTrigger(state);
  }

  function connectSoundControls() {
    var api = getSoundApi();
    if (!api) return false;
    if (soundUnsubscribe) soundUnsubscribe();
    if (typeof api.subscribe === 'function') {
      soundUnsubscribe = api.subscribe(syncSoundControls);
    } else {
      syncSoundControls(api.getState && api.getState());
    }
    if (typeof api.suppressCoreScopeAudio === 'function') api.suppressCoreScopeAudio();
    return true;
  }

  function startSoundControlsWatch() {
    if (connectSoundControls()) return;
    if (soundReadyTimer) return;
    var attempts = 0;
    soundReadyTimer = window.setInterval(function () {
      attempts += 1;
      if (connectSoundControls() || attempts >= 40) {
        window.clearInterval(soundReadyTimer);
        soundReadyTimer = null;
      }
    }, 250);
  }

  function soundModeLabel(value) {
    for (var i = 0; i < SOUND_MODE_OPTIONS.length; i += 1) {
      if (SOUND_MODE_OPTIONS[i].value === value) return SOUND_MODE_OPTIONS[i].label;
    }
    var api = getSoundApi();
    var opts = soundOptionsFromApi(api);
    for (var j = 0; j < opts.length; j += 1) {
      if (opts[j].value === value) return opts[j].label;
    }
    return 'Sound';
  }

  function buildSoundTrigger() {
    if (soundTriggerBtnEl) return soundTriggerBtnEl;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'denvermc-btn denvermc-btn--ghost denvermc-sound-trigger';
    btn.id = 'denvermcSoundTrigger';
    btn.setAttribute('aria-label', 'Open Colorado Mesh map sound controls');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'denvermcSoundSheet');
    btn.title = 'Sound';
    btn.appendChild(svgIcon(
      // Speaker with one wave — reads cleanly at icon-only sizes
      'M3.5 6h1.7L8 3v10L5.2 10H3.5V6zm7.6.4c.9.8.9 2.4 0 3.2l-.9-.9c.4-.5.4-.9 0-1.4l.9-.9z',
      '0 0 16 16'
    ));
    var label = document.createElement('span');
    label.className = 'denvermc-btn__label denvermc-sound-trigger__label';
    label.textContent = 'Sound';
    btn.appendChild(label);
    var pill = document.createElement('span');
    pill.className = 'denvermc-sound-trigger__pill';
    pill.dataset.mode = 'off';
    pill.textContent = '';
    btn.appendChild(pill);
    btn.addEventListener('click', function () {
      if (soundSheetOpen) closeSoundSheet();
      else openSoundSheet();
    });
    soundTriggerBtnEl = btn;
    soundTriggerStatusEl = pill;
    return btn;
  }

  function buildSoundSheet() {
    if (soundSheetEl) return soundSheetEl;

    var backdrop = document.createElement('div');
    backdrop.className = 'denvermc-sheet-backdrop';
    backdrop.id = 'denvermcSoundSheetBackdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
    backdrop.addEventListener('click', function () { closeSoundSheet(); });
    document.body.appendChild(backdrop);
    soundSheetBackdropEl = backdrop;

    var sheet = document.createElement('aside');
    sheet.className = 'denvermc-sound-sheet';
    sheet.id = 'denvermcSoundSheet';
    sheet.setAttribute('role', 'dialog');
    // aria-modal=false: the sheet is a non-trapping panel so operators
    // can still pan/zoom the underlying map by tapping the backdrop or
    // pressing Escape; explicit close affordances cover screen readers.
    sheet.setAttribute('aria-modal', 'false');
    sheet.setAttribute('aria-labelledby', 'denvermcSoundSheetTitle');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.hidden = true;
    // Keep the sheet out of the tab order while closed so keyboard users
    // don't land on hidden controls.
    sheet.tabIndex = -1;

    var header = document.createElement('header');
    header.className = 'denvermc-sound-sheet__header';

    var grabber = document.createElement('span');
    grabber.className = 'denvermc-sound-sheet__grabber';
    grabber.setAttribute('aria-hidden', 'true');
    header.appendChild(grabber);

    var title = document.createElement('h2');
    title.className = 'denvermc-sound-sheet__title';
    title.id = 'denvermcSoundSheetTitle';
    title.textContent = 'Map sound';
    header.appendChild(title);

    var status = document.createElement('span');
    status.className = 'denvermc-sound-sheet__status';
    status.id = 'denvermcSoundSheetStatus';
    header.appendChild(status);
    soundSheetStatusEl = status;

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'denvermc-sound-sheet__close';
    closeBtn.setAttribute('aria-label', 'Close map sound controls');
    closeBtn.title = 'Close';
    closeBtn.appendChild(svgIcon(
      'M4.3 3 8 6.7 11.7 3l1.3 1.3L9.3 8l3.7 3.7L11.7 13 8 9.3 4.3 13 3 11.7 6.7 8 3 4.3z',
      '0 0 16 16'
    ));
    closeBtn.addEventListener('click', function () { closeSoundSheet(); });
    header.appendChild(closeBtn);
    soundSheetCloseBtnEl = closeBtn;

    sheet.appendChild(header);

    var body = document.createElement('div');
    body.className = 'denvermc-sound-sheet__body';
    sheet.appendChild(body);
    soundSheetBodyEl = body;

    var hint = document.createElement('p');
    hint.className = 'denvermc-sound-sheet__hint';
    hint.textContent = 'Tap a mode to start. Volume changes apply immediately.';
    sheet.appendChild(hint);

    document.body.appendChild(sheet);
    soundSheetEl = sheet;
    return sheet;
  }

  function shouldUseSoundSheet() {
    if (!soundSheetMql) return false;
    return !!soundSheetMql.matches;
  }

  function placeSoundGroup() {
    if (!soundGroupEl) return;
    if (shouldUseSoundSheet()) {
      // Move the canonical sound group into the sheet body — controls keep
      // their identity (same select/volume DOM, same aria-labels) so all
      // existing __coloradoMeshSound API plumbing stays intact.
      if (!soundSheetBodyEl) buildSoundSheet();
      if (soundGroupEl.parentNode !== soundSheetBodyEl) {
        soundSheetBodyEl.appendChild(soundGroupEl);
      }
      soundGroupEl.classList.add('denvermc-sound--in-sheet');
    } else {
      // Restore to the topbar actions. If the sheet was open while the
      // viewport widened past mobile, close it so we don't leave a
      // phantom dialog at desktop widths.
      if (soundSheetOpen) closeSoundSheet();
      var actions = topbarEl ? topbarEl.querySelector('.denvermc-topbar__actions') : null;
      if (actions && soundGroupEl.parentNode !== actions) {
        // Insert sound group between the divider and the focus/analyzer
        // buttons — matches the original desktop layout exactly.
        var focusBtn = actions.querySelector('#denvermcFocusBtn');
        if (focusBtn) actions.insertBefore(soundGroupEl, focusBtn);
        else actions.appendChild(soundGroupEl);
      }
      soundGroupEl.classList.remove('denvermc-sound--in-sheet');
    }
  }

  function syncSoundTrigger(state) {
    if (!soundTriggerBtnEl) return;
    var mode = (state && state.mode) || 'off';
    var label = soundModeLabel(mode);
    if (mode === 'off') {
      soundTriggerBtnEl.setAttribute('aria-label', 'Open Colorado Mesh map sound controls — currently off');
      soundTriggerBtnEl.classList.remove('denvermc-sound-trigger--active');
    } else {
      var status = (state && state.unlocked) ? 'on' : 'locked';
      soundTriggerBtnEl.setAttribute('aria-label', 'Open Colorado Mesh map sound controls — ' + label + ' (' + status + ')');
      soundTriggerBtnEl.classList.add('denvermc-sound-trigger--active');
    }
    if (soundTriggerStatusEl) {
      soundTriggerStatusEl.dataset.mode = mode;
      if (mode === 'off') soundTriggerStatusEl.textContent = '';
      else soundTriggerStatusEl.textContent = (state && state.unlocked) ? 'On' : 'Tap';
    }
    if (soundSheetStatusEl) {
      if (mode === 'off') soundSheetStatusEl.textContent = '';
      else if (state && state.available === false) soundSheetStatusEl.textContent = 'Unavailable';
      else if (state && state.unlocked) soundSheetStatusEl.textContent = 'On · ' + label;
      else soundSheetStatusEl.textContent = 'Tap to start · ' + label;
    }
  }

  function openSoundSheet() {
    if (!soundSheetEl || soundSheetOpen) return;
    // Only meaningful on mobile widths; if the viewport widened just
    // before the click, fall through to no-op rather than show a sheet
    // over an already-visible inline control set.
    if (!shouldUseSoundSheet()) return;
    soundSheetOpen = true;
    soundSheetLastFocus = (document.activeElement && document.activeElement !== document.body)
      ? document.activeElement
      : soundTriggerBtnEl;
    soundSheetEl.hidden = false;
    soundSheetEl.setAttribute('aria-hidden', 'false');
    if (soundSheetBackdropEl) {
      soundSheetBackdropEl.hidden = false;
      soundSheetBackdropEl.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('denvermc-sound-sheet-open');
    if (soundTriggerBtnEl) soundTriggerBtnEl.setAttribute('aria-expanded', 'true');
    // Move focus to the close button so keyboard / screen-reader users
    // can dismiss the sheet immediately without tabbing through map
    // chrome. We do NOT trap focus — pan/zoom remains reachable.
    if (soundSheetCloseBtnEl) {
      try { soundSheetCloseBtnEl.focus({ preventScroll: true }); }
      catch { soundSheetCloseBtnEl.focus(); }
    }
  }

  function closeSoundSheet() {
    if (!soundSheetEl || !soundSheetOpen) return;
    soundSheetOpen = false;
    soundSheetEl.setAttribute('aria-hidden', 'true');
    soundSheetEl.hidden = true;
    if (soundSheetBackdropEl) {
      soundSheetBackdropEl.setAttribute('aria-hidden', 'true');
      soundSheetBackdropEl.hidden = true;
    }
    document.body.classList.remove('denvermc-sound-sheet-open');
    if (soundTriggerBtnEl) soundTriggerBtnEl.setAttribute('aria-expanded', 'false');
    var returnTo = soundSheetLastFocus && document.body.contains(soundSheetLastFocus)
      ? soundSheetLastFocus
      : soundTriggerBtnEl;
    soundSheetLastFocus = null;
    if (returnTo && typeof returnTo.focus === 'function') {
      try { returnTo.focus({ preventScroll: true }); }
      catch { returnTo.focus(); }
    }
  }

  function watchSoundSheetMedia() {
    if (soundSheetMql || typeof window.matchMedia !== 'function') return;
    soundSheetMql = window.matchMedia('(max-width: 540px)');
    var handler = function () {
      placeSoundGroup();
      if (!shouldUseSoundSheet() && soundSheetOpen) closeSoundSheet();
    };
    if (typeof soundSheetMql.addEventListener === 'function') {
      soundSheetMql.addEventListener('change', handler);
    } else if (typeof soundSheetMql.addListener === 'function') {
      soundSheetMql.addListener(handler);
    }
  }

  function buildTopbar() {
    if (topbarEl) return topbarEl;

    var bar = document.createElement('header');
    bar.className = 'denvermc-topbar';
    bar.setAttribute('role', 'banner');
    bar.setAttribute('aria-label', 'Colorado Mesh live map');

    // Brand — left
    var brand = document.createElement('a');
    brand.className = 'denvermc-topbar__brand';
    brand.href = SITE_HOME_HREF;
    brand.setAttribute('aria-label', 'Colorado MeshCore — Home');
    brand.title = 'Colorado MeshCore — Home';

    var mark = buildBrandMark();

    var titleWrap = document.createElement('span');
    titleWrap.className = 'denvermc-topbar__title';
    var main = document.createElement('span');
    main.className = 'denvermc-topbar__title-main';
    main.textContent = 'Colorado Mesh';
    var sub = document.createElement('span');
    sub.className = 'denvermc-topbar__title-sub';
    sub.textContent = 'Live network map';
    titleWrap.appendChild(main);
    titleWrap.appendChild(sub);

    brand.appendChild(mark);
    brand.appendChild(titleWrap);

    var spacer = document.createElement('span');
    spacer.className = 'denvermc-topbar__spacer';

    var actions = document.createElement('div');
    actions.className = 'denvermc-topbar__actions';

    // Status pill
    var status = document.createElement('span');
    status.className = 'denvermc-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('data-state', 'pending');
    var statusDot = document.createElement('span');
    statusDot.className = 'denvermc-status__dot';
    statusDot.setAttribute('aria-hidden', 'true');
    var statusLabel = document.createElement('span');
    statusLabel.className = 'denvermc-status__label';
    statusLabel.textContent = 'Connecting';
    status.appendChild(statusDot);
    status.appendChild(statusLabel);
    statusEl = status;

    var divider = document.createElement('span');
    divider.className = 'denvermc-topbar__divider';
    divider.setAttribute('aria-hidden', 'true');

    // Focus mode (visible only when on the live route — only meaningful
    // when there is actually a map to focus on).
    var focusBtn = document.createElement('button');
    focusBtn.type = 'button';
    focusBtn.className = 'denvermc-btn denvermc-btn--ghost denvermc-btn--icon-only-sm';
    focusBtn.id = 'denvermcFocusBtn';
    focusBtn.setAttribute('aria-label', 'Enter focus mode — map and nodes only');
    focusBtn.title = 'Focus mode (map only)';
    focusBtn.appendChild(svgIcon(
      // fullscreen / corners-out glyph
      'M1.5 1.5h4v1.5h-2.5v2.5h-1.5v-4zm9 0h4v4h-1.5v-2.5h-2.5v-1.5zm-9 9h1.5v2.5h2.5v1.5h-4v-4zm11 0h1.5v4h-4v-1.5h2.5v-2.5z',
      '0 0 16 16'
    ));
    var focusLabel = document.createElement('span');
    focusLabel.className = 'denvermc-btn__label denvermc-btn__label--sm-hide';
    focusLabel.textContent = 'Focus';
    focusBtn.appendChild(focusLabel);
    focusBtn.addEventListener('click', function () {
      setFocus(true);
    });
    focusBtnEl = focusBtn;

    // Analyzer toggle (Full analyzer ↔ Minimal map — same button, label
    // & state flip with active mode so the operator always sees the
    // action they can take next).
    var analyzerBtn = document.createElement('button');
    analyzerBtn.type = 'button';
    analyzerBtn.className = 'denvermc-btn denvermc-btn--primary';
    analyzerBtn.id = 'denvermcAnalyzerBtn';
    analyzerBtn.appendChild(svgIcon(
      'M1.5 1.5h5v5h-5v-5zm0 8h5v5h-5v-5zm8-8h5v5h-5v-5zm0 8h5v5h-5v-5z',
      '0 0 16 16'
    ));
    var analyzerLabel = document.createElement('span');
    analyzerLabel.className = 'denvermc-btn__label';
    analyzerLabel.textContent = 'Full analyzer';
    analyzerBtn.appendChild(analyzerLabel);
    analyzerBtn.addEventListener('click', function () {
      var current = resolveMode();
      if (current === 'analyzer') {
        setMode('minimal');
      } else {
        setMode('analyzer');
      }
    });
    analyzerToggleBtnEl = analyzerBtn;

    var siteBtn = document.createElement('a');
    siteBtn.className = 'denvermc-btn denvermc-btn--ghost';
    siteBtn.href = SITE_HOME_HREF;
    siteBtn.setAttribute('aria-label', 'Return to the Colorado Mesh site');
    siteBtn.title = 'Return to coloradomesh.org';
    siteBtn.appendChild(svgIcon(
      'M9.5 2.5l-5 5.5 5 5.5V11h4V6h-4V2.5z',
      '0 0 16 16'
    ));
    var siteLabel = document.createElement('span');
    siteLabel.className = 'denvermc-btn__label denvermc-btn__label--sm-hide';
    siteLabel.textContent = 'Site';
    siteBtn.appendChild(siteLabel);

    actions.appendChild(status);
    actions.appendChild(divider);
    actions.appendChild(buildSoundTrigger());
    actions.appendChild(buildSoundControls());
    actions.appendChild(focusBtn);
    actions.appendChild(analyzerBtn);
    actions.appendChild(siteBtn);

    bar.appendChild(brand);
    bar.appendChild(spacer);
    bar.appendChild(actions);

    document.body.appendChild(bar);
    topbarEl = bar;
    return bar;
  }

  function buildFab() {
    if (fabEl) return fabEl;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'denvermc-fab';
    btn.id = 'denvermcMinimalFab';
    btn.setAttribute('aria-label', 'Return to the minimal Colorado Mesh live map');
    btn.title = 'Minimal map view';
    btn.appendChild(svgIcon(
      'M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.4 4.5 8.5 4.5 8.5s4.5-5.1 4.5-8.5A4.5 4.5 0 0 0 8 1.5zm0 6.25A1.75 1.75 0 1 1 8 4.25a1.75 1.75 0 0 1 0 3.5z',
      '0 0 16 16'
    ));
    var label = document.createElement('span');
    label.className = 'denvermc-fab__label';
    label.textContent = 'Minimal map';
    btn.appendChild(label);
    btn.addEventListener('click', function () {
      if (!isLiveRoute()) {
        window.location.hash = DEFAULT_HASH;
      }
      setMode('minimal');
    });
    document.body.appendChild(btn);
    fabEl = btn;
    return btn;
  }

  function buildFocusExit() {
    if (focusExitEl) return focusExitEl;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'denvermc-focus-exit';
    btn.id = 'denvermcFocusExit';
    btn.setAttribute('aria-label', 'Exit focus mode (ESC)');
    btn.title = 'Exit focus mode · ESC';
    btn.appendChild(svgIcon(
      // corners-in / minimize glyph
      'M5.5 1.5v2.5h-2.5v1.5h4v-4h-1.5zm5 0v4h4v-1.5h-2.5v-2.5h-1.5zm-7 9h-2.5v1.5h4v-4h-1.5v2.5zm9-2.5v4h1.5v-2.5h2.5v-1.5h-4z',
      '0 0 16 16'
    ));
    var label = document.createElement('span');
    label.className = 'denvermc-focus-exit__label';
    label.textContent = 'Exit focus';
    btn.appendChild(label);
    btn.addEventListener('click', function () { setFocus(false); });
    document.body.appendChild(btn);
    focusExitEl = btn;
    return btn;
  }

  // -- Mode application -------------------------------------------------
  function setMode(mode) {
    if (!isMapPath()) return;
    // Switching persistent mode also exits focus — the user clearly
    // wants to interact with chrome again.
    focusActive = false;
    if (mode === 'minimal') {
      writePreference(null);
    } else {
      writePreference('analyzer');
    }
    applyMode();
  }

  function setFocus(on) {
    if (!isMapPath()) return;
    if (on && !isLiveRoute()) {
      // Focus only makes sense on the live route — bounce there first.
      window.location.hash = DEFAULT_HASH;
    }
    focusActive = !!on;
    applyMode();
  }

  function syncAnalyzerToggle(mode) {
    if (!analyzerToggleBtnEl) return;
    var label = analyzerToggleBtnEl.querySelector('.denvermc-btn__label');
    if (mode === 'analyzer') {
      analyzerToggleBtnEl.classList.remove('denvermc-btn--primary');
      analyzerToggleBtnEl.classList.add('denvermc-btn--ghost');
      analyzerToggleBtnEl.setAttribute('aria-pressed', 'true');
      analyzerToggleBtnEl.setAttribute('aria-label', 'Switch back to the minimal Colorado Mesh map');
      analyzerToggleBtnEl.title = 'Return to minimal map';
      if (label) label.textContent = 'Minimal map';
    } else {
      analyzerToggleBtnEl.classList.add('denvermc-btn--primary');
      analyzerToggleBtnEl.classList.remove('denvermc-btn--ghost');
      analyzerToggleBtnEl.setAttribute('aria-pressed', 'false');
      analyzerToggleBtnEl.setAttribute('aria-label', 'Open the full analyzer (packets, nodes, channels, analytics, perf)');
      analyzerToggleBtnEl.title = 'Open the full analyzer';
      if (label) label.textContent = 'Full analyzer';
    }
  }

  function syncFocusButton(mode) {
    if (!focusBtnEl) return;
    // Focus button only makes sense on the live route; hide elsewhere.
    var canFocus = isLiveRoute() && mode !== 'focus';
    focusBtnEl.hidden = !canFocus;
  }

  function applyMode() {
    var body = document.body;
    var mode = resolveMode();

    body.classList.toggle('denvermc-shell', mode !== 'off');
    body.classList.toggle('denvermc-minimal', mode === 'minimal');
    body.classList.toggle('denvermc-analyzer', mode === 'analyzer');
    body.classList.toggle('denvermc-focus', mode === 'focus');
    // Lets CSS suppress chrome that collides with the live-page's bottom
    // VCR bar (e.g. the FAB in analyzer mode) without inspecting hashes.
    body.classList.toggle('denvermc-on-live', mode !== 'off' && isLiveRoute());

    if (mode === 'off') {
      if (topbarEl) topbarEl.setAttribute('hidden', '');
      if (fabEl) fabEl.setAttribute('hidden', '');
      if (focusExitEl) focusExitEl.setAttribute('hidden', '');
      if (soundSheetOpen) closeSoundSheet();
      stopMinimalSeedWatch();
      unseedMinimalPanels();
      return;
    }

    // Topbar visible in minimal & analyzer; hidden in focus
    if (topbarEl) {
      if (mode === 'focus') topbarEl.setAttribute('hidden', '');
      else topbarEl.removeAttribute('hidden');
    }
    if (mode === 'focus' && soundSheetOpen) closeSoundSheet();
    // FAB only in analyzer mode — gives a discoverable "return to minimal"
    // affordance separate from the topbar toggle (topbar is hidden on
    // very small viewports where the bar collapses controls).
    if (fabEl) {
      if (mode === 'analyzer') fabEl.removeAttribute('hidden');
      else fabEl.setAttribute('hidden', '');
    }
    if (focusExitEl) {
      if (mode === 'focus') focusExitEl.removeAttribute('hidden');
      else focusExitEl.setAttribute('hidden', '');
    }

    syncAnalyzerToggle(mode);
    syncFocusButton(mode);

    if (mode === 'minimal' || mode === 'focus') {
      startMinimalSeedWatch();
    } else {
      stopMinimalSeedWatch();
      unseedMinimalPanels();
    }
  }

  // -- Minimal-mode seed-hide for CoreScope side panels -----------------
  // (Reused for focus mode — both want panels hidden by default while
  // preserving operator open/close affordances.)
  function seedLivePanel(opts) {
    var el = document.getElementById(opts.panelId);
    if (!el) return false;
    if (el.dataset.denvermcSeeded === '1') return false;
    el.dataset.denvermcSeeded = '1';
    seedHiddenIds.add(opts.panelId);
    if (!el.classList.contains('hidden')) {
      el.classList.add('hidden');
      el.dataset.denvermcSeedAdded = '1';
    }
    if (opts.afterSeed) opts.afterSeed();
    return true;
  }

  function seedMinimalPanels() {
    if (!isLiveRoute()) return;
    if (!document.body.classList.contains('denvermc-minimal')
        && !document.body.classList.contains('denvermc-focus')) return;

    seedLivePanel({
      panelId: 'liveFeed',
      afterSeed: function () {
        var feedShow = document.getElementById('feedShowBtn');
        if (feedShow) feedShow.classList.remove('hidden');
      },
    });
    seedLivePanel({
      panelId: 'liveLegend',
      afterSeed: function () {
        var legendToggle = document.getElementById('legendToggleBtn');
        if (legendToggle) {
          legendToggle.setAttribute('aria-label', 'Show legend');
          legendToggle.textContent = '🎨';
        }
      },
    });
  }

  var seedHiddenIds = new Set();

  function userPrefHidden(key) {
    try { return window.localStorage.getItem(key) === 'true'; }
    catch { return false; }
  }

  function unseedLivePanel(opts) {
    var el = document.getElementById(opts.panelId);
    if (!el) return;
    var weAddedHidden = el.dataset.denvermcSeedAdded === '1';
    delete el.dataset.denvermcSeeded;
    delete el.dataset.denvermcSeedAdded;
    if (weAddedHidden && !userPrefHidden(opts.prefKey) && el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      if (opts.afterUnseed) opts.afterUnseed();
    }
  }

  function unseedMinimalPanels() {
    if (!seedHiddenIds.size) return;
    unseedLivePanel({
      panelId: 'liveFeed',
      prefKey: 'live-feed-hidden',
      afterUnseed: function () {
        var feedShow = document.getElementById('feedShowBtn');
        if (feedShow) feedShow.classList.add('hidden');
      },
    });
    unseedLivePanel({
      panelId: 'liveLegend',
      prefKey: 'live-legend-hidden',
      afterUnseed: function () {
        var legendToggle = document.getElementById('legendToggleBtn');
        if (legendToggle) {
          legendToggle.setAttribute('aria-label', 'Hide legend');
          legendToggle.textContent = '✕';
        }
      },
    });
    seedHiddenIds.clear();
  }

  var minimalSeedObserver = null;

  function startMinimalSeedWatch() {
    seedMinimalPanels();

    if (minimalSeedObserver) return;
    minimalSeedObserver = new MutationObserver(function () {
      var inSeededMode = document.body.classList.contains('denvermc-minimal')
                       || document.body.classList.contains('denvermc-focus');
      if (!inSeededMode || !isLiveRoute()) {
        stopMinimalSeedWatch();
        return;
      }
      seedMinimalPanels();
    });
    var appEl = document.getElementById('app');
    if (appEl) {
      minimalSeedObserver.observe(appEl, { childList: true });
    } else {
      minimalSeedObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  function stopMinimalSeedWatch() {
    if (minimalSeedObserver) {
      minimalSeedObserver.disconnect();
      minimalSeedObserver = null;
    }
  }

  // -- Status indicator -------------------------------------------------
  function syncStatus() {
    if (!statusEl) return;
    var label = statusEl.querySelector('.denvermc-status__label');
    var connected = true;
    var bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav && bottomNav.classList.contains('disconnected')) {
      connected = false;
    }
    var logoState = window.__corescopeLogo;
    if (logoState && typeof logoState.isConnected === 'function') {
      try { connected = !!logoState.isConnected(); } catch { /* ignore */ }
    }
    statusEl.setAttribute('data-state', connected ? 'connected' : 'disconnected');
    if (label) label.textContent = connected ? 'Live' : 'Reconnecting';
  }

  // -- Wire up ----------------------------------------------------------
  function init() {
    ensureDefaultRoute();
    if (!isMapPath()) return;

    buildTopbar();
    buildSoundSheet();
    watchSoundSheetMedia();
    placeSoundGroup();
    buildFab();
    buildFocusExit();
    applyMode();
    syncStatus();
    startSoundControlsWatch();

    window.addEventListener('hashchange', function () {
      ensureDefaultRoute();
      // Leaving the live route always cancels focus — focus only exists
      // on the live map.
      if (!isLiveRoute()) focusActive = false;
      applyMode();
    });
    window.addEventListener('popstate', applyMode);

    setInterval(syncStatus, 1500);

    // Keyboard shortcuts:
    //   ESC in analyzer mode (on live)   -> minimal
    //   ESC in focus mode               -> exit focus (back to minimal)
    //   ESC while typing                -> no-op (let inputs handle it)
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var t = e.target;
      // Allow inputs INSIDE the sheet to escape it (select/volume),
      // but bail otherwise so normal form interactions still own Esc.
      var insideSheet = soundSheetEl && t && soundSheetEl.contains(t);
      if (t && !insideSheet && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (soundSheetOpen) {
        e.preventDefault();
        closeSoundSheet();
        return;
      }
      if (focusActive) {
        e.preventDefault();
        setFocus(false);
        return;
      }
      if (!isLiveRoute()) return;
      if (document.body.classList.contains('denvermc-analyzer')) {
        setMode('minimal');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

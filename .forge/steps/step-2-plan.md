# Step 2 Execution Plan: Colorado Mesh sound controller, selector state, volume, and CoreScope audio suppression

## Goal
Add the overlay-owned sound controller state and a top-bar-only control surface for selecting the Colorado Mesh map sound mode and volume, while preventing CoreScope's old audio control from enabling duplicate sound.

## Current Code Observations
- `corescope-overlay/denvermc-sound.js` is currently a no-playback bootstrap that exposes `window.__coloradoMeshSound` and `window.__denvermcMapSound` with `version`, `status`, and `getState()` only.
- `corescope-overlay/denvermc-shell.js` builds the Colorado Mesh topbar in `buildTopbar()`, with `actions` currently ordered as status, divider, focus button, analyzer button, and site button.
- `corescope-overlay/denvermc-shell.css` owns the visual topbar/action/button styles; this session must delegate visual styling/layout work to Opus UI via `co-ui`.
- `vendor/CoreScope/public/audio.js` persists upstream sound using `live-audio-enabled`, initializes Web Audio in `setEnabled(true)`/`restore()`, and exposes `window.MeshAudio`.
- `vendor/CoreScope/public/live.js` creates the old `liveAudioToggle` and `audioControls`, calls `MeshAudio.restore()`, syncs the upstream UI, and invokes `MeshAudio.sonifyPacket(consolidated)` for every consolidated packet.

## Files to Change
- `corescope-overlay/denvermc-sound.js` — implement sound mode/volume persistence, unlock semantics, old CoreScope audio suppression, and controller API.
- `corescope-overlay/denvermc-shell.js` — add functional top-bar-only selector/volume markup and wire it to `window.__coloradoMeshSound`.
- `corescope-overlay/denvermc-shell.css` — visual styling/layout for the new selector/slider, delegated to `co-ui`.
- `.forge/steps/step-2-plan.md` — this execution plan.

## Ordered Implementation Checklist
1. Expand `denvermc-sound.js` to define allowed modes, storage keys, safe localStorage helpers, safe volume parsing, state snapshots, and API methods required by the master plan.
2. Implement unlock behavior so saved non-off modes are displayed as selected but remain locked/unplaying on page load; only `setMode(mode, { userGesture: true })` unlocks audio.
3. Add upstream audio suppression in `denvermc-sound.js`: force `live-audio-enabled=false`, disable/hide `#liveAudioToggle` and `#audioControls` when they appear, and keep `window.MeshAudio` disabled without editing vendor files.
4. Add a small event system to the controller so shell controls can subscribe to state changes and stay in sync with persisted values and lock status.
5. Add shell integration in `denvermc-shell.js`: build a top-bar sound group with a Colorado Mesh-labeled mode selector and a simple persisted volume range input, then wire changes to controller methods.
6. Run `co-ui` to own visual styling/layout changes for the topbar selector/slider in `corescope-overlay/denvermc-shell.css`, with constraints to keep it compact, accessible, mobile-safe, and free of DenverMC visible copy.
7. Run static verification and overlay apply checks; clean any generated submodule files after `npm run corescope:apply-overlay` so `vendor/CoreScope` remains clean.
8. Stage only Step 2 files and request Forge Claude review against the master plan and this execution plan.

## Interfaces and Data Contracts
- Modes: `off`, `native`, `generative`, `ensemble`, `blaster`.
- Visible labels: `Sound Off`, `Native+`, `Generative Key`, `Orchestral Ensemble`, `Space Blaster`.
- `localStorage['coloradoMesh.map.soundMode'] = 'off'|'native'|'generative'|'ensemble'|'blaster'`.
- `localStorage['coloradoMesh.map.soundVolume'] = decimal string from 0 through 1`.
- `window.__coloradoMeshSound.setMode(mode, { userGesture })` persists a valid mode; non-off with `userGesture: true` unlocks the controller, while non-off without a gesture remains locked.
- `window.__coloradoMeshSound.setVolume(value)` clamps/persists volume without requiring unlock.
- `window.__coloradoMeshSound.isUnlocked()` returns the session unlock state.
- `window.__coloradoMeshSound.subscribe(listener)` returns an unsubscribe function and sends snapshots after state changes.
- `window.__coloradoMeshSound.getState()` returns `{ mode, volume, unlocked, status, available, counters }`.

## Verification Plan
- Automated: `npm run lint`; `npm run typecheck`; `npm run corescope:apply-overlay`; `git diff --check`; `git -C vendor/CoreScope status --short` after cleanup.
- Manual/browser: later Step 2 validation in `/map#/live` should confirm default Off, persisted non-off selected but locked after reload, volume persistence, and old CoreScope audio hidden/disabled.
- Regression: repeated overlay application injects sound assets once; old CoreScope audio localStorage cannot cause duplicate audio; visible copy says Colorado Mesh, not DenverMC.

## Stop Conditions
- If `co-ui` is unavailable or cannot edit the visual selector/slider styling, pause and provide an Opus UI handoff prompt instead of doing visual styling directly.
- If suppressing CoreScope audio requires editing `vendor/CoreScope`, stop and choose an overlay-only interception approach.
- If browser-side Web Audio creation would be required on page load, stop and keep the controller locked/no-playback until a user gesture.
- If tests or lint failures reveal the step needs packet routing or actual sound synthesis, stop and defer that to later planned steps rather than expanding Step 2 scope.

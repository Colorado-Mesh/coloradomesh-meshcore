# Step 4 Execution Plan: Procedural Native+, Generative Key, and Space Blaster modes

## Goal
Implement three active procedural sound modes in the overlay-owned sound controller: Native+ packet cues, Generative Key musical motifs, and procedural Space Blaster cues. The modes must use metadata-only sound events, shared Web Audio primitives, central caps/cooldowns, and no external samples or spatial audio.

## Current Code Observations
- `corescope-overlay/denvermc-sound.js` already owns mode/volume persistence, user-gesture unlock, CoreScope audio suppression, packet normalization, dedupe, priority lanes, and a placeholder `markPlaceholderPlayed(event)` dispatch path.
- `ensureAudioContext()` currently creates a single `AudioContext` and `masterGain` connected directly to `audioCtx.destination`; Step 4 should insert shared output shaping there without creating audio on page load.
- `routeEvent(event)` already drops Off, locked, and unavailable states before routing, then updates counters and calls the placeholder; Step 4 can replace that placeholder with mode strategy dispatch.
- Normalized `SoundEvent` exposes only `{ id, type, modeHint, channelName, channelHash, isEmergency, isPriority, observationCount, hopCount, intensity, timestamp }`, so mode mapping can stay privacy-safe without reading message text.
- CoreScope's `audio-v1-constellation.js` shows useful oscillator/filter/envelope cleanup patterns, but it uses stereo panning; this step must keep output centered.
- CoreScope's `audio.js` helper patterns confirm simple scale quantization and active-voice release timers are enough; the overlay should own its engine instead of depending on upstream `MeshAudio` internals.

## Files to Change
- `.forge/steps/step-4-plan.md` — focused execution plan for this step.
- `corescope-overlay/denvermc-sound.js` — shared audio primitives, procedural mode strategies, dispatch, counters/test seams if needed.

## Ordered Implementation Checklist
1. Add runtime audio-engine state for a shared limiter/output chain, active voice count, short cooldown tracking, and scheduled node cleanup without changing page-load behavior.
2. Update `ensureAudioContext()` and `applyVolume()` so all procedural modes route through the same master gain and limiter, respect volume immediately, and remain muted when locked/off.
3. Add small helper functions for clamping, deterministic event seeds, scale-to-frequency conversion, audio envelopes, safe disconnect/cleanup, and centered oscillator/noise cue scheduling.
4. Implement `playNative(event)` for short polished packet tones with type/hash pitch variation, normal/low softer cues, and stronger emergency/priority accents.
5. Implement `playGenerative(event)` for short event-driven motifs/arpeggios/chords in one pleasant key, with intensity/hop/observation metadata affecting density and register.
6. Implement `playBlaster(event)` with generic procedural oscillator/noise/filter sweeps for zaps, impacts, and shield-like accents, avoiding samples and distinctive copyrighted imitation.
7. Replace the placeholder dispatch with `playCurrentMode(event)` while preserving `played` counter and `lastEvent` updates only when a cue is accepted.
8. Enforce central voice caps, per-mode/lane cooldowns, and bounded cleanup timers so burst injections cannot create unbounded AudioNodes.
9. Expose enough existing state through `getState()` counters/last event to manually verify accepted/dropped playback without adding UI.

## Interfaces and Data Contracts
- Existing public API remains: `setMode`, `setVolume`, `isUnlocked`, `subscribe`, `normalizePacket`, `routeEvent`, `injectTestEvent`, and `getState`.
- Internal mode strategies implement `play(event) -> boolean`, where `true` means the cue was scheduled and should increment `played`.
- Procedural modes consume only the normalized `SoundEvent` metadata shape; no text/sender fields are read or added.
- Modes covered in this step: `native`, `generative`, `blaster`; `ensemble` remains a safe placeholder until Step 5.
- Output stays centered; no `StereoPannerNode` or geographic panning.

## Verification Plan
- Automated: `node --check corescope-overlay/denvermc-sound.js`; `npm run lint`; `npm run typecheck`; `git diff --check`; `npm run corescope:apply-overlay`; `git -C vendor/CoreScope status --short` after cleaning generated overlay artifacts if needed.
- Manual: open `/map#/live`, enable Native+, Generative Key, and Space Blaster one at a time, then call `window.__coloradoMeshSound.injectTestEvent(...)` with normal and emergency metadata events to confirm distinct bounded cues.
- Regression: confirm Off/locked still drop events; CoreScope upstream audio remains suppressed; volume slider affects all procedural modes; `ensemble` does not crash before Step 5.

## Stop Conditions
- If high-quality mode behavior requires external samples, defer that to Step 5 instead of adding assets here.
- If implementation would require editing `vendor/CoreScope`, stop and keep the overlay-owned engine approach.
- If browser autoplay prevents manual audio validation, keep the code gated by user gesture and report the validation limitation instead of adding auto-unlock behavior.
- If Space Blaster starts depending on recognizable copyrighted audio patterns or samples, simplify to generic synthetic zaps/impacts.

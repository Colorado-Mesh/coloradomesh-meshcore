# Step 1 Execution Plan: Sound density engine and AudioWorklet bed

## Goal
Rework the Colorado Mesh map sound engine so every valid metadata-only packet contributes to a rolling traffic density model before any accent throttling, and render that density through a bounded AudioWorklet-backed procedural bed.

## Current Code Observations
- `corescope-overlay/denvermc-sound.js` currently runs dedupe/token buckets before playback in `routeEvent`, so burst traffic is discarded before it can contribute to sound density.
- `scheduleModeCue` applies active voice caps and lane cooldowns directly to the main audible output, which makes busy traffic thin out.
- `normalizePacket` derives intensity from `raw_hex` via `rawHexFromPacket` and `byteAt`, which violates the stricter metadata-only boundary for this pass.
- Existing public API is useful and should remain stable: `getState`, `setMode`, `setVolume`, `isUnlocked`, `subscribe`, `normalizePacket`, `routeEvent`, `injectTestEvent`, and `suppressCoreScopeAudio`.
- `scripts/apply-corescope-overlay.mjs` already recursively copies `corescope-overlay/sound` into CoreScope public output, so a worklet under `corescope-overlay/sound/` can be served same-origin without changing the injector.

## Files to Change
- `corescope-overlay/denvermc-sound.js` — add metadata-only density model, worklet loading/state, density scheduler, and retuned capped accents.
- `corescope-overlay/sound/denvermc-density-worklet.js` — new AudioWorkletProcessor for the continuous procedural density bed.

## Ordered Implementation Checklist
1. Remove raw-byte intensity as a sound input and change `normalizePacket` to compute event seed/intensity from metadata-only fields.
2. Add `trafficModel` state and helper functions to record every valid event into rolling buckets before dedupe/accent throttling.
3. Add worklet state, bed bus, accent bus, worklet load/create helpers, and a bounded fallback if `audioWorklet` is unavailable.
4. Add a scheduler loop that snapshots traffic density and updates worklet AudioParams while sound is on/unlocked.
5. Change `routeEvent` so ingestion happens before dedupe/bucket checks and those checks only gate optional accents.
6. Retune mode accent functions to sit over the density bed and use lower bounded gains/cooldowns.
7. Extend `getState()` diagnostics with `traffic`, `worklet`, scheduler, and active source data for later tests.
8. Ensure Off/mode changes/suspend/closed context stop timers, sources, and worklet nodes cleanly.

## Interfaces and Data Contracts
- Public `window.__coloradoMeshSound` API remains backward-compatible.
- New static worklet module path: `/sound/denvermc-density-worklet.js`.
- Worklet parameters: `density`, `priority`, `pulse`, `mode`, and `level` in normalized 0..1-ish ranges.
- `getState().traffic` exposes aggregate counters and recent density values without payload content.
- `getState().worklet` exposes status/load/fallback state but not sensitive data.

## Verification Plan
- Automated: `npm run lint`; `npm run typecheck`.
- Manual: use browser console on local map to call `injectTestEvent` bursts and inspect `getState().traffic`/`getState().worklet`.
- Regression: Sound Off remains default; saved non-off mode remains locked until explicit user gesture; upstream CoreScope audio remains suppressed.

## Stop Conditions
- If AudioWorklet cannot be served from `/sound/` in Docker/static CoreScope without injector changes, pause and update the master plan.
- If metadata-only normalization cannot preserve enough useful event identity without raw bytes, pause and ask before weakening privacy.
- If worklet setup requires a new build tool/bundler, do not add it in this step; use a plain static worklet module.

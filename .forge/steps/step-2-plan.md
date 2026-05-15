# Step 2 Execution Plan: Sound density regression tests

## Goal
Add automated coverage proving map sound remains metadata-only, density-first, mode-selectable, and bounded under burst traffic.

## Current Code Observations
- `tests/e2e/smoke.spec.ts` already mounts the map shell and sound overlay directly with `mountMapSoundOverlay`, stubs upstream `MeshAudio`, and validates Off/default/persisted locked behavior.
- `getSoundState` currently types only the older basic sound state, but Step 1 now exposes `counters`, `traffic`, `worklet`, `activeVoices`, and `lastNormalizedEvent` through the public API.
- Step 1 only creates/resumes real browser audio after a user gesture through the visible mode select; headless tests should assert public state/counters rather than audible output.
- Step 1 routes unlocked/on events into `traffic` before dedupe and bucket checks, so tests can use duplicate/burst `injectTestEvent` calls to prove density still rises while accent drops rise.
- `normalizePacket` now ignores raw bytes/message body content for sound fields and derives seed/intensity from metadata fields.

## Files to Change
- `tests/e2e/smoke.spec.ts` — extend the sound harness types/helpers and add regression tests for density bursts, metadata privacy, mode routing, and cleanup.

## Ordered Implementation Checklist
1. Extend test-side sound state typings to include public diagnostics added by Step 1.
2. Add helper functions for setting sound mode via visible controls, injecting synthetic sound packets/events, and reading public state.
3. Add a burst regression test that unlocks a sound mode, injects many repeated metadata events, and asserts `traffic.total`/`counters.ingested` rise even when `deduped` or `accentDropped` rise.
4. Add a metadata privacy test that normalizes packets differing only by `raw_hex` and decoded message-body fields, and asserts normalized sound-driving fields are unchanged.
5. Add mode-selection coverage for Native+, Generative Key, Orchestral Ensemble, and Space Blaster, including locked persisted state and unlocked public worklet diagnostics where practical.
6. Add bounded cleanup assertions after bursts and switching to Off using public state only.
7. Run the targeted map sound Playwright tests plus lint/typecheck.

## Interfaces and Data Contracts
- Tests use only `window.__coloradoMeshSound` public methods: `getState`, `setMode` indirectly through visible controls, `normalizePacket`, and `injectTestEvent`.
- Public diagnostics asserted by tests: `counters.ingested`, `counters.accentDropped`, `counters.deduped`, `traffic.total`, `traffic.density`, `worklet.status`, `worklet.schedulerActive`, `worklet.fallbackActive`, and `activeVoices`.
- Tests should not inspect closure-private AudioNodes, buckets, timers, or raw decoded message internals.

## Verification Plan
- Automated: `PLAYWRIGHT_PORT=4323 npx playwright test tests/e2e/smoke.spec.ts --project=chromium --workers=1 --grep "map sound"`
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Regression: Existing default Off, persisted locked state, and upstream suppression assertions must keep passing.

## Stop Conditions
- If headless Chromium blocks all AudioContext unlock behavior despite visible user gestures, assert locked-mode privacy/default behavior and public counter behavior without forcing private internals.
- If current public diagnostics are insufficient to prove bounded cleanup, add the smallest public diagnostic field to `getState()` rather than testing private closure state.
- Do not modify mobile layout, logo files, or visual styling in this step.

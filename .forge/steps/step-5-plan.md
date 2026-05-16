# Step 5 Execution Plan: Add final browser coverage and audio acceptance checks

## Goal
Verify the completed map sound rewrite across automated tests, static/Docker delivery, feasible browser coverage, and manual listening, while preserving Colorado Mesh user-facing labels, current sound mode names, metadata-only audio generation, and bounded resource behavior.

## Current Code Observations
- `playwright.config.ts` currently defines one Chromium project, so adding WebKit globally would expand `npm run test:e2e`; this step should prefer explicit targeted WebKit commands unless a scoped project is clearly safe.
- `tests/e2e/smoke.spec.ts` now has deterministic map-sound coverage for admission/coalescing, Orchestral Ensemble role/template diversity, normalized public text, Space Blaster patch bounds, density, and cleanup.
- `scripts/docker-smoke.mjs` already validates `/map`, `/denvermc-sound.js?v=denvermc`, `/sound/denvermc-density-worklet.js`, `/sound/orchestral/manifest.json`, attribution coverage, and every manifest sample URL.
- `package.json` exposes repo-wide `lint`, `typecheck`, `test:unit`, `build`, and Docker smoke scripts needed for final verification.
- Manual listening remains the only reliable acceptance check for subjective musical quality; automated diagnostics can confirm variety and bounds but not taste.

## Files to Change
- `tests/e2e/smoke.spec.ts` — add final cross-mode public-control diagnostics and coverage tags so targeted Chromium/WebKit sound commands can run without changing the whole Playwright matrix.
- `scripts/docker-smoke.mjs` — add any missing final static sound-delivery assertions if inspection shows gaps.
- `.forge/steps/step-5-plan.md` — this execution plan.
- `.forge/reviews/claude-step-5.json` — review artifact after staged review.

## Ordered Implementation Checklist
1. Add or adjust targeted smoke coverage in `tests/e2e/smoke.spec.ts` for cross-mode public controls and diagnostics across Sound Off, Orchestral Ensemble, and Space Blaster.
2. Add `@sound` tags to sound-focused Playwright tests if needed so Chromium and WebKit can run a targeted sound subset without duplicating unrelated smoke tests.
3. Keep `playwright.config.ts` unchanged unless a scoped WebKit project can be added without making `npm run test:e2e` unexpectedly run the full suite twice.
4. Confirm Docker smoke covers final sound assets, worklet, manifest, attribution, and sample URLs; only change it if a final gap is found.
5. Run repo-wide automated verification: lint, typecheck, unit tests, targeted Chromium sound tests, and build.
6. Probe feasible WebKit/Safari coverage with an explicit targeted command and report any local browser/tooling limitation accurately.
7. Build a local Docker image and run Docker smoke if Docker is available; report any daemon/tooling limitation accurately.
8. Start/use the app in a browser for manual Orchestral Ensemble and Space Blaster listening, including quiet and busy traffic plus Off cleanup.
9. Stage only Step 5 files, request Forge review, address findings, and commit after approval.

## Interfaces and Data Contracts
- No public API changes are planned.
- Mode values and visible labels remain `off`, `native`, `generative`, `ensemble`, and `blaster` with current visible names.
- Public user-facing copy must continue to say Colorado Mesh, not DenverMC, except existing technical asset filenames/API aliases.
- Sound generation remains browser-local, user-triggered, procedural/sample-based from metadata only, and no message contents/raw payloads are used.
- `window.__coloradoMeshSound` and `window.__denvermcMapSound` remain available for compatibility.

## Verification Plan
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Automated: `npm run test:unit`
- Automated: `npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep "@sound|map sound|Orchestral Ensemble|Space Blaster"`
- Automated: `npm run build`
- WebKit where feasible: run a scoped temporary WebKit Playwright config for the `@sound` smoke subset without changing the default `playwright.config.ts`; if local WebKit binaries are missing, record the Playwright tooling limitation accurately.
- Docker if available: `docker build -t colorado-meshcore-audio-smoke .` then `npm run docker:smoke -- --image colorado-meshcore-audio-smoke`
- Browser functional: open Docker `/map`, use Orchestral Ensemble and Space Blaster with quiet and busy synthetic traffic, confirm public controls, diagnostics, volume behavior, Off cleanup, and no `/sound/**` network failures.
- Human listening: a human/operator must listen to Orchestral Ensemble and Space Blaster quiet/busy traffic and confirm subjective musical quality; browser diagnostics alone do not satisfy this acceptance check.

## Stop Conditions
- Pause if final verification requires changing public sound controls, mode names, or user-facing labels.
- Pause if WebKit support requires broad Playwright config changes that would unexpectedly duplicate the full suite or destabilize CI.
- Pause if Docker/manual verification reveals missing assets or browser errors that require changing already-reviewed step scope.
- Pause if manual listening still finds either Orchestral Ensemble or Space Blaster unacceptable after the implemented changes.

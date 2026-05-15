# Step 4 Execution Plan: Full integration verification and final Forge review

## Goal
Verify the completed sound density engine, regression coverage, mobile overlay polish, and logo replacement as an integrated Docker-served product before final Forge review.

## Current Code Observations
- `scripts/docker-smoke.mjs` already builds a temporary container, checks `/map`, overlay JS/CSS injection, `/denvermc-sound.js`, orchestral manifest/sample assets, CoreScope APIs, WebSocket, and unencoded Leaflet tile placeholders.
- `scripts/docker-smoke.mjs` does not yet fetch the new density worklet or new same-origin logo/favicon assets added in Steps 1 and 3.
- `docker/nginx.conf` proxies `/sound/` and overlay JS/CSS assets to CoreScope, while root favicon and Next-managed `/brand/color/**` assets resolve through Next via the catch-all `/` route.
- Step 3 Playwright coverage now exercises mobile sheet geometry, analyzer-mode topbar/sound trigger, focus-mode hiding, safe-area padding, 44px brand target, site icon metadata, and vendored overlay logo path.
- Step 1 and Step 2 reviews are approved; Step 3 was approved after analyzer/safe-area/touch-target fixes.

## Files to Change
- `scripts/docker-smoke.mjs` — add smoke checks for `/sound/denvermc-density-worklet.js`, `/brand/color/mesh-color-256.png`, `/favicon.ico`, `/favicon-16x16.png`, `/favicon-32x32.png`, and `/apple-touch-icon.png` if not already covered.
- `.forge/steps/step-4-plan.md` — this execution plan.
- `.forge/reviews/claude-step-4.json` — save Step 4 reviewer output.
- `.forge/reviews/final-claude-review.json` — save final reviewer output if final review is separate.

## Ordered Implementation Checklist
1. Extend Docker smoke with static asset checks for the density worklet and new logo/favicon routes without printing or requiring any secrets.
2. Run lint, typecheck, unit tests, full Chromium smoke tests, and `git diff --check`.
3. Build `colorado-meshcore-site:sound-mobile-fix` locally and run `npm run docker:smoke -- --image colorado-meshcore-site:sound-mobile-fix`.
4. Run a browser-based synthetic sound integration pass against the mounted overlay API for all modes under burst traffic, asserting density/ingestion stays active and cleanup remains bounded.
5. Run or reuse portrait browser checks at 320, 360, 390, and 430px for mobile sheet/minimal/analyzer/focus behavior.
6. Stage only Step 4 files and run Forge Step 4 review against the staged diff.
7. Run final Forge review against all committed changes since `.forge/.base-ref`, save review output, and commit approved Step 4 artifacts.

## Interfaces and Data Contracts
- Docker image must serve `/map`, injected overlay assets, `/sound/denvermc-density-worklet.js`, orchestral sample assets, and same-origin logo/favicon assets.
- Sound mode, volume, and user gesture contracts remain those verified in Steps 1–3.
- No MQTT password or channel-key secrets are required or printed by any verification command.

## Verification Plan
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Automated: `npm run test:unit`
- Automated: `PLAYWRIGHT_PORT=4325 npx playwright test tests/e2e/smoke.spec.ts --project=chromium --workers=1`
- Automated: `git diff --check`
- Automated: `docker build -t colorado-meshcore-site:sound-mobile-fix .`
- Automated: `npm run docker:smoke -- --image colorado-meshcore-site:sound-mobile-fix`
- Browser/synthetic: all sound modes under burst traffic retain density/ingestion and bounded cleanup.
- Browser/portrait: 320, 360, 390, and 430px portrait checks for mobile sheet, analyzer topbar, and focus hiding.

## Stop Conditions
- Stop and ask before using any real MQTT password or external live secret-dependent environment.
- Stop if Docker is unavailable or a local port conflict blocks smoke verification after trying a different non-shared smoke port.
- Stop if a verification failure requires UI/visual implementation beyond small non-visual test/smoke adjustments; delegate visual fixes to Opus UI.
- Do not publish a release in this step unless the user explicitly asks after the Forge workflow is complete.

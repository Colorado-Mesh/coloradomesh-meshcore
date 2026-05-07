# Forge Implementation Plan

## Overview
Run a fresh max-parity hardening pass on the current Colorado MeshCore Next.js site. The pass keeps the existing Next.js 16 / React 19 / Node 24 / Docker standalone architecture, but closes high-value gaps against `Colorado-Mesh/meshcore-utilities-site` and `yellowcooln/meshcore-mqtt-live-map`: typed parity fixtures, generated repeater and companion settings JSON, guarded serial application of settings JSON, full 4-character PrefixMatrix behavior, server-side live-map service integration, runtime public map configuration, advanced live-map proxy endpoints where feasible, delegated Opus UI work for full in-site map UX, and pragmatic but blocking CI checks for tests, accessibility, Lighthouse, build, and Docker runtime smoke.

## Technical Decisions
- Keep the current Next.js 16 App Router, React 19, TypeScript 5, Node 24, npm lockfile, Docker standalone output, Leaflet/React Leaflet stack, and no site-owned database. Research refs: ITEM-stack-1, ITEM-stack-4, ITEM-architecture-10.
- Treat `meshcore-mqtt-live-map` as the production decoder/state service. The Next site should consume it server-side and may keep direct MQTT only as a decoded-JSON fallback, not as the raw MeshCore packet decoder of record. Research refs: ITEM-stack-2, ITEM-stack-3, ITEM-architecture-4, ITEM-pitfalls-3, ITEM-pitfalls-11.
- Because the user selected full in-site live-map parity, implement practical upstream endpoint proxying and delegate the visual/interactive map UI implementation to Opus UI. This Codex-backed session must not directly perform visual/aesthetic frontend implementation. Research refs: ITEM-architecture-6, ITEM-architecture-7, ITEM-prior-art-8, ITEM-prior-art-9.
- Direct copying/adaptation from `Colorado-Mesh/meshcore-utilities-site` is allowed by user decision, despite research noting missing license metadata. Keep provenance notes for imported fixtures and avoid unnecessary wholesale copies. Research refs: ITEM-pitfalls-10, ITEM-prior-art-1, ITEM-prior-art-12.
- Prefer bearer-token authentication for protected live-map server-side fetches instead of query-string tokens. Research refs: ITEM-pitfalls-5, ITEM-architecture-4.
- Add `zod`/schema-style boundaries for local data contracts and AJV for JSON-schema fixture validation if useful; add Vitest unit/contract tests, Playwright Chromium smoke tests, axe accessibility checks, Lighthouse CI, and Docker run smoke within the roughly 10-minute PR budget. Research refs: ITEM-stack-6, ITEM-stack-8, ITEM-stack-9, ITEM-stack-10, ITEM-stack-12, ITEM-architecture-8, ITEM-architecture-9.
- Contacts export remains out of scope by user decision.

## Implementation Steps

### Step 1: Test, validation, and parity-manifest foundation
**Goal:** Add the tooling and machine-readable parity foundation that later steps can use to prove upstream coverage instead of relying on visual inspection.
**Why now:** Config exports, PrefixMatrix, serial safety, map normalization, accessibility, Lighthouse, and CI hardening all need test scripts and stable fixtures before feature work expands.
**Dependencies:** Current `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, no existing test script, and upstream fixture locations under `/tmp/meshcore-utilities-site` and `/tmp/meshcore-mqtt-live-map`.
**Files:**
- Modify `package.json`
- Modify `package-lock.json`
- Add `vitest.config.ts`
- Add `playwright.config.ts`
- Add `lighthouserc.json` or `.lighthouserc.json`
- Add `src/lib/parity/manifest.ts`
- Add `src/lib/parity/report.ts`
- Add `src/lib/parity/fixtures/` JSON fixtures sourced/adapted from upstream utilities and live-map
- Add `src/lib/parity/__tests__/manifest.test.ts`
- Add `src/test/setup.ts` if needed
- Add `tests/e2e/` smoke test files
**Existing code to inspect first:**
- `package.json` scripts/dependencies
- `package-lock.json`
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `src/lib/validation.ts`
- `/tmp/meshcore-utilities-site/static/data/recommended_settings.json`
- `/tmp/meshcore-utilities-site/static/data/default_serial_commands.json`
- `/tmp/meshcore-utilities-site/serial_commands.schema.json`
- `/tmp/meshcore-utilities-site/static/data/regions.json`
- `/tmp/meshcore-mqtt-live-map/tests/test_api_nodes_modes.py`
**Implementation plan:**
1. Add pragmatic dev dependencies for tests and quality gates: Vitest, jsdom/Testing Library if needed, Playwright, axe integration for Playwright, Lighthouse CI, `zod`, and AJV only where the step’s schema validation needs it.
2. Add scripts: `test`, `test:unit`, `test:e2e`, `test:a11y`, `test:lighthouse`, and any local CI helper script needed to keep commands readable.
3. Create a parity manifest that enumerates upstream utility, repeater-config, serial, PrefixMatrix, live-map API/UI, Docker, and CI items with statuses, source refs, local implementation refs, and test coverage refs.
4. Vendor or adapt minimal upstream fixtures needed for automated parity checks, including recommended settings, serial commands/schema, regions, and representative live-map node payloads.
5. Add provenance metadata for imported/adapted fixtures because research flagged upstream licensing ambiguity, even though the user allowed copying.
6. Add initial unit tests that validate the manifest shape and fixture loadability without yet asserting feature-specific behavior.
7. Add skeleton Playwright/Lighthouse config targeting local Next dev/production server without making UI assumptions that Opus has not implemented yet.
**Contracts and interfaces:**
- `src/lib/parity/manifest.ts` exports a typed manifest consumable by tests and, later, generated maintainer reports.
- Test scripts must be runnable locally via npm and usable in GitHub Actions.
- Fixture data must not require network access during tests.
**State/data changes:** Adds dev dependencies and test/parity fixtures only.
**Edge cases:**
- Lighthouse CI can be noisy; configure deterministic local URLs and reasonable budgets, then tighten only where practical.
- Playwright browsers may need explicit install handling in CI.
- Do not commit large upstream artifacts or generated browser reports.
**Acceptance criteria:**
- `npm run test:unit` runs and passes with the initial manifest/fixture tests.
- Test/lighthouse/playwright configs are present and syntactically valid.
- Parity manifest exists and covers utilities, repeater configs, serial, PrefixMatrix, live map, Docker, and CI.
**Verification commands:**
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
**Manual validation:** None beyond checking generated test commands run locally; browser validation happens after UI changes.
**Risks:**
- Adding too many quality dependencies can slow PR CI beyond the user’s ~10-minute budget. Research refs: ITEM-stack-12, ITEM-architecture-9.
- Imported upstream fixtures can drift; the manifest must make provenance and update responsibility explicit. Research refs: ITEM-architecture-1, ITEM-pitfalls-10.
**Out of scope for this step:** Implementing feature parity, UI redesign, CI workflow enforcement, and Docker runtime smoke.

### Step 2: Canonical map snapshot, runtime config endpoint, bearer live-map auth, and sample-data guard
**Goal:** Stabilize map data behind one snapshot contract, make public map settings runtime-configurable after Docker build, and remove token/sample-data pitfalls before advanced map features are layered on.
**Why now:** Current client code fetches `/api/map/nodes` and `/api/map/stats` separately, live-map token handling uses query params, tile URL config is not consumed by the map, and production sample data can mislead users.
**Dependencies:** Step 1 test foundation; current map store/config/hooks/routes.
**Files:**
- Modify `src/lib/map/config.ts`
- Modify `src/lib/map/store.ts`
- Modify `src/lib/map/normalize.ts`
- Modify `src/lib/map/types.ts`
- Add `src/app/api/map/snapshot/route.ts`
- Add `src/app/api/map/runtime/route.ts`
- Modify `src/app/api/map/nodes/route.ts`
- Modify `src/app/api/map/stats/route.ts`
- Modify `src/hooks/useMapSnapshot.ts`
- Modify `src/components/NetworkMap.tsx` only for non-visual runtime config wiring if necessary
- Modify `.env.example`
- Modify `compose.yaml`
- Add `src/lib/map/__tests__/` contract tests
**Existing code to inspect first:**
- `src/lib/map/config.ts` env parsing and `sampleData` default
- `src/lib/map/store.ts` `buildLiveMapApiUrl`, `refreshLiveMapApiSnapshot`, direct MQTT fallback, and snapshot builders
- `src/hooks/useMapSnapshot.ts` parallel nodes/stats fetches
- `src/app/api/map/nodes/route.ts`
- `src/app/api/map/stats/route.ts`
- `src/components/NetworkMap.tsx` hard-coded tile URL/attribution
- `.env.example`
- `compose.yaml`
- `/tmp/meshcore-mqtt-live-map/README.md` API token behavior
**Implementation plan:**
1. Define a canonical `MapSnapshot` API response for `GET /api/map/snapshot` that returns nodes, links, routes, stats, connection, source, generated timestamp, runtime warnings, and advanced feature availability.
2. Keep `/api/map/nodes` and `/api/map/stats` as compatibility wrappers over the same `getMapSnapshot()` result, not independent primary client fetch paths.
3. Change live-map API fetches to send `Authorization: Bearer <token>` when `MESHCORE_LIVE_MAP_API_TOKEN` is set; remove token query-param construction unless a compatibility fallback is explicitly required by a test.
4. Add a runtime public config route for map tile URL, attribution, default center/zoom if needed, sample/live source labels, and production warning state; update client-side map code to consume it without relying on `NEXT_PUBLIC_*` values that are frozen at build time.
5. Add production sample-data warning semantics: when `NODE_ENV=production` and the source is sample data without an explicit demo-mode setting, expose a warning in snapshot/runtime responses for UI and CI smoke tests.
6. Add Vitest tests for env parsing, bearer-token fetch behavior, snapshot wrapper consistency, sample/demo guard, and malformed live-map payload normalization.
7. Update `.env.example` and Compose comments to clearly separate build-time public variables from runtime server variables.
**Contracts and interfaces:**
- `GET /api/map/snapshot` returns the canonical `ApiResponse<MapSnapshot>`.
- `GET /api/map/runtime` returns public runtime map configuration and warning flags only; it must not expose credentials.
- `MESHCORE_LIVE_MAP_API_TOKEN` is server-only and sent as a bearer token.
- `/api/map/nodes` and `/api/map/stats` remain supported compatibility routes.
**State/data changes:** No persistent state; in-memory live-map API cache remains bounded by refresh interval.
**Edge cases:**
- Build must pass without live-map URL/token.
- Bearer auth must not leak token in error messages, logs, or browser responses.
- Snapshot and wrappers must agree on generated data for one request cycle.
- Runtime tile config must not include invalid URLs or unsafe attribution HTML.
**Acceptance criteria:**
- Map clients can use `/api/map/snapshot` as a single source of truth.
- Protected live-map fetches use bearer auth.
- Runtime map config can change after image build through server env.
- Production sample/demo warning is machine-readable.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
- `curl -s http://localhost:3000/api/map/snapshot` during manual server validation
- `curl -s http://localhost:3000/api/map/runtime` during manual server validation
**Manual validation:** Run the app, fetch `/api/map/snapshot`, `/api/map/nodes`, `/api/map/stats`, and `/api/map/runtime`; verify no credentials appear and warnings/source labels make sense for sample mode.
**Risks:**
- Runtime public config can accidentally expose server-only env values if not explicitly whitelisted. Research refs: ITEM-pitfalls-13.
- Token query strings can leak through logs if compatibility fallback is kept. Research refs: ITEM-pitfalls-5.
- Separate nodes/stats paths can keep inconsistency if clients are not migrated. Research refs: ITEM-pitfalls-6, ITEM-architecture-5.
**Out of scope for this step:** Advanced live-map endpoint proxying, visual map parity, and utility config export.

### Step 3: Advanced live-map proxy contracts and sidecar runtime topology
**Goal:** Add feasible server-side proxy support for upstream live-map operator data and document a Docker/Compose sidecar topology without making the Next app the raw MQTT decoder.
**Why now:** The user wants full in-site live-map parity, but production should run the upstream live-map service separately; UI parity needs safe API contracts first.
**Dependencies:** Step 2 canonical snapshot/runtime config and bearer-token fetch helper.
**Files:**
- Add `src/lib/live-map/client.ts`
- Add `src/lib/live-map/types.ts`
- Add `src/lib/live-map/normalize.ts`
- Add `src/app/api/live-map/route.ts` or scoped route handlers under `src/app/api/live-map/*/route.ts`
- Add feasible proxy routes such as `src/app/api/live-map/snapshot/route.ts`, `stats/route.ts`, `peers/route.ts`, `routes/route.ts`, `coverage/route.ts`, `los/route.ts`, `weather/route.ts`, and possibly `ws/route.ts` only if practical in the Next runtime
- Modify `src/lib/parity/manifest.ts`
- Modify `.env.example`
- Modify `compose.yaml`
- Add tests under `src/lib/live-map/__tests__/`
**Existing code to inspect first:**
- `src/lib/map/store.ts` live-map fetch logic from Step 2
- `/tmp/meshcore-mqtt-live-map/backend/app.py`
- `/tmp/meshcore-mqtt-live-map/backend/los.py`
- `/tmp/meshcore-mqtt-live-map/backend/weather.py`
- `/tmp/meshcore-mqtt-live-map/backend/static/app.js`
- `/tmp/meshcore-mqtt-live-map/tests/test_api_auth.py`
- `/tmp/meshcore-mqtt-live-map/tests/test_coverage_endpoint.py`
- `/tmp/meshcore-mqtt-live-map/tests/test_los_endpoints.py`
- `/tmp/meshcore-mqtt-live-map/tests/test_weather_endpoints.py`
- `/tmp/meshcore-mqtt-live-map/tests/test_websocket_snapshot.py`
- `compose.yaml`
**Implementation plan:**
1. Build a reusable server-side live-map client with base URL normalization, bearer-token auth, timeout handling, safe error messages, and response-size protection.
2. Inventory upstream endpoints from the current cloned live-map service and mark each as `proxied`, `deferred`, or `not feasible` in the parity manifest before implementing routes.
3. Add typed proxy routes for all feasible HTTP endpoints needed for full in-site parity, prioritizing snapshot/stats/peers/routes/coverage/LOS/weather.
4. Evaluate WebSocket feasibility in Next.js self-hosted runtime. If practical, add a constrained route/proxy or client connection pattern that still keeps credentials server-side; if not practical, expose a documented polling/SSE fallback and mark the WebSocket item as deferred with rationale.
5. Add an optional disabled-by-default Compose profile for running the upstream live-map service sidecar locally/operationally, wiring the Next app to `MESHCORE_LIVE_MAP_API_URL` without publishing anything.
6. Add tests using upstream-like fixtures for auth headers, endpoint mapping, error redaction, timeout behavior, and unavailable-upstream degradation.
7. Update `.env.example` with sidecar variables, token behavior, endpoint availability, and explicit raw-MQTT-vs-live-map-service language.
**Contracts and interfaces:**
- Server-side proxy routes never expose upstream tokens.
- Proxy routes return `ApiResponse<T>` with redacted errors.
- Sidecar profile is opt-in and does not run by default in `docker compose up` unless the profile is selected.
- The Next site remains the web app; upstream live-map remains the stateful decoder/runtime.
**State/data changes:** No site-owned persistence; upstream live-map owns its own `/data` if sidecar profile is used.
**Edge cases:**
- Upstream live-map unavailable should degrade to clear API/UI errors, not crash the site.
- Weather/coverage/LOS endpoints may depend on upstream optional config; proxy must report unsupported states clearly.
- WebSocket proxying may be infeasible in the current Next route runtime; do not fake parity if runtime cannot support it safely.
**Acceptance criteria:**
- Feasible advanced live-map endpoints are proxied server-side with bearer auth.
- Infeasible endpoints are explicitly recorded in the parity manifest with implementation rationale.
- Compose supports an opt-in live-map sidecar profile for local/ops parity.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
- `docker compose config`
**Manual validation:** With no live-map service configured, proxy routes return safe unavailable responses. If a local sidecar can be started, verify selected proxy routes against it without publishing or pushing anything.
**Risks:**
- Attempting to proxy every upstream endpoint can expand security and runtime scope too far. Research refs: ITEM-pitfalls-4, ITEM-prior-art-8.
- WebSocket support may not fit the Next route runtime. Research refs: ITEM-architecture-7.
- Sidecar topology can accidentally require secrets in the site container if env docs are unclear. Research refs: ITEM-architecture-10.
**Out of scope for this step:** Visual map UI implementation, raw MQTT packet decoding in Next.js, public contacts export, and production deployment.

### Step 4: Full in-site live-map UI/UX parity through Opus UI delegation
**Goal:** Implement the user-facing map experience for practical full in-site live-map parity using the contracts from Steps 2-3, while respecting the Codex session’s UI implementation restriction.
**Why now:** The API and runtime contracts must exist before Opus can safely build UI against stable data without changing backend semantics.
**Dependencies:** Steps 2-3; Opus UI delegation via `co-ui` or `/opus-ui` from the current working directory.
**Files:**
- Modify `src/app/map/page.tsx`
- Modify `src/components/NetworkMap.tsx`
- Modify `src/components/NetworkMapWrapper.tsx`
- Modify/add `src/components/map/*` components for overlays, layers, node details, route/peer/coverage/LOS/weather panels, share/deep-link state, source diagnostics, and warnings
- Modify `src/app/globals.css` only through Opus UI delegation if visual changes are required
- Modify `src/hooks/useMapSnapshot.ts` and add hooks for proxied live-map data if needed
- Modify Playwright tests under `tests/e2e/`
**Existing code to inspect first:**
- `src/app/map/page.tsx`
- `src/components/NetworkMap.tsx`
- `src/components/map/MapControls.tsx`
- `src/components/map/MapLegend.tsx`
- `src/components/map/MapStatsOverlay.tsx`
- `src/components/map/NodePopup.tsx`
- `src/components/map/markers.ts`
- `src/hooks/useMapSnapshot.ts`
- `/tmp/meshcore-mqtt-live-map/backend/static/app.js`
- `/tmp/meshcore-mqtt-live-map/backend/static/index.html`
- `/tmp/meshcore-mqtt-live-map/backend/static/styles.css`
**Implementation plan:**
1. Create a concise Opus UI handoff prompt that lists the exact contracts from Steps 2-3, upstream UI behaviors to port, files to modify, and the rule that Opus should not alter server/API semantics.
2. Run `co-ui` from the repo root for visual/frontend implementation of the map UI parity work.
3. Ensure Opus implements source diagnostics, production sample warnings, runtime tile config, node popups, search/filter controls, route/peer overlays where data exists, coverage/LOS/weather affordances where proxied endpoints exist, share/deep-link state if practical, and empty/error/loading states.
4. Review Opus changes in this session for non-visual correctness: import boundaries, SSR safety, API route usage, no credential exposure, and testability.
5. Add or update Playwright smoke tests to cover `/map` load, source warning visibility under mocked sample mode, marker rendering with mocked snapshot, advanced panel fallback states, and keyboard/a11y basics.
6. Run browser validation manually in the dev server and monitor console/network requests for old endpoint usage or hydration errors.
**Contracts and interfaces:**
- Map UI fetches `/api/map/snapshot`, `/api/map/runtime`, and scoped `/api/live-map/*` routes only; it must not fetch upstream service URLs directly from the browser when tokens are required.
- Leaflet remains browser-only and must not be imported into server components.
- Visual implementation is delegated to Opus; this session reviews and tests integration.
**State/data changes:** Client UI state only.
**Edge cases:**
- No live-map service configured should show a clear disabled/unavailable operator-feature state.
- Sample data in production should be visually obvious.
- Invalid coordinates and missing upstream optional endpoints must not break the map.
- Mobile controls, keyboard navigation, contrast, and screen-reader labels must pass axe checks.
**Acceptance criteria:**
- `/map` provides a fuller in-site live-map experience using the new server-side contracts.
- No map UI exposes credentials or fetches protected upstream endpoints directly.
- Browser smoke tests and manual browser checks pass.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`
**Manual validation:** Start the dev server; inspect `/map` desktop/mobile, filters, popups, source diagnostics, advanced panels, empty/error/sample states, console, and network requests.
**Risks:**
- Full UI parity can become a large visual implementation; Opus must keep the step scoped to existing contracts. Research refs: ITEM-architecture-6, ITEM-architecture-7.
- Leaflet hydration/runtime errors can pass TypeScript but fail in browser. Research refs: ITEM-architecture-6.
- Upstream features without backend data can become fake UI; hide or mark unavailable instead. Research refs: ITEM-pitfalls-4.
**Out of scope for this step:** Contacts export, raw MQTT decoder implementation, and hardware validation.

### Step 5: Utility data model and generated repeater/companion settings JSON
**Goal:** Promote utility/repeater settings into typed data modules and add downloadable MeshCore settings JSON for both repeater and companion tools.
**Why now:** This is the highest-value upstream utility parity gap and provides the data foundation for serial apply-settings and PrefixMatrix checks.
**Dependencies:** Step 1 validation foundation and the user decision allowing direct adaptation from the utilities repo.
**Files:**
- Add `src/lib/meshcore-data/settings.ts`
- Add `src/lib/meshcore-data/regions.ts`
- Add `src/lib/meshcore-data/node-types.ts`
- Add `src/lib/meshcore-data/fixtures/` or equivalent for adapted upstream JSON
- Add `src/lib/meshcore-tools/naming.ts`
- Add `src/lib/meshcore-tools/config-export.ts`
- Modify `src/components/NamingWizard.tsx`
- Modify `src/components/CompanionNamer.tsx`
- Modify `src/app/tools/repeater-name/page.tsx`
- Modify `src/app/tools/companion-name/page.tsx`
- Modify `src/app/guides/radio-settings/page.tsx` if settings copy must reference canonical data
- Modify `src/lib/parity/manifest.ts`
- Add tests under `src/lib/meshcore-tools/__tests__/`
**Existing code to inspect first:**
- `src/components/NamingWizard.tsx`
- `src/components/CompanionNamer.tsx`
- `src/lib/data/airports.ts`
- `src/lib/data/cities.ts`
- `src/lib/data/landmarks.ts`
- `src/lib/tools/serial-commands.ts`
- `src/app/guides/radio-settings/page.tsx`
- `/tmp/meshcore-utilities-site/backend/api/routes/repeater_name_tool/index.py`
- `/tmp/meshcore-utilities-site/backend/api/routes/companion_name_tool/index.py`
- `/tmp/meshcore-utilities-site/backend/constants.py`
- `/tmp/meshcore-utilities-site/static/data/recommended_settings.json`
- `/tmp/meshcore-utilities-site/static/data/regions.json`
**Implementation plan:**
1. Extract current naming and companion logic into pure functions so UI components become consumers rather than owners of domain rules.
2. Import/adapt upstream recommended settings and region data into typed modules with validation and provenance metadata.
3. Implement repeater settings JSON generation using generated name, region/home/all region behavior, node type, ownership hints, radio defaults, and file naming compatible with upstream expectations.
4. Implement companion settings JSON generation using companion name, emoji/handle/suffix strategy, safe defaults, and file naming compatible with upstream expectations where available.
5. Update `NamingWizard` and `CompanionNamer` to surface generated JSON preview/download buttons without broad visual redesign; if visual layout requires significant aesthetic work, delegate that portion to Opus UI.
6. Add unit tests for valid/invalid names, 23-character limits, settings JSON shape, file names, upstream fixture parity, and guide/settings consistency.
7. Update the parity manifest to mark repeater and companion config export items with local file/test refs.
**Contracts and interfaces:**
- Pure config export functions accept typed input objects and return `{ fileName, settingsJson, warnings }` or equivalent.
- UI download uses a browser Blob generated from pure function output.
- Generated JSON must be deterministic for the same input.
**State/data changes:** Static data modules and browser downloads only.
**Edge cases:**
- Do not silently generate settings when required naming fields are invalid.
- Preserve the 23-character MeshCore name limit.
- Ensure generated JSON does not include private keys unless the user explicitly provides/imports them in a future flow.
- JSON download filenames must be safe and predictable.
**Acceptance criteria:**
- Repeater and companion tools can generate downloadable settings JSON.
- Pure functions are unit-tested and parity manifest records coverage.
- Existing naming workflows still work.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
**Manual validation:** Run the app; generate valid repeater and companion names, download JSON files, inspect content, and verify invalid inputs block generation with clear messages.
**Risks:**
- Copying upstream behavior without a typed model can produce drift and invalid field names. Research refs: ITEM-pitfalls-1, ITEM-pitfalls-2.
- Companion export behavior may be less explicit upstream than repeater export; tests and warnings must document assumptions. Research refs: ITEM-prior-art-2, ITEM-prior-art-3.
**Out of scope for this step:** Serial application of settings JSON and PrefixMatrix 4-character redesign.

### Step 6: Full 4-character PrefixMatrix parity and reserved/collision logic
**Goal:** Replace the current 2-character prefix-byte grid with upstream-style 4-character planning, reserved IDs, collision severity, and better integration with live map snapshot data.
**Why now:** Repeater/companion config generation requires a reliable 4-character public-key prefix planning tool to avoid collisions.
**Dependencies:** Steps 2 and 5; current map snapshot data and pure utility modules.
**Files:**
- Modify `src/components/PrefixMatrix.tsx`
- Add `src/lib/meshcore-tools/prefixes.ts`
- Modify `src/app/tools/prefix-matrix/page.tsx`
- Modify `src/components/NamingWizard.tsx` conflict checking to use 4-character logic
- Modify `src/lib/parity/manifest.ts`
- Add tests under `src/lib/meshcore-tools/__tests__/prefixes.test.ts`
- Modify Playwright smoke tests for prefix page
**Existing code to inspect first:**
- `src/components/PrefixMatrix.tsx`
- `src/components/NamingWizard.tsx` pubkey conflict logic
- `src/hooks/useMapSnapshot.ts` after Step 2
- `/tmp/meshcore-utilities-site/static/js/prefix_matrix.js`
- `/tmp/meshcore-utilities-site/templates/prefix_matrix.html`
- `/tmp/meshcore-utilities-site/static/css/prefix_matrix.css`
**Implementation plan:**
1. Extract prefix analysis into pure functions that accept map nodes and reserved-prefix definitions and return 4-character occupancy, 2-character rollups, collision severity, free suggestions, and search results.
2. Adapt upstream reserved/collision rules and ensure they are represented in typed data rather than hard-coded only in UI.
3. Update `PrefixMatrix` to present the 4-character planning model while preserving usability on desktop/mobile; delegate any significant visual layout changes to Opus UI if needed.
4. Update `NamingWizard` to check the full 4-character prefix instead of only the first byte, while still explaining broader prefix-byte crowding if useful.
5. Add deterministic suggestion behavior for free prefixes where possible; avoid random suggestions that can be hard to test unless seeded or isolated.
6. Add unit tests for collisions, reserved IDs, full-prefix uniqueness, rollups, suggestions, invalid/missing public keys, and sample/live snapshot inputs.
7. Add Playwright smoke coverage for prefix search, selecting a free prefix, and seeing collision/reserved warnings.
**Contracts and interfaces:**
- Prefix logic is pure and exports typed analysis results.
- UI consumes `/api/map/snapshot` or a shared snapshot hook, not `/api/map/nodes` directly.
- Reserved IDs and severity labels are stable enough for tests and parity manifest references.
**State/data changes:** None beyond static reserved-prefix data if needed.
**Edge cases:**
- Nodes with missing/short/malformed public keys should not crash analysis.
- Exact 4-character collision differs from 2-character crowding; UI must not conflate them.
- Large node lists must not make the grid unusably slow.
**Acceptance criteria:**
- PrefixMatrix supports 4-character planning, reserved IDs, collision severity, and meaningful suggestions.
- Naming conflict warnings use the same shared prefix analysis.
- Unit and Playwright tests cover key flows.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`
**Manual validation:** Run `/tools/prefix-matrix` and repeater naming; test occupied, free, malformed, and reserved prefix scenarios with sample/mock data.
**Risks:**
- A 65,536-cell mental model can overwhelm users if the UI simply expands the old grid. Research refs: ITEM-prior-art-4.
- Random suggestions can make tests flaky. Research refs: ITEM-architecture-8.
**Out of scope for this step:** Vanity key generation and contacts export.

### Step 7: Guarded serial settings JSON application and Nominatim proxy
**Goal:** Close the config-to-device loop with a guarded settings JSON apply flow and move location lookup behind a policy-compliant server proxy.
**Why now:** Settings JSON export exists after Step 5, and the current client-side Nominatim fetch has policy and header limitations.
**Dependencies:** Steps 1 and 5; existing Web Serial tool.
**Files:**
- Modify `src/components/tools/SerialUsbTool.tsx`
- Modify `src/lib/tools/serial-commands.ts`
- Add `src/lib/meshcore-tools/serial-settings.ts`
- Add `src/app/api/geocode/route.ts`
- Modify `src/components/NamingWizard.tsx` to call the proxy route
- Modify `src/lib/rate-limit.ts` if needed
- Modify `src/lib/parity/manifest.ts`
- Add unit tests under `src/lib/meshcore-tools/__tests__/serial-settings.test.ts`
- Add route tests or mocked fetch tests for geocoding behavior if feasible
- Update Playwright smoke tests for serial unsupported state and JSON import UI
**Existing code to inspect first:**
- `src/components/tools/SerialUsbTool.tsx`
- `src/lib/tools/serial-commands.ts`
- `src/components/NamingWizard.tsx` current Nominatim fetch
- `src/lib/rate-limit.ts`
- `/tmp/meshcore-utilities-site/static/data/default_serial_commands.json`
- `/tmp/meshcore-utilities-site/serial_commands.schema.json`
- `/tmp/meshcore-utilities-site/static/js/serial_usb_tool_page.js`
**Implementation plan:**
1. Implement a pure conversion module that validates generated/imported settings JSON and turns supported fields into a safe ordered serial command plan with warnings.
2. Add an upload/paste settings JSON flow to `SerialUsbTool` with preview, explicit confirmation for state-changing commands, and a dry-run command list before anything is sent.
3. Preserve existing destructive command confirmations and add tests to ensure `erase`, `reboot`, GPS/power/region/config writes, and settings-apply actions remain guarded.
4. Add an API route for Nominatim geocoding with app identification headers, app-wide rate limiting/caching, country/limit constraints, and no autocomplete behavior.
5. Update `NamingWizard` to call `/api/geocode` instead of Nominatim directly, and update copy/attribution accordingly.
6. Add unit tests for settings-to-command conversion, malformed JSON, unsupported fields, confirmation metadata, and geocode input validation.
7. Add Playwright smoke tests for serial unsupported-browser messaging and JSON apply preview without requiring hardware.
**Contracts and interfaces:**
- Serial settings converter returns a typed command plan and never writes to hardware directly.
- UI sends serial commands only after user activation, device connection, preview, and confirmation.
- `GET /api/geocode?q=...` or equivalent returns normalized geocode results and nearest airport info without storing user input.
**State/data changes:** In-memory rate-limit/cache only unless existing utilities support a simple cache; no database.
**Edge cases:**
- Web Serial unavailable/insecure contexts must still show a useful non-error state.
- Uploaded JSON may be malformed, from another firmware version, or include unsupported/private fields.
- Nominatim route must reject empty, too-long, or high-rate input and must not implement autocomplete/typeahead.
**Acceptance criteria:**
- Serial USB tool can preview and guarded-apply generated/imported settings JSON commands.
- Nominatim calls go through the server route, not directly from the browser.
- Safety/unit/browser smoke tests pass.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`
**Manual validation:** Run `/tools/serial-usb` in a browser without hardware to validate unsupported/secure-context states and JSON preview. Run the naming wizard geocode lookup and verify proxy response/attribution. If no serial hardware is available, explicitly record hardware validation as not performed.
**Risks:**
- Serial command application can misconfigure devices if warnings or confirmations are weakened. Research refs: ITEM-pitfalls-9.
- Nominatim public API policy can be violated by autocomplete or missing identification/rate limiting. Research refs: ITEM-pitfalls-8.
**Out of scope for this step:** Hardware-required end-to-end serial validation unless a compatible device is available.

### Step 8: Pragmatic blocking CI hardening and Docker runtime smoke
**Goal:** Enforce the new test, accessibility, Lighthouse, build, and Docker runtime checks in CI while keeping normal PRs near the user’s target budget.
**Why now:** Feature parity and tests are in place, so CI can now guard them and catch regressions.
**Dependencies:** Steps 1-7.
**Files:**
- Modify `.github/workflows/ci.yml`
- Modify `.github/workflows/security.yml` if dependency review/CodeQL scheduling changes are needed
- Modify `.github/workflows/docker-release.yml` only if release workflow needs to reuse smoke/build logic safely
- Add scripts under `scripts/` if a Docker smoke helper is clearer than inline YAML
- Modify `package.json`
- Modify `package-lock.json` only if needed for CI tools
- Modify `compose.yaml` if healthcheck/source assertions need env support
- Modify `src/lib/parity/manifest.ts` with CI coverage refs
**Existing code to inspect first:**
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/docker-release.yml`
- `Dockerfile`
- `compose.yaml`
- `package.json` scripts after Step 1
- Lighthouse/Playwright config from Step 1
**Implementation plan:**
1. Update PR CI to run install, lint, typecheck, unit tests, Chromium Playwright smoke tests, blocking axe checks, blocking Lighthouse CI, production build, and Docker build/run smoke in a clear job structure.
2. Add Docker runtime smoke that builds the image, runs it with explicit demo/sample or live-map mock env, curls `/`, `/api/map/snapshot`, `/api/map/runtime`, and asserts source/warning behavior under controlled env.
3. Use GitHub Actions caching for npm, Playwright browsers where safe, Docker Buildx cache, and parallel jobs to stay near the ~10-minute budget.
4. Add dependency review on PRs and keep security scans/audit meaningful without causing unnecessary noise; CodeQL can remain separate/scheduled if runtime budget demands.
5. Ensure Docker release workflow still only pushes on release/tag/manual events and no new CI job publishes images.
6. Add CI comments/env docs for Lighthouse budgets and axe blocking behavior.
7. Run local equivalents where possible and inspect workflow YAML for syntax/errors.
**Contracts and interfaces:**
- Normal PR CI must not push images, create releases, or contact shared services.
- Blocking checks include axe and Lighthouse per user decision.
- Docker smoke asserts operability, not just buildability.
**State/data changes:** CI workflow and scripts only.
**Edge cases:**
- Lighthouse can be flaky in shared CI; use local server, stable route set, and realistic budgets.
- Playwright install/cache can dominate runtime; keep PR scope Chromium-only unless performance allows more.
- Docker smoke must clean up containers even on failure.
**Acceptance criteria:**
- CI includes the agreed checks and remains structured for maintainability.
- Docker smoke runs a container and validates key routes/source behavior.
- No workflow pushes or publishes external artifacts during PR checks.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run test:lighthouse`
- `npm run build`
- `docker build -t colorado-meshcore-site:ci-smoke .`
- Docker run/curl smoke helper if added
**Manual validation:** Inspect workflow YAML triggers, permissions, cache usage, push behavior, and expected runtime budget.
**Risks:**
- Blocking Lighthouse immediately can create noisy failures. User explicitly chose both Lighthouse and axe as blocking, so set sane but real budgets and stabilize the environment. Research refs: ITEM-stack-10, ITEM-architecture-9.
- Docker build-only checks provide false confidence; run-smoke must be included. Research refs: ITEM-pitfalls-12.
**Out of scope for this step:** Publishing GHCR images or creating releases.

### Step 9: Final parity audit, browser/UI validation, and maintainer report
**Goal:** Validate the complete pass against upstream parity, UI/UX behavior, CI gates, Docker runtime, and final Forge review requirements.
**Why now:** Cross-step regressions can appear only after map, tools, serial, runtime config, Opus UI, and CI are assembled.
**Dependencies:** Steps 1-8.
**Files:**
- Modify `src/lib/parity/manifest.ts` if final audit discovers inaccurate statuses
- Add or update generated maintainer parity report file only if the implementation chose to check one into the repo; otherwise keep report generation as a test/script artifact
- Modify any source files needed to fix validation defects, after updating `.forge/steps/step-9-plan.md`
- Save review artifacts under `.forge/reviews/`
**Existing code to inspect first:**
- `git diff $(cat .forge/.base-ref)...HEAD`
- `src/lib/parity/manifest.ts`
- `src/app/map/page.tsx`
- `src/app/tools/*`
- `src/components/NetworkMap.tsx`
- `src/components/NamingWizard.tsx`
- `src/components/CompanionNamer.tsx`
- `src/components/PrefixMatrix.tsx`
- `src/components/tools/SerialUsbTool.tsx`
- `.github/workflows/ci.yml`
- `Dockerfile` and `compose.yaml`
**Implementation plan:**
1. Run the full automated suite: lint, typecheck, unit tests, Playwright/axe smoke, Lighthouse, Next build, Docker build, Docker run smoke, and Compose config.
2. Run parity manifest/report generation and confirm all implemented/deferred statuses match user decisions, especially no public contacts export and all feasible live-map feature proxying.
3. Start the dev server and browser-validate homepage, `/map`, `/tools`, repeater naming, companion naming, PrefixMatrix, serial USB, guides, blog, about, responsive nav, console, and network requests.
4. Start the Docker runtime and repeat critical golden paths, including `/api/map/snapshot`, `/api/map/runtime`, source warning behavior, settings JSON downloads, and map page loading.
5. If Opus UI changed visual/frontend files, verify with browser screenshots/console/network and ensure no SSR/hydration or accessibility regressions.
6. Run grep guards for stale Denver branding, old APIs, public contacts route, exposed live-map tokens, direct Nominatim browser fetches, and unintended `.forge.bak` inclusion.
7. Fix only validation defects discovered in this step; if fixes require new product scope, update `.forge/PLAN.md` and ask the user before proceeding.
8. Prepare final verification notes for Forge final review.
**Contracts and interfaces:**
- Maintainer parity status remains internal/repo-only, not public UI.
- Contacts export remains absent.
- Browser map/tool flows use local server APIs, not protected upstream URLs directly.
- Docker image does not include `.forge.bak.*` artifacts.
**State/data changes:** Validation fixes only.
**Edge cases:**
- Web Serial hardware validation may not be possible; report that explicitly if no device/browser access is available.
- Live-map sidecar validation may require local service credentials; if unavailable, validate mocked/unavailable behavior and route contracts.
- Lighthouse/axe failures may require Opus UI follow-up if visual accessibility issues are found.
**Acceptance criteria:**
- Automated checks pass.
- Browser golden paths pass in dev and Docker runtime.
- Parity manifest accurately reflects implemented and deferred items.
- No protected secrets appear in browser/network responses.
- Final Forge reviewer approves the complete diff.
**Verification commands:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run test:a11y`
- `npm run test:lighthouse`
- `npm run build`
- `docker build -t colorado-meshcore-site:final .`
- `docker compose config`
- Docker run/curl smoke helper if added
- `grep -R "nominatim.openstreetmap.org\|MESHCORE_LIVE_MAP_API_TOKEN\|/contacts\|/api/nodes\|/api/stats\|/api/health" -n src content public .github Dockerfile compose.yaml package.json || true`
**Manual validation:** Dev-server and Docker browser validation for map, tools, settings JSON downloads, PrefixMatrix, serial unsupported/preview state, guides/blog/about, mobile nav, console, and network.
**Risks:**
- Per-step reviews may miss cross-step integration and runtime issues. Research refs: Forge review caveat, ITEM-pitfalls-12.
- Browser-only map/serial UI can pass build but fail at runtime. Research refs: ITEM-architecture-6, ITEM-pitfalls-9.
**Out of scope for this step:** New features beyond validation fixes, publishing releases/images, public contacts export, and hidden redirects for old removed routes.

## Cross-Step Integration Checks
- Upstream parity: parity manifest must identify implemented, deferred, and out-of-scope items for utilities, repeater configs, serial, PrefixMatrix, live-map API/UI, Docker, and CI.
- Live-map topology: production path should be Next site -> server-side APIs -> `meshcore-mqtt-live-map`; direct MQTT in Next remains a decoded-JSON fallback only.
- Credentials: `MESHCORE_LIVE_MAP_API_TOKEN`, MQTT credentials, and any upstream tokens must never appear in browser bundles, client runtime config, logs, or API responses.
- Map source truthfulness: sample/demo map data must be clearly marked and guarded in production/CI.
- Runtime config: tile URL/attribution and public map settings that operators expect to change post-build should come from a server endpoint, not frozen `NEXT_PUBLIC_*` values.
- Tool parity: repeater and companion settings JSON downloads must match tested typed contracts; PrefixMatrix must use 4-character logic; serial apply flow must preserve confirmations.
- Nominatim: browser code must not fetch public Nominatim directly; lookup must be user-triggered through the server proxy with attribution/rate limiting.
- Contacts: no public `/contacts` export should be added.
- UI delegation: any visual/aesthetic frontend work must be performed by Opus UI delegation, then reviewed and tested here.
- CI: PR workflow must remain non-publishing and include lint, typecheck, unit tests, browser/accessibility/performance smoke, build, and Docker runtime smoke.
- Docker: image must exclude `.forge.bak.*`, `.forge/`, local env files, reports, and test artifacts unless intentionally needed.

## Testing Strategy
- Unit/contract tests with Vitest for map env parsing, live-map normalization/auth, parity manifest, settings JSON generation, PrefixMatrix analysis, serial settings conversion, and safety metadata.
- Playwright Chromium smoke tests for critical pages and browser-only flows: map, tools hub, repeater/companion JSON download, PrefixMatrix, serial unsupported/preview states, and navigation.
- Blocking axe checks for critical pages and flows.
- Blocking Lighthouse CI with stable local-server budgets.
- Next build and TypeScript checks for production correctness.
- Docker build plus Docker run/curl smoke for runtime operability, source warning behavior, and key API routes.
- Manual browser validation for dev and Docker runtime, including console/network checks and mobile navigation.
- Forge review gates: stage each step’s specific files, run `forge-reviewer`, save JSON review artifacts, fix required changes, and commit per approved step.

## Out of Scope
- Public contacts export.
- Publishing GitHub releases, pushing GHCR images, or touching shared production services without explicit user approval.
- Making the Next app the authoritative raw MeshCore MQTT packet decoder.
- Adding a site-owned persistent database.
- Public parity/status UI; parity report is for maintainers/CI first.
- Hardware-required serial validation if no compatible device/browser is available.
- Unbounded live-map rewrites beyond feasible server-side proxy contracts and Opus-delegated UI work.

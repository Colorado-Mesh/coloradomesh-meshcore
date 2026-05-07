# Research Synthesis

## Status
- Files synthesized: stack.md, pitfalls.md, architecture.md, prior-art.md, codex-analysis.md, PROJECT.md
- Files missing: none
- Overall confidence: HIGH

## Executive Summary
This is a brownfield hardening and max-parity pass on an existing Next.js Colorado MeshCore site. The proven way to build it is not to port the Flask utilities site or the full FastAPI live-map app wholesale, but to keep the current Next.js site as the public web surface, extract domain behavior into typed data/logic modules, add fixture/schema parity checks against upstream behavior, and consume specialized upstream systems through stable API boundaries.

The recommended approach is to keep Next.js 16, React 19, TypeScript, Node 24, Docker standalone output, Leaflet/React Leaflet, and no application database. Add Zod for runtime env/live-map/API validation, AJV or equivalent schema checks for serial-command fixtures, Vitest/React Testing Library for fast logic/component tests, Playwright smoke tests for browser-only flows, and stronger CI/security gates. Treat `yellowcooln/meshcore-mqtt-live-map` as the canonical MeshCore MQTT decoder/state runtime and consume `/api/nodes?mode=full` server-side; direct MQTT in this repo should remain a JSON-compatible fallback only.

Top risks are false parity, raw MQTT misconfiguration, token leakage through query strings/caches/logs, unlicensed copying from the utilities repo, sample data creating production false confidence, and Docker/runtime env behavior being misunderstood. Mitigate these by creating a versioned parity manifest, validated in-repo data fixtures, a single map snapshot endpoint, explicit live-map runtime topology docs, bearer-token server fetches, production source-mode guards, and provenance/license tracking. Prior art strongly supports leveraging the upstream utilities site as a feature checklist and `meshcore-mqtt-live-map` as a separate operator-grade live-map service rather than rebuilding either system inside this site.

## Key Decisions (resolved by research)
- Keep the current stack: Next.js 16.2.x, React 19.2.x, TypeScript 5.x, npm lockfile, and Node 24 across local, CI, and Docker. Refs: ITEM-stack-1.
- Do not add a site-owned database for this pass; keep static/parity data in repo and live state in `meshcore-mqtt-live-map`. Refs: ITEM-stack-2, ITEM-architecture-10.
- Use `meshcore-mqtt-live-map` as the authoritative MQTT decoder/runtime and consume its `/api/nodes?mode=full` API server-side. Refs: ITEM-stack-3, ITEM-architecture-4, ITEM-prior-art-7.
- Keep direct MQTT support only as a decoded-JSON fallback, not a raw MeshCore packet decoder. Refs: ITEM-pitfalls-3, ITEM-pitfalls-11.
- Keep Leaflet 1.9.4 and React Leaflet 5; do not migrate to Mapbox/MapLibre or Leaflet 2 for this pass. Refs: ITEM-stack-4.
- Add runtime/schema validation boundaries with Zod for env/API/live-map payloads and AJV or equivalent for serial-command upstream schema parity. Refs: ITEM-stack-5, ITEM-stack-6, ITEM-architecture-2.
- Split utility business logic into pure modules and keep browser-only capabilities isolated at the edge. Refs: ITEM-architecture-3, ITEM-architecture-6.
- Add a single `/api/map/snapshot` contract and make nodes/stats compatibility endpoints wrappers over it. Refs: ITEM-architecture-5, ITEM-pitfalls-6.
- Implement parity as a machine-readable manifest and generated report, not an ad-hoc markdown-only visual audit. Refs: ITEM-architecture-1.
- Harden CI pragmatically with fast PR gates: lint, typegen/typecheck, unit tests, Playwright smoke, production build, Docker build/run smoke, dependency review, and scheduled/release security checks. Refs: ITEM-stack-12, ITEM-architecture-8, ITEM-architecture-9, ITEM-pitfalls-12.
- Preserve visual implementation delegation to Opus UI; this planning pass should define non-visual contracts, data DTOs, tests, and API wiring. Refs: PROJECT.md, ITEM-architecture-6.

## Questions for User

### Q-1: Should repeater and companion tools generate downloadable MeshCore settings JSON in this pass, or should companion export be deferred?

- **Category:** scope
- **Why it matters:** This determines whether parity work stops at naming helpers or becomes an end-to-end configure-and-apply workflow with generated config files and serial application support.
- **Default recommendation:** Implement repeater settings JSON download now; implement companion settings export only if it is quick after the shared data model exists.
- **Source refs:** ITEM-pitfalls-1, ITEM-prior-art-2, ITEM-prior-art-3, ITEM-architecture-2
- **Priority:** HIGH

### Q-2: Can we obtain or confirm an explicit license/permission for copying data or code from `Colorado-Mesh/meshcore-utilities-site`?

- **Category:** prior-art
- **Why it matters:** The utilities repo has no advertised license metadata; substantial copying of code, templates, or static datasets is legally different from reimplementing behavior from observed requirements.
- **Default recommendation:** Do not copy substantial implementation code until permission/license is clarified; reimplement behavior with attribution and small audited fixtures where necessary.
- **Source refs:** ITEM-pitfalls-10, ITEM-prior-art-1, ITEM-prior-art-12
- **Priority:** HIGH

### Q-3: Is the current Next.js map intended to remain a site-integrated node summary, or should users receive a full operator-grade live-map experience?

- **Category:** scope
- **Why it matters:** Full live-map parity includes routes, peers, LOS, coverage, weather, WebSockets, history, and state semantics that are a separate application scope.
- **Default recommendation:** Keep the Next.js map as a polished node-summary consumer and add a prominent link/sidecar path to the full upstream live-map for operator features.
- **Source refs:** ITEM-architecture-7, ITEM-pitfalls-4, ITEM-prior-art-8, ITEM-prior-art-9
- **Priority:** HIGH

### Q-4: Will production deploy `meshcore-mqtt-live-map` as a separate service, and what URL/token should the site use?

- **Category:** constraints
- **Why it matters:** Live data parity depends on running the upstream decoder/state service; raw MQTT directly in Next.js cannot decode MeshCore packets and is risky in multi-instance/serverless deployments.
- **Default recommendation:** Document and support a sidecar/service topology: Next site -> `/api/map/snapshot` -> live-map `/api/nodes?mode=full`, with the token held server-side.
- **Source refs:** ITEM-stack-3, ITEM-architecture-4, ITEM-architecture-10, ITEM-pitfalls-3, ITEM-pitfalls-11, ITEM-prior-art-10
- **Priority:** HIGH

### Q-5: Should protected live-map API access use bearer tokens instead of query-string tokens, even if upstream supports both?

- **Category:** risk
- **Why it matters:** Query-string tokens can appear in reverse-proxy logs, upstream logs, traces, and cache keys; bearer auth reduces accidental exposure.
- **Default recommendation:** Prefer `Authorization: Bearer` for server-side fetches, avoid logging full upstream URLs, and keep local cache TTL/source exposure explicit.
- **Source refs:** ITEM-pitfalls-5, ITEM-prior-art-8, ITEM-architecture-4
- **Priority:** HIGH

### Q-6: Should production fail/warn when no live source is configured and only sample data would be displayed?

- **Category:** risk
- **Why it matters:** Plausible sample Colorado nodes can make an unconfigured production deployment appear real and can let health checks pass without live data.
- **Default recommendation:** Keep sample data for local demos, but add a production warning or smoke-test failure unless sample mode is explicitly enabled.
- **Source refs:** ITEM-pitfalls-7, ITEM-pitfalls-12
- **Priority:** HIGH

### Q-7: How much PrefixMatrix parity is required: current 2-character view, upstream-style 4-character planning, reserved IDs, or full collision detail?

- **Category:** scope
- **Why it matters:** The upstream utility’s 4-character and reserved-ID model directly prevents repeater public-key prefix collisions; it requires new data contracts and tests.
- **Default recommendation:** Port the 4-character planning model, reserved-ID handling, and collision severity logic using local typed data and `/api/map/snapshot` nodes.
- **Source refs:** ITEM-prior-art-4, ITEM-architecture-2, ITEM-pitfalls-2
- **Priority:** HIGH

### Q-8: Should the serial USB tool support uploading generated settings JSON and converting it into an apply-settings command sequence?

- **Category:** scope
- **Why it matters:** This closes the loop between generating repeater config JSON and actually applying it to hardware, but it increases destructive-command safety requirements.
- **Default recommendation:** Add the typed conversion flow after config generation exists, preserve confirmations for destructive/state-changing commands, and validate profiles in CI.
- **Source refs:** ITEM-prior-art-5, ITEM-stack-6, ITEM-stack-7, ITEM-pitfalls-9
- **Priority:** HIGH

### Q-9: Should a public contacts export endpoint be restored or left out?

- **Category:** scope
- **Why it matters:** The utilities site exposes `/contacts`, but the current repo removed broad legacy APIs; public contacts may have privacy and data-owner implications.
- **Default recommendation:** Leave contacts export out unless explicitly approved; if approved, make it documented, rate-limited, privacy-reviewed, and source-of-truth-aligned.
- **Source refs:** ITEM-prior-art-6, ITEM-pitfalls-10
- **Priority:** MEDIUM

### Q-10: Is a server-side geocoding proxy acceptable for Nominatim lookups, or should location lookup stay client-triggered only?

- **Category:** technical
- **Why it matters:** Client-side Nominatim calls cannot set a true User-Agent and typeahead/autocomplete would violate public API policy under real traffic.
- **Default recommendation:** Add a server route with app-wide rate limiting, attribution, identifying headers/contact, and caching; do not add autocomplete against public Nominatim.
- **Source refs:** ITEM-pitfalls-8, ITEM-stack-5
- **Priority:** MEDIUM

### Q-11: Which live-map advanced features, if any, should be proxied into this site after `/api/nodes` stabilization?

- **Category:** technical
- **Why it matters:** Proxying `/snapshot`, `/stats`, `/peers`, `/coverage`, `/los`, or `/ws` expands threat model, token handling, cache policy, UI scope, and testing requirements.
- **Default recommendation:** Stabilize `/api/nodes` normalization and source diagnostics first; defer broad protected endpoint proxying unless a specific user-facing feature is approved.
- **Source refs:** ITEM-prior-art-8, ITEM-architecture-7, ITEM-pitfalls-4
- **Priority:** MEDIUM

### Q-12: Should map tile URL/attribution be runtime configurable after image build, or is build-time `NEXT_PUBLIC_*` configuration acceptable?

- **Category:** constraints
- **Why it matters:** Next.js inlines `NEXT_PUBLIC_*` variables at build time, which can surprise Docker operators expecting runtime changes to tile providers or public URLs.
- **Default recommendation:** For values that must move at runtime, serve client runtime config through a server endpoint; otherwise document build-time-only variables clearly.
- **Source refs:** ITEM-stack-4, ITEM-pitfalls-13
- **Priority:** MEDIUM

### Q-13: What CI runtime budget is acceptable for normal PRs?

- **Category:** constraints
- **Why it matters:** Vitest, Playwright Chromium smoke, Docker build/run smoke, dependency review, CodeQL, Lighthouse, and accessibility checks have different speed/noise profiles.
- **Default recommendation:** Put lint, typegen/typecheck, Vitest, Chromium-only Playwright smoke, build, and Docker smoke in PR CI; run CodeQL/dependency review in PR/scheduled as appropriate and Lighthouse on schedule or optional PR checks.
- **Source refs:** ITEM-stack-8, ITEM-stack-9, ITEM-stack-10, ITEM-stack-12, ITEM-architecture-9
- **Priority:** MEDIUM

### Q-14: Should Lighthouse CI and axe checks be blocking immediately or introduced as baseline/informational checks first?

- **Category:** ux
- **Why it matters:** Automated a11y/performance checks are useful non-visual UX hardening, but blocking budgets without baselines can create noisy CI failures.
- **Default recommendation:** Make axe smoke checks blocking for critical pages and introduce Lighthouse CI as scheduled/informational until baselines are captured.
- **Source refs:** ITEM-stack-10, ITEM-architecture-8
- **Priority:** MEDIUM

### Q-15: Should upstream parity status be exposed to maintainers only, or shown publicly in the site UI?

- **Category:** ux
- **Why it matters:** A parity manifest/report can drive tests and planning internally; exposing status publicly can improve transparency but may create support expectations.
- **Default recommendation:** Keep the machine-readable manifest and generated report in repo/CI first; add public-facing release notes or docs only after statuses are stable.
- **Source refs:** ITEM-architecture-1, ITEM-pitfalls-1, ITEM-pitfalls-4
- **Priority:** LOW

## Technical Direction

### Stack
- Core runtime: Next.js 16.2.x, React/React DOM 19.2.x, TypeScript 5.x, npm lockfile, Node 24 LTS, Docker standalone output. Refs: ITEM-stack-1, ITEM-architecture-10.
- Data/storage: no site-owned database; static parity/config data lives in repo as JSON/TypeScript/fixtures; live state/history remains in `meshcore-mqtt-live-map`. Refs: ITEM-stack-2.
- Map: keep Leaflet 1.9.4 and React Leaflet 5; fix tile URL/attribution configuration so declared env/config is actually used. Refs: ITEM-stack-4.
- Validation: add Zod for env, live-map payloads, internal map responses, and external geocoding/API shapes; add AJV or equivalent for upstream serial command schema parity. Refs: ITEM-stack-5, ITEM-stack-6.
- Tests: add Vitest, React Testing Library, jsdom, Vite React plugin, and tsconfig path support for unit/component tests; add Playwright Chromium smoke tests for critical routes and browser-only flows; add `@axe-core/playwright` and optionally Lighthouse CI. Refs: ITEM-stack-8, ITEM-stack-9, ITEM-stack-10.
- CI/security: add Next typegen/typed routes, dependency review, CodeQL, grouped Dependabot, Docker build cache, Docker run smoke, and SBOM on release images. Refs: ITEM-stack-11, ITEM-stack-12.

Codex supplemental analysis agrees with schema boundaries, typed parsers/normalizers, server-side proxying when credentials are involved, fixture tests, Docker smoke tests, and avoiding broker/topic/config assumptions directly in UI. Codex suggested MapLibre as a possible maintained map option, but Claude stack/architecture research recommends staying with Leaflet for this pass because it is already installed, stable, and aligned with current implementation and upstream live-map UI.

### Architecture
- Create a machine-readable parity manifest in the codebase, not `.forge`, covering `utilities`, `repeater-config`, `serial-usb`, `prefix-matrix`, `live-map-api`, `live-map-ui`, `ci`, and `docker`; generate a human audit report from it. Refs: ITEM-architecture-1.
- Promote utility/repeater data into `src/lib/meshcore-data/` with typed loaders and validation fixtures. Expose normalized TypeScript contracts for regions/cities/airports, emojis/roles, node type codes, recommended radio settings, serial command profiles, and delay profiles. Refs: ITEM-architecture-2.
- Split tool business logic into pure modules such as naming, prefixes, serial-profile, config-export, and optional browser-only keygen adapters. UI components should consume stable contracts instead of owning rules. Refs: ITEM-architecture-3.
- Use `meshcore-mqtt-live-map` as the decoder/runtime boundary. The Next app should call the upstream API server-side with optional bearer token and normalize into a local `MapSnapshot` contract. Refs: ITEM-architecture-4.
- Add `/api/map/snapshot` as the canonical client contract returning nodes, links/routes if available, stats, connection, source, and generated timestamp from one store call. Keep `/api/map/nodes` and `/api/map/stats` as compatibility wrappers. Refs: ITEM-architecture-5.
- Keep browser-only imports isolated: Leaflet/React Leaflet in no-SSR client modules, Web Serial in client-only modules, and future key generation loaded lazily/browser-only. Refs: ITEM-architecture-6.
- Maintain a clear boundary between site map summary and full live-map application parity. Link, sidecar-host, or reverse-proxy to the upstream app for advanced operator features rather than rewriting them in React during this pass. Refs: ITEM-architecture-7.
- Test pyramid: unit tests for pure logic and env/config parsing, integration tests for route handlers and upstream fixtures, and Playwright smoke tests for route wiring and browser-only behavior. Refs: ITEM-architecture-8.
- Docker topology: Next site container -> server-side map proxy -> separate live-map service -> MQTT broker. Do not bundle FastAPI live-map into the Next image. Refs: ITEM-architecture-10.

### Prior Art to Leverage
- Use `Colorado-Mesh/meshcore-utilities-site` as a parity checklist for repeater generator, companion generator, PrefixMatrix, Serial USB, contacts, and stats widgets. Do not transplant the Flask implementation wholesale. Refs: ITEM-prior-art-1.
- Port the outcome of the repeater config generator: generated settings JSON, region home/all handling, deterministic filenames, and regression tests. Refs: ITEM-prior-art-2.
- Keep the current companion UX but add stricter validation and optional settings export if desired. Refs: ITEM-prior-art-3.
- Port the PrefixMatrix concept: 4-character submatrix, reserved IDs, collision severity distinctions, and searchable details. Refs: ITEM-prior-art-4.
- Port the serial profile schema and settings-file-to-serial-command workflow in typed TypeScript with tests, correcting upstream issues instead of copying JS blindly. Refs: ITEM-prior-art-5.
- Treat `/contacts` as a user decision, not an automatic parity target, because of privacy/source-of-truth concerns. Refs: ITEM-prior-art-6.
- Use `yellowcooln/meshcore-mqtt-live-map` as the full live-map runtime and API source, including its deployment/configuration templates as non-invasive guidance. Refs: ITEM-prior-art-7, ITEM-prior-art-10.
- Reuse live-map test ideas and fixture coverage patterns for API auth, node modes, decoder edge cases, persistence/source behavior, and WebSocket/snapshot semantics where relevant. Refs: ITEM-prior-art-11.
- Preserve GPL attribution/source obligations for live-map-derived work and clarify the current repo source URL before release. Refs: ITEM-prior-art-12.

## Detailed Planning Implications
- Start with foundations: add test framework, Zod/AJV validation dependencies, typed route/typegen plumbing, and CI scripts before feature ports so subsequent parity work has regression coverage.
- Create `src/lib/meshcore-data/` and `src/lib/meshcore-tools/` boundaries before editing UI components. Data modules should export normalized contracts; UI should become a consumer, not a rule owner.
- Vendor or recreate small audited upstream fixtures under a clear provenance path such as `src/lib/meshcore-data/fixtures/` or `tests/fixtures/upstream/`; include source commit/date metadata and license notes.
- Implement parity manifest/report as executable data. The manifest should cover feature presence, source fixture versions, implementation status, tests, docs, and deferred rationale.
- Build map contract work in this order: Zod schema for upstream `/api/nodes`, server-side bearer-token fetch, `MapSnapshot` schema, `/api/map/snapshot`, compatibility wrappers, client hook migration, tests with upstream-shaped fixtures.
- Add explicit source-mode handling (`live_map_api`, `mqtt_json`, `sample`, `empty`, `error`) and make tests/health checks assert mode, not just HTTP 200.
- Treat direct MQTT as a guarded fallback. Add warnings/docs when `MESHCORE_MQTT_URL` is set without `MESHCORE_LIVE_MAP_API_URL`; avoid raw packet decoding scope creep.
- For utility parity, sequence as: canonical recommended settings fixture -> repeater settings export -> tests -> serial apply-settings conversion -> 4-character PrefixMatrix -> companion export if approved.
- Keep destructive serial commands behind explicit metadata and confirmations. Tests should assert confirmation requirements for erase, reboot, GPS/power, region changes, private-key writes, and password actions.
- Keep all Leaflet, React Leaflet, Web Serial, clipboard, and key generation code behind client-only boundaries. Add smoke tests for unsupported/secure-context messaging rather than hardware tests.
- Document Docker/runtime env semantics: which env vars are build-time public bundle variables versus server runtime variables. Prefer server runtime config endpoints for tile/provider values that need to change after image build.
- Harden CI without publishing or pushing images: PR checks build/run locally, release workflows remain gated, and Docker release adds SBOM/provenance only on approved release/tag/manual events.
- Create non-visual contracts for Opus UI delegation: props, DTOs, state names, test IDs, accessibility requirements, and interaction requirements before visual redesign tasks.
- Add cross-step verification checkpoints: upstream fixture parity tests, `npm run lint`, `npm run typecheck` or typegen+tsc, `npm run test:run`, Playwright smoke, `npm run build`, Docker build, Docker run smoke against `/api/map/snapshot` or health endpoint.

## Risk Register
- **CRITICAL: Direct raw MQTT misconfiguration.** Operators may point Next.js at raw MeshCore MQTT and expect decoding that only upstream live-map performs. Mitigation: primary docs/config use live-map API; direct MQTT labeled JSON-only; startup/config warning when MQTT is configured without live-map API. Refs: ITEM-pitfalls-3, ITEM-pitfalls-11.
- **CRITICAL: License/provenance mistakes.** The live-map repo is GPL-3.0-compatible, but the utilities repo has no advertised license. Mitigation: preserve GPL notices for live-map-derived work; clarify utilities license before substantial copying; reimplement behavior and track provenance for fixtures. Refs: ITEM-pitfalls-10, ITEM-prior-art-12.
- **MODERATE: False utility parity.** Naming tools can appear complete without generated settings JSON and config application. Mitigation: add config export/download and tests, or label tools naming-only if deferred. Refs: ITEM-pitfalls-1, ITEM-prior-art-2, ITEM-prior-art-3.
- **MODERATE: Settings drift across guide/tool/sample data.** Radio settings, delays, serial commands, and sample nodes can contradict each other. Mitigation: one validated settings fixture, generated snippets/defaults, and CI assertions. Refs: ITEM-pitfalls-2, ITEM-architecture-2.
- **MODERATE: Claiming full live-map parity from `/api/nodes` alone.** Users may expect routes, peers, LOS, coverage, and history from a simplified node map. Mitigation: explicitly scope site map as summary and link/host upstream full app for operator features. Refs: ITEM-pitfalls-4, ITEM-architecture-7.
- **MODERATE: Token leakage through query strings/caches/logs.** Query tokens can appear in logs or cache keys. Mitigation: prefer bearer auth from server-side fetch, avoid logging full URLs, document exposure policy, keep cache TTL/source behavior deliberate. Refs: ITEM-pitfalls-5.
- **MINOR/MODERATE: Inconsistent map stats/nodes.** Separate client fetches can observe different snapshots. Mitigation: canonical `/api/map/snapshot` and wrappers. Refs: ITEM-pitfalls-6, ITEM-architecture-5.
- **MODERATE: Sample data false confidence in production.** Unconfigured deployments can show plausible sample nodes and pass health checks. Mitigation: explicit production guard/warning and smoke tests that assert source mode. Refs: ITEM-pitfalls-7, ITEM-pitfalls-12.
- **MODERATE: Nominatim public API policy violation.** Client-side lookup cannot set true User-Agent and autocomplete would violate policy. Mitigation: server-side rate-limited/cached proxy or strict user-triggered lookup only; no public-Nominatim autocomplete. Refs: ITEM-pitfalls-8.
- **MODERATE: Web Serial unsupported-browser and destructive-command regressions.** Visual changes could hide warnings or weaken confirmations. Mitigation: preserve disabled states/guidance, require command metadata confirmations, and add tests. Refs: ITEM-pitfalls-9.
- **MODERATE: Docker/runtime env misunderstanding.** `NEXT_PUBLIC_*` values may be frozen at build time. Mitigation: classify build-time vs runtime envs, use server runtime config where needed, and test image promotion behavior. Refs: ITEM-pitfalls-13.
- **MINOR: Dependency drift hidden by semver and audit-only signals.** Operational regressions may not be caught by `npm audit`. Mitigation: lockfile authority, scheduled dependency review/outdated reporting, grouped Dependabot, and smoke tests for high-risk libraries. Refs: ITEM-pitfalls-14.

## Conflicts & Tradeoffs
- **Max parity vs. not rewriting upstream apps.** The project asks for maximum useful parity, but research agrees that wholesale Flask/live-map rewrites would increase risk. Resolve by porting behavior/contracts/tests and using upstream live-map as a service. Refs: side A ITEM-prior-art-1, ITEM-prior-art-7; side B ITEM-architecture-7, ITEM-pitfalls-4.
- **Direct MQTT fallback vs. production correctness.** The current stack has optional direct MQTT, but raw MeshCore parity requires upstream decoding/state. Resolve by keeping direct MQTT only for decoded JSON and warning/documenting limits. Refs: side A ITEM-stack-3; side B ITEM-pitfalls-3, ITEM-pitfalls-11.
- **Public site map vs. protected upstream live-map API.** The site may intentionally expose public map summaries while upstream API may be token-protected. Resolve with server-side bearer auth, explicit policy docs, low/controlled caching, and no broad protected endpoint proxying without threat model. Refs: side A ITEM-prior-art-8; side B ITEM-pitfalls-5.
- **Local demo convenience vs. production truthfulness.** Sample data helps local/demo UX but can mislead production users and health checks. Resolve with explicit source modes and production guard. Refs: side A ITEM-stack-2; side B ITEM-pitfalls-7, ITEM-pitfalls-12.
- **Runtime configurability vs. Next.js public env inlining.** Map tile/provider settings should be configurable, but `NEXT_PUBLIC_*` is build-time. Resolve by using server runtime config endpoints for values that must change after build and documenting the rest. Refs: side A ITEM-stack-4; side B ITEM-pitfalls-13.
- **Visual UX hardening vs. delegation constraint.** The pass must make UI/UX make sense, but visual implementation must be delegated to Opus UI. Resolve by defining non-visual contracts, tests, accessibility checks, and DTOs here, then delegate styling/layout. Refs: side A PROJECT.md; side B ITEM-architecture-6, ITEM-stack-10.
- **Codex MapLibre suggestion vs. stack research Leaflet recommendation.** Codex noted MapLibre as a maintained option, but stack/architecture research recommends retaining Leaflet due to existing implementation, React Leaflet 5 compatibility, and upstream similarity. Resolve by keeping Leaflet in this pass. Refs: side A codex-analysis.md; side B ITEM-stack-4.

## Confidence Assessment
| Dimension | Status | Confidence | Notes |
|-----------|--------|------------|-------|
| stack | complete | HIGH | Strong agreement on retaining Next 16/React 19/Node 24, no DB, Leaflet, Zod/AJV, tests, typed routes, and pragmatic CI hardening. |
| pitfalls | complete | HIGH | Detailed risk coverage across parity, live-map integration, auth/caching, sample data, Nominatim, Web Serial, licensing, Docker, env, and dependency drift. |
| architecture | complete | HIGH | Clear boundaries: parity manifest, typed data modules, pure tool logic, live-map service boundary, snapshot endpoint, client-only browser APIs, test pyramid, and Docker topology. |
| prior-art | complete | HIGH | Upstream feature gaps and leverage points are well mapped; live-map prior art is especially clear. Utilities repo license ambiguity remains a user/legal decision. |
| codex-analysis | complete | MED | Optional supplemental research only; aligns with main findings on schema boundaries, server proxying, tests, and pitfalls, but did not inspect as deeply and suggested MapLibre as an alternative not adopted for this pass. |

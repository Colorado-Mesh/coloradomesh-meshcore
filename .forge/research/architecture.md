# Architecture Research — Colorado MeshCore Hardening & Parity Pass

Checked: 2026-05-06

Scope inspected:
- Current repo: `/Users/cjvana/Documents/GitHub/denvermc-org`
- Utilities upstream: `/tmp/meshcore-utilities-site` cloned from `https://github.com/Colorado-Mesh/meshcore-utilities-site`
- Live-map upstream: `/tmp/meshcore-mqtt-live-map` cloned from `https://github.com/yellowcooln/meshcore-mqtt-live-map`

### ITEM-architecture-1: Treat parity as a versioned manifest, not an ad-hoc visual audit

- **Recommendation:** Add a small parity-audit subsystem that records upstream features/data sources and the site’s implementation status in a machine-readable manifest, then generate a human audit report from it. Structure it around domains: `utilities`, `repeater-config`, `serial-usb`, `prefix-matrix`, `live-map-api`, `live-map-ui`, `ci`, and `docker`.
- **Rationale:** The current site already contains tools, guides, live-map routes, Docker, and CI, but the upstream utilities repo has distinct assets that are easy to partially copy and then drift: `recommended_settings.json`, `regions.json`, `emojis.json`, `default_serial_commands.json`, JSON schemas, and client-side key generation. A manifest gives the fresh hardening pass a stable checklist and prevents “looks done” parity from missing data/config parity. Keep the manifest in code or JSON, not `.forge`, because this pass must not depend on archived Forge artifacts and future maintainers should be able to rerun the audit outside Forge.
- **Confidence:** HIGH
- **Source:** Codebase + upstream inspection — `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/tools`, `/tmp/meshcore-utilities-site/static/data`, `/tmp/meshcore-mqtt-live-map/ARCHITECTURE.md`; GitHub: `https://github.com/Colorado-Mesh/meshcore-utilities-site`, `https://github.com/yellowcooln/meshcore-mqtt-live-map`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not keep parity notes only in a markdown checklist; that cannot drive tests or reveal drift when upstream JSON/schema files change. Do not reuse archived `.forge` artifacts as the active parity source.

### ITEM-architecture-2: Promote utility/repeater configuration data into typed, schema-validated data modules

- **Recommendation:** Move repeater/utility data into `src/lib/meshcore-data/` with typed loaders and validation fixtures. Preserve upstream JSON shapes where useful, but expose normalized TypeScript contracts to UI components: regions/cities/airports, emojis/companion suffix roles, node type codes, recommended radio settings, serial command profiles, and repeater delay profiles. Add tests that compare imported upstream fixtures against local normalized output.
- **Rationale:** Current components hardcode important domain data in UI files (`NamingWizard.tsx`, `CompanionNamer.tsx`, `guides/repeater-setup/page.tsx`) while upstream keeps some canonical data in JSON (`regions.json`, `recommended_settings.json`, `default_serial_commands.json`, `serial_commands.schema.json`). Data-driven modules make parity auditable, testable, and safer for delegated UI work because Opus can render against stable data contracts without changing domain rules.
- **Confidence:** HIGH
- **Source:** Codebase + upstream inspection — `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/tools/serial-commands.ts`, `/tmp/meshcore-utilities-site/static/data/recommended_settings.json`, `/tmp/meshcore-utilities-site/static/data/default_serial_commands.json`, `/tmp/meshcore-utilities-site/serial_commands.schema.json`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not keep repeater settings duplicated across guide pages, tools, and serial command profiles. Do not import upstream JSON blindly into React components without a normalization/validation layer.

### ITEM-architecture-3: Keep utility business logic pure and isolate browser-only capabilities at the edge

- **Recommendation:** Split tools into pure domain modules plus thin client components: `src/lib/meshcore-tools/naming.ts`, `prefixes.ts`, `serial-profile.ts`, `config-export.ts`, and, if parity requires vanity key generation, a browser-only `keygen` adapter loaded lazily. UI components should call pure functions and display results; they should not own naming rules, prefix collision rules, or config export shape.
- **Rationale:** The upstream utilities app intentionally generates private keys client-side so the server never sees secrets. The current site already has Web Serial isolated in a client component and notes that bytes stay in the tab, but naming/config logic is mixed into UI. Separating pure logic enables deterministic unit tests, protects zero-knowledge key generation boundaries, and allows Opus visual work to change forms/layouts without altering rules.
- **Confidence:** HIGH
- **Source:** Upstream + codebase inspection — `/tmp/meshcore-utilities-site/static/js/repeater_name_tool.js`, `/tmp/meshcore-utilities-site/static/js/companion_name_tool.js`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/tools/SerialUsbTool.tsx`; MDN Web Serial docs: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not recreate the Flask endpoint model in Next unless server-side generation is truly needed; it increases secret-handling risk and complicates Docker. Do not let visual UI delegation modify naming/key-generation rules inline.

### ITEM-architecture-4: Use `meshcore-mqtt-live-map` as the decoder/runtime boundary and consume its `/api/nodes` contract server-side

- **Recommendation:** Treat `yellowcooln/meshcore-mqtt-live-map` as the authoritative MeshCore MQTT decoder and live-map runtime. The Next app should primarily consume `GET /api/nodes?mode=full` through server-side API routes with optional `MESHCORE_LIVE_MAP_API_TOKEN`; normalize that payload into the site’s `MapSnapshot` contract. Keep direct MQTT in the Next app only as a JSON-compatible fallback, not as a raw MeshCore packet decoder.
- **Rationale:** Upstream live-map already owns MQTT connection modes, MeshCore packet decoding through `@michaelhart/meshcore-decoder`, state persistence, route history, peers, LOS, coverage, weather, Turnstile/token behavior, and node API compatibility. Reimplementing raw decoding in the Next site would duplicate a specialized subsystem and likely regress route/path decoding. The current Next app already has the right architectural direction: `MESHCORE_LIVE_MAP_API_URL` is preferred, token stays server-side, and raw MQTT is described as optional JSON-compatible payload input.
- **Confidence:** HIGH
- **Source:** Upstream docs + codebase inspection — `/tmp/meshcore-mqtt-live-map/README.md`, `/tmp/meshcore-mqtt-live-map/ARCHITECTURE.md`, `/tmp/meshcore-mqtt-live-map/backend/app.py`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`, `/Users/cjvana/Documents/GitHub/denvermc-org/.env.example`; GitHub: `https://github.com/yellowcooln/meshcore-mqtt-live-map`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not subscribe the browser directly to MQTT. Do not add MeshCore packet decoding into the Next app unless the upstream live-map is unavailable and the scope explicitly changes. Do not expose `PROD_TOKEN` or `MESHCORE_LIVE_MAP_API_TOKEN` as `NEXT_PUBLIC_*`.

### ITEM-architecture-5: Collapse map client fetching behind a single snapshot endpoint and cache only at the server boundary

- **Recommendation:** Add or prefer a single `/api/map/snapshot` endpoint that returns nodes, links/routes, stats, connection, and source in one response; let `/api/map/nodes` and `/api/map/stats` remain compatibility wrappers over the same server-side snapshot. Keep route handlers request-time, with short server-side polling/debounce in `src/lib/map/store.ts`, and avoid CDN/client cache surprises for live data.
- **Rationale:** Current `useMapSnapshot` fetches `/api/map/nodes` and `/api/map/stats` in parallel; both call `getMapSnapshot()`, which can duplicate normalization/fetch work and expose inconsistent generated timestamps. Upstream live-map supports full snapshots and deltas; the Next app should establish one canonical snapshot contract first, then add delta support if needed. Official Next.js 16 docs say route handlers are not cached by default and Cache Components replace older route segment configs in some setups, so live API behavior should be deliberate rather than relying on old caching assumptions.
- **Confidence:** HIGH
- **Source:** Codebase + official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/src/hooks/useMapSnapshot.ts`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/map/nodes/route.ts`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/map/stats/route.ts`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`; Next.js route handlers: `https://nextjs.org/docs/app/getting-started/route-handlers`, Next.js caching: `https://nextjs.org/docs/app/getting-started/caching`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not keep independent nodes/stats fetch paths as the primary client contract. Do not add persistent database storage for the public site unless the site becomes the live-map runtime; upstream already persists state/history.

### ITEM-architecture-6: Make browser-only UI boundaries explicit with client-only loaders and non-visual contracts for Opus

- **Recommendation:** Put all Leaflet, React-Leaflet, Web Serial, clipboard-heavy, and future key-generation browser APIs behind explicit client-only boundaries. For maps, use `next/dynamic(..., { ssr: false })` or the current equivalent wrapper, and keep `leaflet`/`react-leaflet` imports inside the browser-only module. For visual delegation, define non-visual contracts first: props, data DTOs, test IDs, and interaction requirements; delegate styling/layout/component composition to Opus via `co-ui` or `/opus-ui`.
- **Rationale:** React Leaflet is not SSR-compatible because Leaflet calls the DOM at import/runtime. The current repo already uses a manual `NetworkMapWrapper` to import `NetworkMap` after mount, but making this pattern explicit and documented will prevent future SSR regressions. This is also the cleanest boundary for the session constraint: Codex handles data/API/tests/CI; Opus handles visual UI.
- **Confidence:** HIGH
- **Source:** Codebase + official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMapWrapper.tsx`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/tools/SerialUsbTool.tsx`; React Leaflet SSR note: `https://react-leaflet.js.org/docs/start-introduction/`, Next.js browser-only rendering: `https://nextjs.org/docs/app/guides/single-page-applications#rendering-components-only-in-the-browser`, Next.js no-SSR dynamic import: `https://nextjs.org/docs/pages/guides/lazy-loading#with-no-ssr`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not import Leaflet in server components or shared modules. Do not let visual work happen in this Codex-backed session except for non-visual wiring required to support Opus.

### ITEM-architecture-7: Preserve a clear boundary between “site map summary” and “full live-map application” parity

- **Recommendation:** Architect the current Next map as a Colorado MeshCore site-integrated summary/consumer, while linking or reverse-proxying to a deployed `meshcore-mqtt-live-map` instance for full operator parity features such as route history, peers, LOS, coverage, weather, path-byte filters, and WebSocket live updates. Only port individual upstream UI features into Next after their data contracts are available via the server-side proxy.
- **Rationale:** Upstream live-map is a full app with a FastAPI backend, WebSocket protocol, persisted state, route history JSONL, LOS/elevation proxy, coverage cache, and weather/Turnstile support. Current Next map is intentionally simpler: it renders markers, role/status filters, stats, and source attribution. Max parity should therefore verify correct integration first and avoid half-porting complex upstream map behavior into a React component without the supporting backend semantics.
- **Confidence:** HIGH
- **Source:** Upstream + codebase inspection — `/tmp/meshcore-mqtt-live-map/ARCHITECTURE.md`, `/tmp/meshcore-mqtt-live-map/docs.md`, `/tmp/meshcore-mqtt-live-map/README.md`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/map/page.tsx`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not attempt a one-pass rewrite of upstream `backend/static/app.js` into React. Do not claim full live-map UI parity if the site only consumes `/api/nodes` and does not expose route history/peers/LOS/coverage semantics.

### ITEM-architecture-8: Add a layered test pyramid focused on contracts, fixtures, and browser-only smoke tests

- **Recommendation:** Add fast unit tests for pure modules (`map/normalize`, config env parsing, utility naming, serial profile normalization, repeater data validation), integration tests for Next route handlers using upstream `/api/nodes` fixtures, and a small Playwright suite for critical browser-only flows: map page loads with mocked API, serial page renders unsupported/secure-context states, and tools generate expected names/prefix states. Keep these in CI before Docker smoke.
- **Rationale:** Next.js official testing guidance positions unit tests for logic and synchronous UI, while recommending E2E tests for App Router/server-component flows. This repo currently has lint/typecheck/build but no test script; upstream live-map has pytest coverage for `/api/nodes` modes, auth, WebSocket snapshots, decoder roles, route resolution, and state persistence. The site’s highest-risk changes are contracts and browser-only rendering, not just TypeScript compilation.
- **Confidence:** HIGH
- **Source:** Codebase + upstream tests + official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`, `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`, `/tmp/meshcore-mqtt-live-map/tests/test_api_nodes_modes.py`, `/tmp/meshcore-mqtt-live-map/.github/workflows/tests.yml`; Next.js testing: `https://nextjs.org/docs/app/guides/testing`, Playwright with Next.js: `https://nextjs.org/docs/app/guides/testing/playwright`, Vitest with Next.js: `https://nextjs.org/docs/app/guides/testing/vitest`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not rely on `next build` as the only regression test. Do not unit-test async Server Components heavily; use E2E/smoke for those flows and unit-test extracted logic instead.

### ITEM-architecture-9: Harden CI as fast PR gates plus separate release/security gates

- **Recommendation:** Keep normal PR CI fast: checkout, setup Node 24, `npm ci`, lint, typecheck, unit tests, production build, and Docker build smoke with Buildx cache. Add dependency review for PRs and CodeQL/security scan on schedule or separate workflow. Keep Docker publishing restricted to release/tag/manual events and never push images during this Forge pass without explicit approval.
- **Rationale:** Current CI already runs lint/typecheck/build and Docker build smoke. Current security workflow runs `npm audit --audit-level=high`. Current Docker release workflow is appropriately gated to releases/tags/manual dispatch and uses provenance. Pragmatic hardening should add high-value checks without making every PR slow or affecting shared services. Docker’s current GitHub Actions guidance supports GHA cache and provenance/SBOM attestations through build-push-action.
- **Confidence:** HIGH
- **Source:** Codebase + official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`, `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/security.yml`, `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/docker-release.yml`; Docker GHA cache: `https://docs.docker.com/build/cache/backends/gha/`, Docker attestations: `https://docs.docker.com/build/ci/github-actions/attestations/`, Dependency Review Action: `https://github.com/actions/dependency-review-action`, CodeQL docs: `https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not put long-running browser matrices or image publishing in the normal PR path. Do not disable hooks/checks or mark security scans as optional without an explicit project decision.

### ITEM-architecture-10: Keep Docker standalone as the production target and document runtime topology explicitly

- **Recommendation:** Continue using Next standalone output in the site container, with `meshcore-mqtt-live-map` deployed as a separate runtime/service when live data is needed. Document the recommended topology in env examples and Docker Compose: Next site -> server-side `/api/map/*` proxy -> live-map `/api/nodes?mode=full` -> MQTT broker. Healthcheck should remain a cheap public API read (`/api/map/stats` or future `/api/map/snapshot`).
- **Rationale:** The current Dockerfile already follows the standalone pattern: build with Next, copy `.next/standalone`, `.next/static`, `public`, and run `node server.js` as a non-root user. The live-map upstream is a separate Python/FastAPI container with its own persistent `/data` and MQTT credentials. Conflating them into one container would mix unrelated lifecycles and complicate deployments, backups, and secret scopes.
- **Confidence:** HIGH
- **Source:** Codebase + upstream + official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/Dockerfile`, `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml`, `/tmp/meshcore-mqtt-live-map/docker-compose.yaml`, `/tmp/meshcore-mqtt-live-map/deploy/docker-compose.image.yaml`; Next.js output config: `https://nextjs.org/docs/pages/api-reference/config/next-config-js/output`, Docker Next.js guide: `https://docs.docker.com/guides/nextjs/containerize/`, Next.js Docker example: `https://github.com/vercel/next.js/tree/canary/examples/with-docker`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not bundle the live-map FastAPI runtime inside the Next image. Do not require a database for the site unless a future feature needs durable site-owned state.

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-architecture-1 | HIGH | Codebase + upstream inspection | `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/tools`; `https://github.com/Colorado-Mesh/meshcore-utilities-site`; `https://github.com/yellowcooln/meshcore-mqtt-live-map` |
| ITEM-architecture-2 | HIGH | Codebase + upstream inspection | `/tmp/meshcore-utilities-site/static/data`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx` |
| ITEM-architecture-3 | HIGH | Upstream + MDN | `https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API`; `/tmp/meshcore-utilities-site/static/js/repeater_name_tool.js` |
| ITEM-architecture-4 | HIGH | Upstream docs + codebase inspection | `https://github.com/yellowcooln/meshcore-mqtt-live-map`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts` |
| ITEM-architecture-5 | HIGH | Official docs + codebase inspection | `https://nextjs.org/docs/app/getting-started/route-handlers`; `https://nextjs.org/docs/app/getting-started/caching` |
| ITEM-architecture-6 | HIGH | Official docs + codebase inspection | `https://react-leaflet.js.org/docs/start-introduction/`; `https://nextjs.org/docs/app/guides/single-page-applications#rendering-components-only-in-the-browser` |
| ITEM-architecture-7 | HIGH | Upstream + codebase inspection | `/tmp/meshcore-mqtt-live-map/ARCHITECTURE.md`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/map/page.tsx` |
| ITEM-architecture-8 | HIGH | Official docs + upstream tests | `https://nextjs.org/docs/app/guides/testing`; `https://nextjs.org/docs/app/guides/testing/playwright`; `/tmp/meshcore-mqtt-live-map/tests/test_api_nodes_modes.py` |
| ITEM-architecture-9 | HIGH | Official docs + codebase inspection | `https://docs.docker.com/build/cache/backends/gha/`; `https://github.com/actions/dependency-review-action`; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml` |
| ITEM-architecture-10 | HIGH | Official docs + codebase/upstream inspection | `https://nextjs.org/docs/pages/api-reference/config/next-config-js/output`; `https://docs.docker.com/guides/nextjs/containerize/`; `/Users/cjvana/Documents/GitHub/denvermc-org/Dockerfile` |

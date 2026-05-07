# Pitfalls Research — Colorado MeshCore hardening/pass

Checked: 2026-05-06
Mode: pitfalls

### ITEM-pitfalls-1: Treating name-tool parity as complete when config export parity is missing

- **What goes wrong:** The site appears to have brought over the upstream repeater/companion tools, but users only get names/copyable text rather than the upstream utility site's generated MeshCore configuration JSON, recommended settings payload, region home/all settings, and settings file names. A user can leave with a valid-looking name but still misconfigure the radio/region/identity on the device.
- **Root cause:** The upstream Flask routes generate `settings_json` and `settings_json_file_name` for repeater and companion workflows, while the local Next.js tools are mostly client-side naming aids. The local data and wizard are useful but not an end-to-end configuration generator.
- **Prevention:** For max parity, explicitly implement or document the gap: add downloadable config JSON output for repeater and companion workflows, include region `home` plus all region codes for repeaters, and add tests comparing generated outputs against checked upstream fixtures. If full config generation is deferred, label the local tools as naming-only.
- **Severity:** MODERATE
- **Phase relevance:** Upstream parity audit and tool hardening
- **Confidence:** HIGH
- **Source:** GitHub/codebase — https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/backend/api/routes/repeater_name_tool/index.py; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx`
- **Checked:** 2026-05-06

### ITEM-pitfalls-2: Copying repeater settings without a single validated source of truth

- **What goes wrong:** Radio settings, delay profiles, serial preflight commands, and sample map node radio metadata drift apart. The site can say the canonical radio profile is 910.525 MHz / 62.5 kHz / SF7 / CR8 / 22 dBm while sample map nodes show 915 MHz / 125 kHz / SF10-12, and the repeater guide's command snippets are not machine-checked against upstream recommended settings.
- **Root cause:** The upstream utility has `static/data/recommended_settings.json` and serial command JSON; the local site hard-codes guide content, sample data, and command profiles in separate files. Hard-coded examples become unreviewed configuration advice.
- **Prevention:** Create a local checked-in settings fixture sourced from upstream, then generate guide snippets, serial tool defaults, and tests from that fixture. Fix sample-data radio fields or label them as synthetic/non-canonical. Add a CI assertion that the radio guide, serial defaults, and sample fixtures do not contradict the canonical settings.
- **Severity:** MODERATE
- **Phase relevance:** Repeater content hardening and CI parity checks
- **Confidence:** HIGH
- **Source:** GitHub/codebase — https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/static/data/recommended_settings.json; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/guides/radio-settings/page.tsx`; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/sample-data.ts`
- **Checked:** 2026-05-06

### ITEM-pitfalls-3: Pointing direct MQTT at a raw MeshCore broker and expecting the Next.js map to decode it

- **What goes wrong:** Operators configure `MESHCORE_MQTT_URL` directly to a MeshCore MQTT broker (`meshcore/#`). The Next.js process connects and subscribes, but raw MeshCore packet payloads are not decoded, so nodes/routes silently fail to appear or only JSON-compatible payloads appear. The site looks broken even though MQTT connectivity is healthy.
- **Root cause:** `meshcore-mqtt-live-map` subscribes to MQTT and decodes MeshCore packets with the `@michaelhart/meshcore-decoder` pipeline. The local Next.js direct MQTT path only parses incoming message payloads as JSON and normalizes already-decoded node-like objects.
- **Prevention:** Treat direct MQTT in this repo as a fallback for decoded JSON feeds only. For production, run `yellowcooln/meshcore-mqtt-live-map` as the decoder/state service and consume its `/api/nodes?mode=full` API. Add a startup/config warning when `MESHCORE_MQTT_URL` is set without `MESHCORE_LIVE_MAP_API_URL`, and make docs say raw MeshCore MQTT requires the upstream live-map service.
- **Severity:** CRITICAL
- **Phase relevance:** Live-map integration and runtime configuration
- **Confidence:** HIGH
- **Source:** WebFetch/codebase — https://github.com/yellowcooln/meshcore-mqtt-live-map#api; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`
- **Checked:** 2026-05-06

### ITEM-pitfalls-4: Assuming `/api/nodes` parity means full live-map parity

- **What goes wrong:** The site consumes only the upstream live-map nodes API and then claims or designs as if it has live routes, heat, peers, history, LOS/coverage, MQTT online semantics, and route collision handling. Users see a simplified node map while expecting the behavior of `meshcore-mqtt-live-map`.
- **Root cause:** The upstream live-map project is a stateful FastAPI/WebSocket app with routes, route history, peers, heat, coverage, weather, LOS, boundary filters, and careful route-prefix collision behavior. Its documented `/api/nodes` endpoint is intentionally a nodes API for external tools, not the complete map state/UX.
- **Prevention:** Be explicit: either integrate only a node-summary map and link/embed the upstream live map for advanced functionality, or add a dedicated integration path for `/snapshot`/WebSocket/peer endpoints with token handling. Do not reimplement routing/online inference ad hoc unless tests are copied from the upstream edge cases.
- **Severity:** MODERATE
- **Phase relevance:** Live-map UI/UX and feature scoping
- **Confidence:** HIGH
- **Source:** WebFetch — https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/README.md; https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/ARCHITECTURE.md
- **Checked:** 2026-05-06

### ITEM-pitfalls-5: Leaking or weakening live-map production tokens through query strings and caches

- **What goes wrong:** A protected upstream live-map instance requires `PROD_TOKEN`; the local integration appends it as `?token=`. That keeps the token out of browser bundles, but it can still land in reverse-proxy logs, upstream access logs, traces, and cache keys. If cache layers treat `/api/map/*` as public while upstream data was token-gated, operators can also accidentally expose a protected feed.
- **Root cause:** The upstream API supports query-token and `Authorization: Bearer` auth; the local `buildLiveMapApiUrl()` currently uses query params. The local Next.js responses set public `s-maxage` cache headers for map node/stat endpoints.
- **Prevention:** Prefer sending `Authorization: Bearer ${token}` from the server-side fetch instead of query params, keep local `/api/map/*` cache TTL intentionally low, and document that exposing the Colorado site map is a separate policy decision from protecting the upstream live-map admin/API. Avoid logging full upstream URLs.
- **Severity:** MODERATE
- **Phase relevance:** Security hardening and live-map integration
- **Confidence:** MEDIUM
- **Source:** WebFetch/codebase — https://github.com/yellowcooln/meshcore-mqtt-live-map#production-token; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/map/nodes/route.ts`
- **Checked:** 2026-05-06

### ITEM-pitfalls-6: Returning internally inconsistent map data by fetching nodes and stats separately

- **What goes wrong:** The browser fetches `/api/map/nodes` and `/api/map/stats` in parallel. Each endpoint calls `getMapSnapshot()` independently, so a refresh can occur between calls: node count, source freshness, connection state, and plotted nodes can disagree. Users see confusing overlays or prefix checks based on a different snapshot than stats.
- **Root cause:** There is no single snapshot endpoint; the hook composes two independently cached/dynamic API route responses. The map store also has source-specific state and refresh throttling, making timing-dependent divergence plausible.
- **Prevention:** Add `/api/map/snapshot` returning `{nodes, links, routes, stats, connection, source}` from one `getMapSnapshot()` call. Point map, stats overlay, prefix matrix, and naming conflict checks at that single endpoint or at a shared client cache.
- **Severity:** MINOR
- **Phase relevance:** Map API hardening and UX correctness
- **Confidence:** HIGH
- **Source:** Codebase — local `/Users/cjvana/Documents/GitHub/denvermc-org/src/hooks/useMapSnapshot.ts`; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/map/nodes/route.ts`; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/map/stats/route.ts`
- **Checked:** 2026-05-06

### ITEM-pitfalls-7: Letting bundled sample data create false production confidence

- **What goes wrong:** A production deployment with no live-map API or MQTT config can still show plausible Colorado sample nodes. CI and Docker health checks pass because `/api/map/stats` returns 200, while the live feed is absent. Users may believe the map is real unless they notice the sample badge.
- **Root cause:** `MESHCORE_MAP_SAMPLE_DATA` defaults to true whenever neither live-map API nor MQTT is configured. The Docker healthcheck only verifies the stats endpoint responds, not that a live source is configured or fresh.
- **Prevention:** Keep sample data for local demo, but add an explicit production guard: if `NODE_ENV=production` and no live source is configured, show a prominent site-wide/live-map warning or fail a deployment smoke test unless `MESHCORE_MAP_SAMPLE_DATA=true` is intentionally set. Health checks should distinguish `sample`, `empty`, `live_map_api`, and `mqtt` states.
- **Severity:** MODERATE
- **Phase relevance:** Docker/runtime verification and UI truthfulness
- **Confidence:** HIGH
- **Source:** Codebase — local `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/config.ts`; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/map/MapStatsOverlay.tsx`; local `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml`
- **Checked:** 2026-05-06

### ITEM-pitfalls-8: Violating Nominatim public API policy from the naming wizard

- **What goes wrong:** The airport lookup sends user-entered addresses directly from the browser to `nominatim.openstreetmap.org`. Under real traffic, the app can exceed the public service's 1 request/second application-wide limit or fail the identification requirement because browsers do not let JavaScript set a true `User-Agent` header. If the field becomes typeahead/autocomplete during a UX pass, it would directly violate policy.
- **Root cause:** The local naming wizard calls Nominatim client-side on button press. Nominatim's public API policy requires app identification and limits bulk/repeated use; autocomplete/typeahead is explicitly forbidden.
- **Prevention:** Keep lookup strictly user-triggered, add debounce/disabled state, and preferably proxy through a server route with application-wide rate limiting, valid identifying headers/contact, caching, and clear attribution. Do not add autocomplete against public Nominatim; use a paid/geocoding provider or self-hosted service if that UX is required.
- **Severity:** MODERATE
- **Phase relevance:** UI/UX hardening and third-party API compliance
- **Confidence:** HIGH
- **Source:** WebSearch/codebase — https://operations.osmfoundation.org/policies/nominatim/; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx`
- **Checked:** 2026-05-06

### ITEM-pitfalls-9: Web Serial UX regressions and destructive command safety

- **What goes wrong:** Users on Safari/Firefox/mobile may not be able to use the USB serial tool, and users who can use it can run high-impact commands like `erase`, `reboot`, `log start`, GPS/power changes, and region writes. A visual pass that hides warnings, weakens confirmations, or makes unsupported browsers look like site failure will cause field frustration or device misconfiguration.
- **Root cause:** Web Serial has limited browser availability and requires a secure context. The upstream utility's command profile includes destructive and state-changing commands; the local tool mirrors many of them with confirmation prompts but still sends raw serial commands directly to hardware.
- **Prevention:** Preserve strong disabled states, explicit browser/HTTPS guidance, per-command confirmations for destructive/state-changing commands, and a read-only/preflight grouping. Add tests for the command profile so future parity imports do not accidentally remove confirmation on `erase`, `reboot`, GPS, power, or region-changing actions.
- **Severity:** MODERATE
- **Phase relevance:** Serial USB tool and UI/UX audit
- **Confidence:** HIGH
- **Source:** WebSearch/GitHub/codebase — https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API; https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/static/data/default_serial_commands.json; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/tools/SerialUsbTool.tsx`
- **Checked:** 2026-05-06

### ITEM-pitfalls-10: License and provenance mistakes when copying upstream code/data

- **What goes wrong:** The hardening pass copies useful code, static data, screenshots, or UI behavior from upstream repositories without compatible licensing/attribution. This can make the site legally ambiguous even if the technical work is correct.
- **Root cause:** `yellowcooln/meshcore-mqtt-live-map` is GPL-3.0; this repo is GPL-3.0-or-later, which is compatible if notices/source obligations are preserved. `Colorado-Mesh/meshcore-utilities-site` has no GitHub-detected license and no license endpoint, so substantial copying from it is not automatically permitted despite being an explicitly requested source repo.
- **Prevention:** For the live-map repo, keep GPL attribution/notices when copying or adapting code. For the utilities repo, prefer factual configuration values and behavior reimplementation, or get an explicit license/permission before copying code, templates, static datasets, or generated assets. Track provenance in comments or docs for imported fixtures.
- **Severity:** CRITICAL
- **Phase relevance:** Upstream parity implementation and compliance review
- **Confidence:** HIGH
- **Source:** GitHub/codebase — https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/LICENSE; https://github.com/Colorado-Mesh/meshcore-utilities-site; local `/Users/cjvana/Documents/GitHub/denvermc-org/LICENSE`
- **Checked:** 2026-05-06

### ITEM-pitfalls-11: Deploying direct MQTT state into serverless or multi-instance runtimes

- **What goes wrong:** Multiple Next.js instances each open their own MQTT connection and hold separate in-memory node state. Serverless platforms may repeatedly cold-start MQTT clients, drop state, or keep no durable history. Users see inconsistent maps depending on instance routing, and the broker receives unnecessary duplicate subscribers.
- **Root cause:** The local MQTT integration stores state in module-level memory and creates an MQTT client from API route execution. The upstream live-map is intentionally a long-running stateful service with persisted `/data` state, route history, and reconnect handling. Next.js self-hosting docs also call out reverse proxies and multi-instance caching/state considerations.
- **Prevention:** For production, run one stateful live-map service and have this site consume its API. If direct MQTT remains, document it as single-container only, guard it off on Netlify/serverless, and add instance IDs/metrics so duplicate subscriptions are obvious.
- **Severity:** CRITICAL
- **Phase relevance:** Deployment architecture and runtime hardening
- **Confidence:** HIGH
- **Source:** WebFetch/codebase — https://nextjs.org/docs/app/guides/self-hosting; https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/ARCHITECTURE.md; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`
- **Checked:** 2026-05-06

### ITEM-pitfalls-12: Docker and CI checks that prove buildability but not operability

- **What goes wrong:** CI passes lint, typecheck, Next build, npm audit, and Docker build, but the resulting image may not boot, may serve only sample data, may have a broken healthcheck, or may fail with realistic live-map env vars. This creates false confidence for a hardening pass.
- **Root cause:** The current CI Docker job only builds the image and does not run it. The compose healthcheck accepts any 200 from `/api/map/stats`, including sample/empty states. There are no unit/integration tests for map normalization, live-map API token behavior, serial command parity, or generated tool outputs.
- **Prevention:** Add a fast PR smoke test that runs the built container, curls `/api/map/stats` and a new `/api/health`/`/api/map/snapshot`, and asserts expected source mode under controlled env. Add fixture tests using upstream `/api/nodes` shapes and serial/repeater settings fixtures. Keep npm audit, but add `npm outdated`/dependency review as informational rather than relying on audit alone.
- **Severity:** MODERATE
- **Phase relevance:** CI hardening and Docker verification
- **Confidence:** HIGH
- **Source:** Codebase — local `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`; local `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/security.yml`; local `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml`
- **Checked:** 2026-05-06

### ITEM-pitfalls-13: Runtime environment variables that are accidentally build-time frozen or misleading

- **What goes wrong:** Operators expect Docker/Compose changes to public settings like `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_MAP_TILE_URL` to affect a prebuilt image at runtime. Some values may be baked into client bundles or static metadata at `next build`, while server-only values work at request time. The deployment appears configured but still uses old URLs/metadata/tiles.
- **Root cause:** Next.js inlines `NEXT_PUBLIC_*` variables into the JavaScript bundle during build. Server-side runtime env vars can be read dynamically, but only from server-rendered/dynamic code paths. The local compose file exposes both public and server-only envs.
- **Prevention:** Classify env vars as build-time versus runtime in docs and CI. Avoid `NEXT_PUBLIC_*` for values that must change after image build; serve client runtime config from a server endpoint when needed. Add a Docker promotion test that builds once and runs with changed runtime envs to verify which values actually move.
- **Severity:** MODERATE
- **Phase relevance:** Docker/runtime docs and deployment hardening
- **Confidence:** HIGH
- **Source:** WebFetch/codebase — https://nextjs.org/docs/app/guides/self-hosting; local `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml`; local `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/constants.ts`
- **Checked:** 2026-05-06

### ITEM-pitfalls-14: Dependency drift in the MQTT/Next stack hidden by loose semver ranges

- **What goes wrong:** A future install resolves newer major/minor behavior under broad dependency ranges, or the current lock lags behind upstream bug fixes. Map connectivity bugs become difficult to reproduce between local, CI, and Docker because versions are not explicitly reviewed.
- **Root cause:** The project uses many caret ranges and a lockfile; `mqtt` is installed as `^5.14.1` while MQTT.js latest found during research is 5.15.1. CI installs from lockfile, but there is no dependency review/change awareness beyond high-severity `npm audit`.
- **Prevention:** Keep `package-lock.json` authoritative, add scheduled dependency review/`npm outdated` reporting, and update high-risk runtime libraries (`next`, `react`, `mqtt`, `leaflet`, MDX) deliberately with smoke tests. Do not let `npm audit` be the only dependency signal; it misses operational regressions.
- **Severity:** MINOR
- **Phase relevance:** Dependency risk and CI hardening
- **Confidence:** MEDIUM
- **Source:** WebSearch/codebase — https://www.npmjs.com/package/mqtt; https://github.com/mqttjs/MQTT.js/releases/tag/v5.15.1; local `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`
- **Checked:** 2026-05-06

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-pitfalls-1 | HIGH | GitHub/codebase | https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/backend/api/routes/repeater_name_tool/index.py; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx` |
| ITEM-pitfalls-2 | HIGH | GitHub/codebase | https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/static/data/recommended_settings.json; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/guides/radio-settings/page.tsx` |
| ITEM-pitfalls-3 | HIGH | WebFetch/codebase | https://github.com/yellowcooln/meshcore-mqtt-live-map#api; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts` |
| ITEM-pitfalls-4 | HIGH | WebFetch | https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/README.md |
| ITEM-pitfalls-5 | MEDIUM | WebFetch/codebase | https://github.com/yellowcooln/meshcore-mqtt-live-map#production-token; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts` |
| ITEM-pitfalls-6 | HIGH | Codebase | `/Users/cjvana/Documents/GitHub/denvermc-org/src/hooks/useMapSnapshot.ts` |
| ITEM-pitfalls-7 | HIGH | Codebase | `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/config.ts`; `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml` |
| ITEM-pitfalls-8 | HIGH | WebSearch/codebase | https://operations.osmfoundation.org/policies/nominatim/; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx` |
| ITEM-pitfalls-9 | HIGH | WebSearch/GitHub/codebase | https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API; https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/static/data/default_serial_commands.json |
| ITEM-pitfalls-10 | HIGH | GitHub/codebase | https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/LICENSE; https://github.com/Colorado-Mesh/meshcore-utilities-site |
| ITEM-pitfalls-11 | HIGH | WebFetch/codebase | https://nextjs.org/docs/app/guides/self-hosting; https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/ARCHITECTURE.md |
| ITEM-pitfalls-12 | HIGH | Codebase | `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`; `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml` |
| ITEM-pitfalls-13 | HIGH | WebFetch/codebase | https://nextjs.org/docs/app/guides/self-hosting; `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml` |
| ITEM-pitfalls-14 | MEDIUM | WebSearch/codebase | https://www.npmjs.com/package/mqtt; `/Users/cjvana/Documents/GitHub/denvermc-org/package.json` |

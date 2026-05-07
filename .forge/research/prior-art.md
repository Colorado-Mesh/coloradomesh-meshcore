# Prior Art Research: Colorado MeshCore hardening and upstream parity

Checked on 2026-05-06 against the current repository at `/Users/cjvana/Documents/GitHub/denvermc-org`, upstream `Colorado-Mesh/meshcore-utilities-site` commit `3b8c5d93b8bfac048deee1f214feee32e0a0e053`, and upstream `yellowcooln/meshcore-mqtt-live-map` commit `bb59158164a067a8985bda965fada3a36135500e`.

## Feature / Config Parity View

| Area | Current Colorado MeshCore site | `meshcore-utilities-site` | `meshcore-mqtt-live-map` | Missing / weak in current site | Port now | Defer |
|------|--------------------------------|----------------------------|---------------------------|--------------------------------|----------|-------|
| Repeater naming | React naming wizard with airport/city/landmark selection, 23-char validation, live prefix conflict warning | Flask generator backed by `coloradomesh` models, city/mountain lookup, node-type recommendations, generated `settings_json` | N/A | No downloadable repeater config JSON; current data is static and may diverge from `coloradomesh`; no upstream `RepeaterSettings` parity | Add config JSON generation/download and tests; reconcile city/landmark/region data | Server-side `coloradomesh` integration unless Python sidecar or package strategy is approved |
| Companion naming | React companion namer with emoji/handle/suffix options | Flask companion generator with `EmojiTools`, role types, recommended settings JSON | N/A | No generated companion settings JSON; emoji validation is browser-only | Add client-side validation/tests and optional config download | Public-key suggestion from upstream service until contact/node source is confirmed |
| Prefix planning | 2-char prefix matrix from current `/api/map/nodes` | 2-level 4-char matrix; reserved IDs; duplicate repeater collision detection; status/search details | N/A | No 4-char view, no reserved-ID handling, no collision severity distinction | Port 4-char matrix model and reserved/collision UX logic | Direct dependency on upstream `coloradomesh.meshcore.services.nodes` if live-map API can provide enough data |
| Serial USB | Web Serial terminal and canned command profile in TypeScript | Web Serial page, JSON command schema, default profile, uploaded repeater settings-to-commands generator | N/A | No JSON profile import/upload; no generated apply-settings workflow; no schema validation in CI | Port profile schema and uploaded settings-to-serial conversion with fixes | Any browser UI restyling to Opus UI |
| Contacts export | Not present | `/contacts` API builds Colorado contacts JSON with limit/order/status/type | N/A | Contact import/export parity absent | Ask user; consider privacy and usefulness first | Public contacts endpoint until data-owner approval |
| Live map ingest | Preferred `MESHCORE_LIVE_MAP_API_URL`; polls `/api/nodes?mode=full`; optional JSON MQTT fallback; sample data | N/A | Full FastAPI MQTT decoder, state persistence, `/api/nodes`, `/snapshot`, `/stats`, `/peers`, `/ws` | Current map does not run/deploy upstream live-map; direct MQTT cannot decode raw MeshCore packets | Keep upstream live-map as separate runtime and consume `/api/nodes`; add config docs/diagnostics | Reimplement MQTT decoder in Next.js |
| Live map UI | Leaflet markers, role/status colors, search/filter, popup details, stats overlay | N/A | Full realtime WS map with routes, heat, history, peers, LOS, coverage, weather, share URLs, QR modal, PWA | Current site lacks most advanced live-map tools | Link/sidecar/embed the upstream map for operator-grade view; add lightweight route/link display only if API contract supports it | Full Next.js rewrite of upstream map UI in this pass |
| Live map operations | Site Dockerfile and compose for web app only; CI Docker build smoke | Docker publish workflow for utilities | Upstream compose, image deploy, env template, backups, PROD_TOKEN, Turnstile, map boundary, state files | No sidecar compose/runtime guidance for live-map service; no token diagnostics | Add non-publishing compose/docs/env examples and health checks | Push/publish images or affect shared services |
| CI/test parity | ESLint, TypeScript, Next build, Docker build, npm audit | Docker publish only | Pytest suite for API/auth/decoder/history/LOS/coverage; Docker publish | No unit tests for normalizers, serial profiles, parity data, API contracts | Add fast Node tests and schema validation | Full e2e visual testing unless delegated/approved |
| Licensing | Current repo is GPL-3.0-or-later and has live-map attribution on `/map` | No GitHub license metadata found | GPL-3.0 | Utilities copying needs explicit license/permission despite same org; live-map derivative obligations must stay visible | Preserve GPL attribution and source availability; clarify utilities license before large copy | Copying unlicensed upstream code wholesale |

### ITEM-prior-art-1: Colorado MeshCore Utilities Site as the parity baseline

- **URL:** https://github.com/Colorado-Mesh/meshcore-utilities-site
- **What it does well:** Provides the original utility surface the current site is expected to absorb: repeater configuration generator, companion configuration generator, PrefixMatrix browser, serial USB command console, `/contacts`, and stats widgets. It uses `coloradomesh==0.11.1` for canonical Colorado Mesh data and MeshCore models rather than hand-maintaining every naming/config rule.
- **What it lacks:** No license metadata was returned by GitHub; its Flask implementation is not a good direct fit for the current Next.js app; CI is publish-focused rather than test-focused; `.env` appears in the repo clone and should not be treated as a pattern to copy.
- **What we can learn:** Treat it as the functional parity checklist, not as an implementation to transplant wholesale. The current site already covers the main page set and the four utility categories, but the hardening pass should close the highest-value gaps: generated repeater/companion settings JSON, 4-character PrefixMatrix/reserved-ID logic, serial profile schema/upload support, and a decision on whether `/contacts` should be exposed.
- **License:** No license found via GitHub metadata; obtain/confirm permission before copying substantial code or data. Current repo is GPL-3.0-or-later, but upstream utilities repo does not advertise that.
- **Confidence:** HIGH
- **Source:** GitHub + codebase — https://github.com/Colorado-Mesh/meshcore-utilities-site; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/README.md`; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/app.py`; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/requirements.txt`
- **Checked:** 2026-05-06

### ITEM-prior-art-2: Repeater config generator and recommended settings

- **URL:** https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/backend/api/routes/repeater_name_tool/index.py
- **What it does well:** Generates a repeater name and a full `settings_json` from typed `coloradomesh.meshcore` models, sets region `all`/`home`, derives region from city or mountain selection, validates a 4-character public-key ID, and returns a deterministic filename such as `coloradomesh_meshcore_repeater_config_{name}`.
- **What it lacks:** It depends on Python package data/classes that the Next.js site does not currently have; it sets `owner_info = None`; public-key ID suggestion depends on the external Colorado node list; the current site's static city/landmark tables do not exactly mirror the upstream `coloradomesh` source.
- **What we can learn:** Port the user-facing outcome, not the Flask route: add a typed settings JSON generator/download path to the current repeater naming wizard and regression-test the generated fields. If direct `coloradomesh` package integration is not approved, encode a small audited TypeScript model for the recommended settings and add a drift check against upstream data. Do not block on dynamic public-key suggestion; current live-map conflict checks are already useful.
- **License:** No license metadata found for utilities repo; implementation copy requires permission.
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/routes/repeater_name_tool/index.py`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/guides/repeater-setup/page.tsx`
- **Checked:** 2026-05-06

### ITEM-prior-art-3: Companion generator and emoji/role conventions

- **URL:** https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/backend/api/routes/companion_name_tool/index.py
- **What it does well:** Uses `coloradomesh.emojis.EmojiTools` for emoji validation, exposes a clear set of companion roles, generates names using `CompanionName`, suggests a public-key ID, and applies `static/data/recommended_settings.json` to produce a companion config JSON.
- **What it lacks:** Recommended companion settings are only a small JSON object (`radio_settings`) with a TODO noting that recommended companion settings should live in the base library; the Flask route mutates a module-level settings object before return; the current site has a richer suffix UX but no settings export.
- **What we can learn:** Keep the current React companion UX, but add stricter validation and optional settings JSON export. Do not rely on mutable shared JSON state. Ask whether companion settings export is useful enough for this pass, because repeater config parity is higher operational value.
- **License:** No license metadata found for utilities repo; implementation copy requires permission.
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/routes/companion_name_tool/index.py`; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/static/data/recommended_settings.json`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/CompanionNamer.tsx`
- **Checked:** 2026-05-06

### ITEM-prior-art-4: PrefixMatrix 4-character collision/reservation model

- **URL:** https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/backend/api/routes/prefix_matrix/index.py
- **What it does well:** Builds a two-level matrix: primary 2-character prefix cells and 16x16 sub-matrices for 4-character IDs. It marks reserved IDs, inactive nodes, reserved IDs in use, and true repeater collisions separately from harmless multiple companions sharing a prefix. It also prepares searchable details including status, location, public key, contact URL, node type, and last-heard.
- **What it lacks:** It is server-rendered HTML/JS and pulls nodes directly from the `coloradomesh` Python service; the current Next.js site uses the live-map snapshot instead. Upstream depends on `reserved_public_key_ids()` and node-type enums that are not present in current TypeScript.
- **What we can learn:** Upgrade the current 2-character `PrefixMatrix` to a 4-character planner backed by `/api/map/nodes`, with a local reserved-ID table or a small generated artifact from `coloradomesh`. This is a high-value parity port because it directly prevents repeater public-key prefix collisions. Defer direct Python service integration unless the current live-map node API cannot provide sufficient key/status/type data.
- **License:** No license metadata found for utilities repo; implementation copy requires permission.
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/routes/prefix_matrix/index.py`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/PrefixMatrix.tsx`
- **Checked:** 2026-05-06

### ITEM-prior-art-5: Serial USB profile schema and settings-file application flow

- **URL:** https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/static/js/serial_usb_tool_page.js
- **What it does well:** Defines a JSON serial command profile schema, ships a default command profile, supports Web Serial with local-only parsing, allows users to upload repeater settings JSON, validates fields, and converts settings into serial commands such as `erase`, `set radio`, `set prv.key`, `set name`, region commands, delays, passwords, and reboot.
- **What it lacks:** The upstream JS should not be copied blindly: the inspected command builder sends `set rxdelay ${settings.txdelay.toFixed(2)}` where `settings.rxdelay` appears intended, and duplicated order values occur near reboot. The current site hard-codes the default command profile in TypeScript and lacks JSON schema validation/import.
- **What we can learn:** Port the concept into typed TypeScript with tests: keep current Web Serial terminal, add serial profile JSON schema validation in CI, add "load generated repeater config" to build an apply-settings action, and fix the upstream `rxdelay`/ordering issues during port. This directly closes the gap between "generate config" and "apply config".
- **License:** No license metadata found for utilities repo; implementation copy requires permission.
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/serial_commands.schema.json`; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/static/data/default_serial_commands.json`; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/static/js/serial_usb_tool_page.js`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/tools/serial-commands.ts`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/tools/SerialUsbTool.tsx`
- **Checked:** 2026-05-06

### ITEM-prior-art-6: Contacts API and network stats from utilities site

- **URL:** https://github.com/Colorado-Mesh/meshcore-utilities-site/blob/main/app.py
- **What it does well:** Provides `/contacts` with `limit`, `order`, `status`, and `type` parameters by delegating to `coloradomesh.meshcore.services.contacts.prepare_contacts`, and the landing page pulls node/repeater/companion/room counts plus region leaderboard from `StatsService`.
- **What it lacks:** The current site intentionally removed legacy observer/health/stats/node-list/Discord APIs and currently exposes only `/api/map/nodes` and `/api/map/stats`. A public contacts endpoint may expose contact details and should be explicitly approved; stats from `coloradomesh` may disagree with live-map-derived stats if sources differ.
- **What we can learn:** Do not silently reintroduce broad legacy APIs. If contact export is desired, add it as a clearly documented, rate-limited, privacy-reviewed endpoint or downloadable file. For stats, prefer live-map-derived values already present in current `/api/map/stats`, and only add region leaderboards if the source of truth is agreed.
- **License:** No license metadata found for utilities repo; implementation copy requires permission.
- **Confidence:** MEDIUM
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/app.py`; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/services/contacts.py`; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/services/meshcore_stats.py`; current `/Users/cjvana/Documents/GitHub/denvermc-org/README.md`
- **Checked:** 2026-05-06

### ITEM-prior-art-7: `meshcore-mqtt-live-map` should remain the live decoder/runtime

- **URL:** https://github.com/yellowcooln/meshcore-mqtt-live-map
- **What it does well:** Provides the full MeshCore MQTT runtime: FastAPI backend, MQTT over TCP/WebSockets/TLS, official `@michaelhart/meshcore-decoder` integration, state persistence, API token protection, WebSocket streaming, route/history/heat/peer state, LOS, coverage, weather, QR/share/PWA features, and image-based Docker deployments. Its `/api/nodes?mode=full` contract returns nodes with `public_key`, `name`, `device_role`, `last_seen`, `timestamp`, and `location`.
- **What it lacks:** It is a separate Python/Node service, not a drop-in Next.js component. Its advanced UI is a large single-file Leaflet app; reimplementing it inside the site would be high risk and visual work must be delegated. The README itself warns to expect rough edges.
- **What we can learn:** Keep the current architecture direction: run/operate `meshcore-mqtt-live-map` as the canonical decoder and have the Next.js site consume its `/api/nodes` endpoint. The current code already appends `mode=full` and optional `token`, which matches upstream. Do not add raw MeshCore packet decoding to the Next.js app in this pass.
- **License:** GPL-3.0; current repo is GPL-3.0-or-later and already includes source attribution on `/map`.
- **Confidence:** HIGH
- **Source:** GitHub + codebase — https://github.com/yellowcooln/meshcore-mqtt-live-map; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/README.md`; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/ARCHITECTURE.md`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`
- **Checked:** 2026-05-06

### ITEM-prior-art-8: Live-map API/auth contract and current integration gaps

- **URL:** https://github.com/yellowcooln/meshcore-mqtt-live-map#api
- **What it does well:** Documents `GET /api/nodes?token=...`, optional `format=nested`, automatic `updated_since` delta filtering, and `mode=full`/`all`/`snapshot` for full responses. It supports `Authorization: Bearer` and query token auth when `PROD_MODE=true`.
- **What it lacks:** The current Next.js integration only polls full snapshots through `/api/map/nodes` and does not expose live-map source diagnostics beyond basic connection messages. It does not proxy `/snapshot`, `/stats`, `/peers/{id}`, `/coverage`, `/los`, or `/ws`, and its map UI does not render upstream route/history/peer streams.
- **What we can learn:** Add a small diagnostic/source panel and tests for the `/api/nodes` normalization contract before adding more features. Keep full polling for now because it is simple and robust; consider `updated_since` only if node counts or API load become a problem. Do not proxy protected upstream endpoints broadly without a threat model.
- **License:** GPL-3.0
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/README.md`; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/backend/app.py`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`; current `/Users/cjvana/Documents/GitHub/denvermc-org/.env.example`
- **Checked:** 2026-05-06

### ITEM-prior-art-9: Advanced live-map UI features should be linked or sidecar-hosted, not rewritten wholesale

- **URL:** https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/backend/static/app.js
- **What it does well:** Upstream includes operator-grade map interactions: realtime WebSocket updates, animated routes, heat map, 24-hour route history, peers panel, coverage layer, weather radar/wind, LOS with elevation profile and curvature, map boundary/radius, share URLs, direct node links, QR modal, PWA, node-size controls, labels, dark/topo layers, and route path-byte filters.
- **What it lacks:** Current site has a clean Next.js/React map with markers, role/status filters, popups, and stats, but lacks most of those advanced operator tools. Recreating the upstream UI in React would be a project by itself and any visual implementation must be delegated to Opus UI per project constraints.
- **What we can learn:** For max parity this pass, add a clear "Open full live map" integration and optionally deploy/configure upstream under a subpath or separate host. In the current Next.js map, port only non-visual, low-risk improvements: better node popup actions, route/link fields if the API supplies them, source health, and docs. Defer full UI parity to a dedicated Opus UI task or use the upstream UI directly.
- **License:** GPL-3.0
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/README.md`; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/docs.md`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/map/NodePopup.tsx`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/map/page.tsx`
- **Checked:** 2026-05-06

### ITEM-prior-art-10: Live-map deployment/configuration templates

- **URL:** https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/.env.example
- **What it does well:** Upstream `.env.example` and compose files cover practical production needs: MQTT credentials/transport/TLS, `PROD_MODE`/`PROD_TOKEN`, Turnstile, state and backup files, map center/radius/boundary, route TTL/history, coverage, weather, LOS, update checks, state persistence, and Docker image deployment.
- **What it lacks:** The current repo's `compose.yaml` only runs the Next.js web service; `.env.example` only has the consumer endpoint (`MESHCORE_LIVE_MAP_API_URL`) and no sidecar example for running the live-map service that feeds it. The user constraint forbids publishing images or affecting shared services without explicit approval.
- **What we can learn:** Add non-invasive local/ops guidance and optional compose profiles for a `meshcore-mqtt-live-map` sidecar, but keep it disabled by default. Include exact wiring: live-map service exposes `/api/nodes`; current web service sets `MESHCORE_LIVE_MAP_API_URL=http://meshmap:8080/api/nodes` and `MESHCORE_LIVE_MAP_API_TOKEN` when `PROD_MODE=true` upstream. Do not push or publish images.
- **License:** GPL-3.0
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/.env.example`; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/docker-compose.yaml`; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/deploy/docker-compose.image.yaml`; current `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml`; current `/Users/cjvana/Documents/GitHub/denvermc-org/.env.example`
- **Checked:** 2026-05-06

### ITEM-prior-art-11: Test and CI hardening patterns from live-map

- **URL:** https://github.com/yellowcooln/meshcore-mqtt-live-map/tree/main/tests
- **What it does well:** Upstream live-map has a pytest workflow and tests for API auth, node API modes, coverage endpoints, decoder channel secrets/prefixes/roles, LOS endpoints, MQTT online presence, neighbor overrides, peer history, route resolution, state persistence, weather flags, and WebSocket snapshot behavior.
- **What it lacks:** Current site CI runs lint, typecheck, build, Docker build smoke, and npm audit, but has no application-level tests for map normalization, utility parity, serial command profiles, or config generation. Utilities upstream has only Docker publishing workflow, not a meaningful test suite to copy.
- **What we can learn:** Add fast PR-safe tests around the current TypeScript code: live-map `/api/nodes` payload normalization, map stats, serial command profile/schema validity, generated repeater config JSON, 4-char PrefixMatrix collision/reserved logic, and environment parsing. This is more valuable than adding broad end-to-end tests in the first hardening pass.
- **License:** GPL-3.0 for live-map tests; utilities workflow has no advertised license.
- **Confidence:** HIGH
- **Source:** Codebase — `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/.github/workflows/tests.yml`; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/tests`; current `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`; current `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/security.yml`
- **Checked:** 2026-05-06

### ITEM-prior-art-12: GPL/source-attribution and unlicensed-upstream caution

- **URL:** https://github.com/yellowcooln/meshcore-mqtt-live-map/blob/main/LICENSE
- **What it does well:** The live-map repo is GPL-3.0 and the current site is already GPL-3.0-or-later, includes OCI license metadata, and the `/map` page attributes `yellowcooln/meshcore-mqtt-live-map` plus a source URL. That alignment makes live-map-derived work legally cleaner than mixing in unlicensed utility code.
- **What it lacks:** The current map attribution points source availability to `Colorado-Mesh/coloradomesh-meshcore`, while this repo appears to be `denvermc-org`; verify the actual public source URL before release. The utilities repo returned no license metadata, so code/data copying from it should be treated as unlicensed unless Colorado Mesh grants permission or adds a license.
- **What we can learn:** Preserve GPL notices, correct the source URL to the repository that contains the derivative map code if needed, and ask the owner to clarify the utilities repo license before wholesale code import. For this pass, it is safest to reimplement behavior from observed requirements and use small, auditable data/config artifacts with attribution/permission.
- **License:** Current repo GPL-3.0-or-later; live-map GPL-3.0; utilities repo license not advertised.
- **Confidence:** HIGH
- **Source:** GitHub + codebase — `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/LICENSE`; current `/Users/cjvana/Documents/GitHub/denvermc-org/LICENSE`; current `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/map/page.tsx`; current `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/docker-release.yml`; GitHub metadata for `Colorado-Mesh/meshcore-utilities-site`
- **Checked:** 2026-05-06

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-prior-art-1 | HIGH | GitHub + codebase | https://github.com/Colorado-Mesh/meshcore-utilities-site; `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/README.md` |
| ITEM-prior-art-2 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/routes/repeater_name_tool/index.py`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NamingWizard.tsx` |
| ITEM-prior-art-3 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/routes/companion_name_tool/index.py`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/CompanionNamer.tsx` |
| ITEM-prior-art-4 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/backend/api/routes/prefix_matrix/index.py`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/PrefixMatrix.tsx` |
| ITEM-prior-art-5 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/static/js/serial_usb_tool_page.js`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/tools/SerialUsbTool.tsx` |
| ITEM-prior-art-6 | MEDIUM | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-utilities-site/app.py`; `/Users/cjvana/Documents/GitHub/denvermc-org/README.md` |
| ITEM-prior-art-7 | HIGH | GitHub + codebase | https://github.com/yellowcooln/meshcore-mqtt-live-map; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/README.md`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts` |
| ITEM-prior-art-8 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/README.md`; `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/backend/app.py`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts` |
| ITEM-prior-art-9 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/docs.md`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx` |
| ITEM-prior-art-10 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/.env.example`; `/Users/cjvana/Documents/GitHub/denvermc-org/compose.yaml`; `/Users/cjvana/Documents/GitHub/denvermc-org/.env.example` |
| ITEM-prior-art-11 | HIGH | Codebase | `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/tests`; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml` |
| ITEM-prior-art-12 | HIGH | GitHub + codebase | `/tmp/forge-prior-art-upstreams/meshcore-mqtt-live-map/LICENSE`; `/Users/cjvana/Documents/GitHub/denvermc-org/LICENSE`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/map/page.tsx` |

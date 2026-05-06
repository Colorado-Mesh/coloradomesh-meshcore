# Prior Art Research: Colorado MeshCore Site Redesign

Project context checked 2026-05-05: existing brownfield Next.js site at `/Users/cjvana/Documents/GitHub/denvermc-org`, local visual prototype at `/Users/cjvana/Downloads/meshcore`, and linked public repositories for the live map, utilities, and icons. This research is intentionally focused on what should be reused or learned from, not on stack selection.

### ITEM-prior-art-1: Local Colorado MeshCore design prototype

- **URL:** `file:///Users/cjvana/Downloads/meshcore/Colorado%20MeshCore.html`
- **What it does well:** Provides the strongest visual direction for the redesign: night-sky operations-console aesthetic, Colorado/mountain motif, Space Grotesk + JetBrains Mono typography, mesh-teal/sunset-orange palette, and four concrete artboards for landing, live map, utilities, and observer/network health. The map and observer artboards already imply the target information architecture: a left filter rail, central map, right node detail panel, health score dashboard, recent activity table, and utilities cards.
- **What it lacks:** It is a static React/Babel design canvas, not production code. It uses mock data, random map dots, direct `<script type="text/babel">` loading, local logo assets, and no accessible/semantic production component structure. It should not be cloned verbatim because the project constraint requires inspiration rather than a direct clone.
- **What we can learn:** Use this as the design specification, not as an implementation source. Port the visual language into production Next/React components, replace all mock metrics with live map/API data, keep the artboard-level navigation model, and treat the custom canvas wrapper as disposable.
- **License:** N/A; local project artifact, not a third-party package.
- **Confidence:** HIGH
- **Source:** Local filesystem — `/Users/cjvana/Downloads/meshcore/screens.jsx`, `/Users/cjvana/Downloads/meshcore/Colorado MeshCore.html`, `/Users/cjvana/Downloads/meshcore/screenshots/canvas.png`
- **Checked:** 2026-05-05

### ITEM-prior-art-2: Existing Denver MeshCore site

- **URL:** `file:///Users/cjvana/Documents/GitHub/denvermc-org`
- **What it does well:** Already has a Next.js App Router site with content, navigation, blog/guides, Leaflet/react-leaflet map component, observer health cards, naming/prefix utilities, MQTT collector service, LibSQL/Turso data model, and API endpoints (`/api/health`, `/api/stats`, `/api/nodes`). It also contains current community-specific content and recent naming-standard work that should not be discarded blindly.
- **What it lacks:** The public deployment is Netlify-first while the new requirement is Docker-primary; the map is database/API polling rather than the richer WebSocket/live-route model from `meshcore-mqtt-live-map`; the current network health score is custom and likely should be replaced or reframed around live-map-derived activity rather than maintained as the primary source of truth.
- **What we can learn:** Preserve content, SEO structure, blog/guides, and any Colorado-specific naming logic, but replace the current map/health experience with a live-map integration. Avoid a greenfield rewrite that loses content and community context.
- **License:** Repository LICENSE present; exact terms not re-evaluated for this item.
- **Confidence:** HIGH
- **Source:** Local filesystem — `/Users/cjvana/Documents/GitHub/denvermc-org/README.md`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkHealthCard.tsx`
- **Checked:** 2026-05-05

### ITEM-prior-art-3: yellowcooln/meshcore-mqtt-live-map

- **URL:** https://github.com/yellowcooln/meshcore-mqtt-live-map
- **What it does well:** This is the closest match to the requested map replacement. It is a Dockerized FastAPI + Leaflet live map that subscribes to MeshCore MQTT, decodes packets with `@michaelhart/meshcore-decoder`, streams browser updates over WebSockets, persists state to files, renders live nodes/routes/heat/history/peers/LOS/weather/coverage overlays, supports PWA metadata, and exposes `/api/nodes`, `/snapshot`, `/stats`, `/peers/{id}`, and `/ws`. It has an active v1.8.6 release from 2026-05-02, multi-arch Docker publishing, and example deployments.
- **What it lacks:** It is a separate Python/static-JS application rather than a Next.js component library. The frontend is a large static `app.js`, not idiomatic React. Its license is GPL-3.0, so copying code into this repo may impose copyleft obligations. The README also warns that it was “vibe-coded” and may have rough edges.
- **What we can learn:** Treat it as the primary map engine and integrate it at service/API level first: run it as a sibling Docker service behind `meshcore.coloradomesh.org/map` or `map.meshcore.coloradomesh.org`, theme/brand its static assets, and consume its `/api/nodes`/`/stats` in the main site where needed. Do not reimplement route history, hop-prefix decoding, LOS, coverage, weather, peers, or WebSocket broadcasting unless a later phase intentionally replaces the GPL service boundary.
- **License:** GPL-3.0.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + repository docs — https://github.com/yellowcooln/meshcore-mqtt-live-map, https://github.com/yellowcooln/meshcore-mqtt-live-map/releases/tag/v1.8.6
- **Checked:** 2026-05-05

### ITEM-prior-art-4: Colorado-Mesh/meshcore-utilities-site

- **URL:** https://github.com/Colorado-Mesh/meshcore-utilities-site
- **What it does well:** This is the exact upstream utilities implementation the project asks to evaluate. It is a Flask app already Dockerized on port 50000 and currently hosted at `https://tools.meshcore.coloradomesh.org`. Features match the requested replacement targets: repeater configuration generator, companion configuration generator, prefix matrix browser, serial USB command console, `/contacts` JSON endpoint, static schemas/data for regions/recommended settings/serial commands, and dependency on the `coloradomesh` Python package.
- **What it lacks:** No license is visible in repository metadata, so reuse rights are unclear even though it is under the same organization. It is a Flask/Jinja/static-JS app, not a Next.js module. Its Docker publishing workflow pushes on main/master commits, not GitHub releases. It also contains a committed `.env` file path in the repo tree, which should be reviewed before submodule/vendor decisions.
- **What we can learn:** Use it as the authoritative source for Colorado Mesh utility behavior, but keep a service boundary until license and ownership are clarified. The practical first integration is a Git submodule or independently pinned Docker image reverse-proxied under `/utilities`, with the main site linking/cards deep-linking to specific tools. Rewriting the tools in React is only justified after extracting shared rules/schemas and confirming the utilities app cannot meet UX needs.
- **License:** No visible license in GitHub metadata; treat as all-rights-reserved/unknown until clarified.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + repository docs — https://github.com/Colorado-Mesh/meshcore-utilities-site, https://tools.meshcore.coloradomesh.org
- **Checked:** 2026-05-05

### ITEM-prior-art-5: Colorado-Mesh/icons

- **URL:** https://github.com/Colorado-Mesh/icons
- **What it does well:** Provides Colorado Mesh-branded platform assets in Linux PNG sizes, macOS `.icns`/iconset/template menubar PNGs, Windows `.ico`, and source SVG/Affinity files. The local design prototype already uses logo-like assets, but this repo is the requested canonical logo source.
- **What it lacks:** No license is visible in repository metadata. README credits megabear/KD5IHC but does not explicitly grant web/logo usage rights. It is structured for platform icons, not necessarily optimized web SVG/favicon/OG images.
- **What we can learn:** Vendor or submodule a pinned copy of the SVG/source icon assets into the site build and generate web-specific favicon/PWA/OG variants from them. Ask for explicit license/usage approval before distributing modified logo assets in Docker images or public releases.
- **License:** No visible license; credits only.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + repository docs — https://github.com/Colorado-Mesh/icons
- **Checked:** 2026-05-05

### ITEM-prior-art-6: Official MeshCore map frontend and 2026 map blog

- **URL:** https://github.com/meshcore-dev/map.meshcore.io
- **What it does well:** The official MeshCore map is static/build-free and uses Vue3, Leaflet, Leaflet.markercluster, and a backend API at `https://map.meshcore.io/api/v1/nodes`. The official blog documents mature UX patterns: freshness coloring for auto-updated infrastructure, duplicate-name filtering, search-in-current-view, clustering controls, coordinate popups, `meshcore://contact/add` QR codes, and share URLs that preserve map position/open node.
- **What it lacks:** It is a global infrastructure-discovery map, not a live MQTT route/health dashboard. The blog documents iframe embedding but not a public regional data export API beyond the official backend. It is not Colorado-branded and does not solve the requested live route/history replacement.
- **What we can learn:** Borrow official semantics and UX details: public-key deep links, contact QR modals, freshness colors, duplicate-name filters, cluster controls, and coordinate-copy actions. Use official map embedding only as a supplemental “global MeshCore context” link, not as the Colorado live map engine.
- **License:** MIT for `meshcore-dev/map.meshcore.io`; blog content N/A.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + WebFetch — https://github.com/meshcore-dev/map.meshcore.io, https://blog.meshcore.io/2026/04/04/meshcore-map
- **Checked:** 2026-05-05

### ITEM-prior-art-7: MeshCore Map Auto Uploader

- **URL:** https://github.com/recrof/map.meshcore.io-uploader
- **What it does well:** Automates official-map updates by uploading repeaters and room servers when a MeshCore Companion hears adverts. It supports USB serial or network host/port and Docker/Podman deployment, which aligns with the project’s Docker-first direction.
- **What it lacks:** It targets the official `map.meshcore.io` infrastructure rather than a Colorado live-map database. The fetched repository page did not expose Colorado-specific schema or direct integration details. It is a discovery/uploader tool, not a website or live dashboard.
- **What we can learn:** Add a future ingestion sidecar only if Colorado wants its public infrastructure mirrored to the official map. Do not confuse this with the live map replacement: it complements MQTT live-map data but does not replace WebSocket route visualization.
- **License:** MIT.
- **Confidence:** MEDIUM
- **Source:** WebFetch — https://github.com/recrof/map.meshcore.io-uploader
- **Checked:** 2026-05-05

### ITEM-prior-art-8: MeshCore Hub

- **URL:** https://github.com/ipnet-mesh/meshcore-hub
- **What it does well:** Provides a complete Docker-ready MeshCore monitoring platform: packet capture publishes to MQTT, collector persists events, REST API queries historical messages/advertisements/telemetry/trace paths, and a web dashboard visualizes nodes/status/history. It includes profiles for local broker, observer, collector, API, web, migrations, seed data, reverse-proxy production, Prometheus metrics, OIDC admin auth, webhooks, custom content, and node tagging.
- **What it lacks:** It is a full platform, not a lightweight site integration. It targets Python 3.14+ and a multi-component architecture that would substantially change this project’s existing Next.js/Turso approach. It is GPL-3.0-or-later, so code reuse has copyleft implications.
- **What we can learn:** Use it as architectural prior art for event persistence, API design, node tagging, observer naming, migrations, and Docker Compose profiles. Do not adopt it wholesale for this redesign unless the project intentionally becomes a MeshCore operations platform rather than a public community site.
- **License:** GPL-3.0-or-later.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + repository README — https://github.com/ipnet-mesh/meshcore-hub
- **Checked:** 2026-05-05

### ITEM-prior-art-9: michaelhart/meshcore-mqtt-broker

- **URL:** https://github.com/michaelhart/meshcore-mqtt-broker
- **What it does well:** Provides a MeshCore-specific WebSocket MQTT broker with public-key/JWT authentication, topic authorization, and subscribe-only users with roles. It documents the topic pattern `meshcore/{IATA_CODE}/{PUBLIC_KEY}/{subtopic}`, subscriber roles, and use of `@michaelhart/meshcore-decoder` auth token creation. This directly matches live-map ingestion needs when not relying on HiveMQ or another managed broker.
- **What it lacks:** It is a broker only; no dashboard, map, persistence, or site integration. It is designed around MQTT over WebSockets rather than plain MQTT TCP. Upstream does not appear to publish an official public Docker image in the README.
- **What we can learn:** If Colorado Mesh wants to self-host the broker, prefer this over generic Mosquitto because it encodes MeshCore authentication and topic authorization. For the site redesign, keep broker choice external/configurable and ensure the live map uses subscribe-only credentials rather than node publisher credentials.
- **License:** MIT.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + repository README — https://github.com/michaelhart/meshcore-mqtt-broker
- **Checked:** 2026-05-05

### ITEM-prior-art-10: agessaman/meshcore-packet-capture

- **URL:** https://github.com/agessaman/meshcore-packet-capture
- **What it does well:** Captures packets from MeshCore Companion radios over BLE, serial, or TCP, emits structured data to console/file/MQTT, supports up to six MQTT brokers, TLS/WebSocket transports, auth-token authentication, topic templates, packet type filtering, Docker deployment, and status telemetry. It explicitly distinguishes Companion radios from Repeaters/RoomServers and recommends `meshcoretomqtt` for the latter.
- **What it lacks:** It is an observer/ingestion tool, not a website. Docker BLE support is Linux-first and may be limited on macOS/Windows. It does not replace the live map UI or main site.
- **What we can learn:** Document observer setup separately from website deployment. If the Colorado live map needs more observers, point Companion operators here and repeater/room operators to `meshcoretomqtt`; do not bake device capture into the web container.
- **License:** MIT.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + repository README — https://github.com/agessaman/meshcore-packet-capture
- **Checked:** 2026-05-05

### ITEM-prior-art-11: meshcore-dev/meshcore-cli

- **URL:** https://github.com/meshcore-dev/meshcore-cli
- **What it does well:** Official-ish CLI for interacting with MeshCore companion radios over BLE, TCP, or serial. It exposes commands for info, telemetry, channels, contacts, repeater login/commands, path/trace, clock sync, JSON output, and serial repeater mode. Latest release v1.5.0 was published 2026-03-10.
- **What it lacks:** It is a terminal tool, not a browser UI. It cannot be dropped directly into a Next.js client component, and browser Web Serial UX/security constraints differ from Python CLI behavior.
- **What we can learn:** Use its command coverage and JSON output conventions as reference for the utilities serial console. Prefer sharing command definitions/schemas with `meshcore-utilities-site` rather than inventing a separate set of web serial commands in the redesign.
- **License:** MIT.
- **Confidence:** HIGH
- **Source:** GitHub API/gh CLI + repository README — https://github.com/meshcore-dev/meshcore-cli, https://github.com/meshcore-dev/meshcore-cli/releases/tag/v1.5.0
- **Checked:** 2026-05-05

### ITEM-prior-art-12: MeshMapper Coverage API and coverage layer integrations

- **URL:** https://wiki.meshmapper.net/coverage-api/
- **What it does well:** MeshMapper provides region/admin-scoped coverage grid data that existing live-map tooling can display as a coverage layer. Search results indicate the API returns grid cells with bounds, coverage type, colors, SNR, and timestamps, requires a region API key, and has a 100 requests/day limit. `meshcore-mqtt-live-map` already supports both legacy coverage-map APIs and MeshMapper coverage caching/sync.
- **What it lacks:** The docs page returned HTTP 403 to direct fetch, and the API is not anonymous. Access depends on regional administrator keys, so it cannot be assumed available during implementation.
- **What we can learn:** Do not build a bespoke Colorado coverage overlay first. Configure `meshcore-mqtt-live-map`’s existing coverage support if Colorado Mesh has a MeshMapper regional API key; otherwise hide the coverage button until credentials and rate-limit strategy are ready.
- **License:** N/A for API; access-controlled service.
- **Confidence:** MEDIUM
- **Source:** WebSearch + live-map README — https://wiki.meshmapper.net/coverage-api/, https://github.com/yellowcooln/meshcore-mqtt-live-map
- **Checked:** 2026-05-05

## Cross-cutting Conclusions

1. The best near-term integration is service composition, not wholesale code merging: keep the Next.js site as the public shell/content hub, run `meshcore-mqtt-live-map` as a sibling Docker service for live telemetry, and run or submodule `meshcore-utilities-site` as the authoritative utilities service until reuse rights and UX gaps are resolved.
2. GPL-licensed live-map and hub projects can be safely learned from and run as separate services, but copying code into this repo should be a deliberate licensing decision.
3. The local design prototype is valuable as design direction only; the production implementation should be accessible, responsive, Dockerized, and backed by live APIs.
4. The official MeshCore map contributes mature UX patterns—freshness, QR contacts, duplicate filters, share URLs—but not the requested live MQTT route/health replacement.
5. Colorado Mesh icon and utilities repositories need explicit licensing/usage confirmation before vendoring or redistributing modified assets in Docker release artifacts.

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-prior-art-1 | HIGH | Local filesystem | `/Users/cjvana/Downloads/meshcore/screens.jsx` |
| ITEM-prior-art-2 | HIGH | Local filesystem | `/Users/cjvana/Documents/GitHub/denvermc-org/README.md` |
| ITEM-prior-art-3 | HIGH | GitHub API/gh CLI | https://github.com/yellowcooln/meshcore-mqtt-live-map |
| ITEM-prior-art-4 | HIGH | GitHub API/gh CLI | https://github.com/Colorado-Mesh/meshcore-utilities-site |
| ITEM-prior-art-5 | HIGH | GitHub API/gh CLI | https://github.com/Colorado-Mesh/icons |
| ITEM-prior-art-6 | HIGH | GitHub API/gh CLI + WebFetch | https://github.com/meshcore-dev/map.meshcore.io; https://blog.meshcore.io/2026/04/04/meshcore-map |
| ITEM-prior-art-7 | MEDIUM | WebFetch | https://github.com/recrof/map.meshcore.io-uploader |
| ITEM-prior-art-8 | HIGH | GitHub API/gh CLI | https://github.com/ipnet-mesh/meshcore-hub |
| ITEM-prior-art-9 | HIGH | GitHub API/gh CLI | https://github.com/michaelhart/meshcore-mqtt-broker |
| ITEM-prior-art-10 | HIGH | GitHub API/gh CLI | https://github.com/agessaman/meshcore-packet-capture |
| ITEM-prior-art-11 | HIGH | GitHub API/gh CLI | https://github.com/meshcore-dev/meshcore-cli |
| ITEM-prior-art-12 | MEDIUM | WebSearch + README | https://wiki.meshmapper.net/coverage-api/; https://github.com/yellowcooln/meshcore-mqtt-live-map |

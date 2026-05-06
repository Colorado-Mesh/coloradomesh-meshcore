1. EXISTING SOLUTIONS

Open-source options in this space cluster into three groups: static community sites, live RF/network maps, and utility portals. For the site layer, Astro/Starlight-style documentation sites, Vite apps, and Hugo/Jekyll community pages are common. For live maps, the closest patterns are Meshtastic map dashboards, APRS.fi-style node maps, `meshcore-mqtt-live-map`, Traccar, OwnTracks Recorder, Node-RED MQTT dashboards, Grafana geomaps, and Leaflet/MapLibre MQTT viewers. For utilities, Meshtastic web tools, firmware flasher UIs, serial/WebUSB tools, and small calculator/configuration pages are the relevant analogs.

Commercially adjacent products include goTenna Pro, Somewear, Garmin inReach, TAK/ATAK ecosystem tooling, ThingsBoard Cloud, Datacake, Ubidots, HiveMQ Cloud, EMQX Cloud, and hosted Grafana. They solve pieces of fleet visibility, MQTT ingestion, telemetry visualization, or field communications, but they are mostly too enterprise/general-purpose for a Colorado Mesh community site.

Recommendation: treat this as a branded community portal plus a first-class live map and utilities hub. Do not try to become a full IoT platform.

2. RECOMMENDED STACK

Use Astro `5.x` as the site shell, React `19.x` only for interactive islands, TypeScript `5.8+`, Vite `6.x/7.x`, Tailwind CSS `4.x`, and `lucide-react` `0.468+` for icons. Astro is a better fit than Next.js here because most pages should be static, fast, and CDN-friendly, while the map/tools can hydrate independently.

For the map, use MapLibre GL JS `5.x` if vector tiles, richer layers, clustering, and future growth matter. Use Leaflet `1.9.4` only if the imported `meshcore-mqtt-live-map` code is already Leaflet-centric and migration would slow delivery. Use `mqtt`/MQTT.js `5.x`, `zod` `3.24+` or `4.x`, TanStack Query `5.x` where HTTP polling/caching is needed, and `date-fns` `4.x` or native `Intl` for time formatting.

For utilities integration, prefer a package/workspace or copied module boundary over a Git submodule unless the external utilities repo is independently versioned and maintained. Submodules are operational friction for most small teams. If the utilities are mostly static pages, import or port them into an Astro route group. If they are a separate app, embed only as a temporary bridge.

For Docker, use Node `22 LTS`, `pnpm` `10.x`, a multi-stage Dockerfile, and serve static output with Caddy `2.8+` or nginx `1.27+`. For GitHub Releases CD, build and publish an OCI image to GHCR on tags/releases, with semver tags plus `latest`.

Avoid: a monolithic SPA, server-rendered Next.js unless there is real server behavior, runtime-only config baked into source, Docker images that run dev servers, Git submodules as the default integration answer, and map logic coupled directly to page components.

3. ARCHITECTURE

Structure the system around clear boundaries:

`site shell`: Astro pages, layout, navigation, Colorado Mesh branding, static content, SEO, docs, install guides.

`live map module`: isolated interactive app responsible for MQTT connection, node normalization, map rendering, clustering, filters, stale-node handling, and connection state.

`network data layer`: schema validation, topic parsing, timestamp normalization, node identity resolution, coordinate validation, and health summaries. This should be framework-agnostic TypeScript.

`utilities module`: route group for calculators, config tools, firmware/helper tools, and imported utilities from `meshcore-utilities-site`.

`deployment layer`: Dockerfile, compose example, runtime config, health endpoint/static readiness check, GitHub Actions release workflow, GHCR image publishing.

Data flow should be:

MQTT broker topics -> MQTT client or backend bridge -> validated normalized node events -> in-memory client store -> map markers/layers and health summaries.

If MQTT credentials or broker access cannot be safely exposed to browsers, add a small backend/WebSocket bridge. If the broker supports anonymous/public read-only topics, client-side MQTT over WebSocket is simpler and acceptable.

Recommendation: keep map ingestion and normalization independent from rendering. That makes it possible to swap Leaflet/MapLibre later without rewriting MeshCore-specific logic.

4. PITFALLS

The biggest domain mistake is treating radio telemetry like clean web data. Nodes go stale, clocks drift, coordinates can be missing or wrong, duplicate IDs happen, packets arrive out of order, and MQTT reconnect behavior can create misleading UI states. Prevent this with strict schemas, stale thresholds, “last heard” prominence, deduping, and defensive topic parsing.

Do not expose write-capable MQTT credentials in the browser. Use read-only credentials, public telemetry topics, or a backend bridge.

Do not clone the inspiration site too closely. Preserve interaction patterns and information hierarchy, but rebuild the visual system around Colorado Mesh logos, colors, geography, and community goals.

Do not let the live map dominate the whole site. New users need onboarding, hardware guidance, firmware/resources, local procedures, and utilities just as much as telemetry.

Do not use submodules unless the team is comfortable maintaining them. They create common CI, onboarding, and branch-state problems. Prefer vendoring with attribution, npm/workspace packaging, or selective porting.

Do not ship Docker as an afterthought. The container should be the primary artifact, with documented env vars, immutable builds, and release-tagged images.

5. QUESTIONS

Who is the primary audience: new Colorado Mesh users, experienced MeshCore operators, event coordinators, or maintainers?

Is the MQTT broker public, authenticated, read-only, and available over WebSockets?

Should the live map show exact node positions, fuzzed positions, or only opted-in public nodes?

What functionality from `meshcore-utilities-site` is actually valuable enough to preserve?

Is `meshcore.coloradomesh.org` meant to be static-only, or can it run a small backend service?

What are the required release environments: local Docker, GHCR image, staging, production, or all of them?

Should Denver MeshCore be fully renamed/rebranded, or should historical Denver content remain visible?

Who will maintain imported external code after launch?

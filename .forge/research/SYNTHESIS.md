# Research Synthesis

## Status
- Files synthesized: stack.md, pitfalls.md, architecture.md, prior-art.md, codex-analysis.md, PROJECT.md
- Files missing: none
- Overall confidence: HIGH

## Executive Summary
This is a brownfield redesign of the existing Denver MeshCore Next.js site into a Colorado MeshCore public portal at `meshcore.coloradomesh.org`. The proven path is not a greenfield rewrite: preserve the existing Next.js App Router content, SEO, MDX, guides, blog, and community-specific logic, while reworking branding, design tokens, deployment, and external service integration. The local `/Users/cjvana/Downloads/meshcore` prototype should be treated as a visual/product design reference only, not production code.

The recommended architecture is a Docker-primary multi-service system: a Next.js web shell for the public site, a `yellowcooln/meshcore-mqtt-live-map` FastAPI/Leaflet sidecar for live network map and health data, a `Colorado-Mesh/meshcore-utilities-site` Flask sidecar for utilities, and a reverse proxy for TLS, routing, headers, cache rules, and WebSocket upgrades. The Next app should consume only small summaries from the live-map API where needed; it should not keep a competing MQTT/Turso source of truth for live map metrics.

Top risks are integration and deployment risks: treating the map as a React widget, breaking WebSockets through the proxy, losing Netlify security/header behavior during Docker migration, exposing exact node locations without privacy policy, and copying GPL map code into the main app. Mitigate by keeping service boundaries, pinning external images/forks, adding explicit reverse-proxy and release smoke tests, clarifying location/privacy defaults before launch, and documenting license/attribution for map, utilities, and icon assets.

## Key Decisions (resolved by research)

1. Keep the main public shell on the existing Next.js App Router stack rather than rewriting the site in Astro, Flask, or a SPA. (ITEM-stack-1, ITEM-architecture-1, ITEM-prior-art-2)
2. Use Docker as the primary runtime artifact with standalone Next.js output and a multi-stage image. (ITEM-stack-3, ITEM-architecture-3, ITEM-pitfalls-4)
3. Publish the web image to GHCR from GitHub Releases with semver, latest, SHA/metadata labels, and appropriate package permissions. (ITEM-stack-4, ITEM-architecture-4, ITEM-pitfalls-5)
4. Run `yellowcooln/meshcore-mqtt-live-map` as a separate service first; do not port it into React/Next in phase 1. (ITEM-stack-6, ITEM-architecture-2, ITEM-pitfalls-1, ITEM-prior-art-3)
5. Use the live-map service as the authoritative live network state source and retire/de-emphasize current public Turso-backed map/health routes. (ITEM-stack-10, ITEM-architecture-5, ITEM-pitfalls-14)
6. Run `Colorado-Mesh/meshcore-utilities-site` as a separate Flask sidecar first, then selectively port stable pure-client tools later if needed. (ITEM-stack-8, ITEM-architecture-6, ITEM-pitfalls-9, ITEM-prior-art-4)
7. Avoid git submodules as the default integration path for external apps; prefer pinned Docker images or maintained forks. (ITEM-stack-8, ITEM-architecture-7, ITEM-pitfalls-9)
8. Rebuild the design system in Next/Tailwind from the prototype’s art direction rather than copying the prototype source. (ITEM-stack-5, ITEM-architecture-8, ITEM-pitfalls-12, ITEM-prior-art-1)
9. Centralize Colorado Mesh branding, URLs, logos, metadata, and social links in a brand configuration module. (ITEM-architecture-9, ITEM-pitfalls-7)
10. Keep MQTT ingestion and decoding server-side behind the live-map service/API; do not expose broker credentials in browser code. (ITEM-stack-11, ITEM-pitfalls-6)

## Questions for User

### Q-1: Should the live map be hosted on a subdomain or behind a path on `meshcore.coloradomesh.org`?

- **Category:** technical
- **Why it matters:** A subdomain such as `map.meshcore.coloradomesh.org` avoids root-relative asset, service worker, WebSocket, and API path-prefix problems in the live-map app; a path such as `/map` gives a more unified URL but requires more proxy/upstream work.
- **Default recommendation:** Use `https://map.meshcore.coloradomesh.org/` for the live-map service and keep `https://meshcore.coloradomesh.org/map` as a branded entry page.
- **Source refs:** ITEM-architecture-2, ITEM-architecture-3, ITEM-stack-6, ITEM-pitfalls-2
- **Priority:** HIGH

### Q-2: Should utilities be hosted at `tools.meshcore.coloradomesh.org`, reverse-proxied under `/utilities`, or eventually ported into Next.js?

- **Category:** technical
- **Why it matters:** This determines routing, CORS, cookie/session behavior, styling cohesion, and whether implementation focuses on service integration or tool rewrites.
- **Default recommendation:** Keep the existing tools subdomain as a Flask sidecar first, add branded cards/deep links from the Next site, and port only stable naming/prefix tools later.
- **Source refs:** ITEM-stack-8, ITEM-architecture-6, ITEM-pitfalls-9, ITEM-prior-art-4
- **Priority:** HIGH

### Q-3: What are the privacy defaults for node locations, route history, public keys, QR contacts, and share URLs?

- **Category:** risk
- **Why it matters:** The live map can expose exact positions and identifiers; the community needs explicit consent, opt-in/blurred display rules, removal procedures, and stale/manual confidence labeling before launch.
- **Default recommendation:** Default to public infrastructure nodes and opted-in exact locations; blur or hide personal nodes unless explicitly approved; document removal/update process.
- **Source refs:** ITEM-pitfalls-6, ITEM-prior-art-6, ITEM-stack-11
- **Priority:** HIGH

### Q-4: What MQTT broker, topics, credentials, and WebSocket/TCP access will the live-map service use in production?

- **Category:** technical
- **Why it matters:** The map service needs production-safe subscribe-only credentials, broker reachability from Docker, topic patterns, and secret handling. Broker choice also affects whether self-hosted MeshCore-specific auth is needed.
- **Default recommendation:** Configure server-side subscribe-only MQTT credentials as Docker secrets/env vars and keep broker details out of browser code; evaluate `michaelhart/meshcore-mqtt-broker` only if self-hosting is required.
- **Source refs:** ITEM-stack-11, ITEM-prior-art-9, ITEM-pitfalls-1, ITEM-pitfalls-6
- **Priority:** HIGH

### Q-5: Are we allowed to vendor and redistribute Colorado Mesh logo assets from `Colorado-Mesh/icons` in this repo and Docker images?

- **Category:** constraints
- **Why it matters:** The icon repository has no visible license metadata; redistribution in a public website/container should have explicit permission and attribution.
- **Default recommendation:** Get written permission or add an explicit license/attribution note before committing web/PWA logo variants.
- **Source refs:** ITEM-stack-13, ITEM-pitfalls-8, ITEM-prior-art-5, ITEM-architecture-9
- **Priority:** HIGH

### Q-6: What license/compliance strategy should apply if the live-map service is branded, forked, or modified?

- **Category:** risk
- **Why it matters:** `yellowcooln/meshcore-mqtt-live-map` is GPL-3.0. Running it as a separate service is cleaner, but modifications and redistributed images need corresponding source and notices.
- **Default recommendation:** Use a separate service with source attribution; if modified, fork under Colorado Mesh, pin releases, preserve GPL notices, and publish corresponding source for shipped versions.
- **Source refs:** ITEM-stack-7, ITEM-pitfalls-13, ITEM-prior-art-3, ITEM-architecture-7
- **Priority:** HIGH

### Q-7: Which current Denver MeshCore content should be preserved, redirected, renamed, archived, or removed?

- **Category:** scope
- **Why it matters:** The redesign must rebrand to Colorado Mesh without losing useful guides, blog posts, naming standards, SEO value, or historical context.
- **Default recommendation:** Preserve technical guides/blog content, rename visible brand strings to Colorado MeshCore, keep redirects from old Denver URLs, and archive only obsolete pages.
- **Source refs:** ITEM-prior-art-2, ITEM-pitfalls-7, ITEM-architecture-9
- **Priority:** HIGH

### Q-8: Which existing Next.js map, observer, API, Turso, and MQTT collector pieces should be deleted, retained for legacy support, or adapted?

- **Category:** scope
- **Why it matters:** Running the old collector/DB and new live-map in parallel creates conflicting counts, stale thresholds, and health semantics unless there is a deliberate migration window.
- **Default recommendation:** Replace public map/health with live-map data, keep thin Next summary adapters only, and remove/deprecate duplicate collector paths after validation.
- **Source refs:** ITEM-stack-10, ITEM-architecture-5, ITEM-architecture-10, ITEM-pitfalls-14
- **Priority:** HIGH

### Q-9: What health/network metrics should the redesigned home and observer pages display, and how should each be defined?

- **Category:** ux
- **Why it matters:** Polished metrics can mislead users unless every number has a source, time window, freshness threshold, and failure behavior.
- **Default recommendation:** Use live-map `/stats` for live counts, show “last updated” and source notes, avoid composite scores until definitions are approved.
- **Source refs:** ITEM-pitfalls-14, ITEM-architecture-5, ITEM-prior-art-1, ITEM-prior-art-6
- **Priority:** HIGH

### Q-10: What deployment topology should be supported on day one: local Compose only, production Compose with proxy, staging, or all of these?

- **Category:** constraints
- **Why it matters:** The answer determines Docker Compose profiles, reverse-proxy config, environment examples, health checks, release workflow, and smoke-test scope.
- **Default recommendation:** Support local Compose and production Compose with Caddy/Traefik/nginx, plus a minimal staging environment if production credentials differ.
- **Source refs:** ITEM-stack-14, ITEM-architecture-3, ITEM-pitfalls-2, ITEM-pitfalls-3
- **Priority:** HIGH

### Q-11: Which reverse proxy should be used for production routing and security headers?

- **Category:** technical
- **Why it matters:** The proxy owns TLS, host/path routing, WebSocket upgrades, compression, CSP/HSTS/cache migration from Netlify, and optional path-prefix behavior.
- **Default recommendation:** Use Caddy for simpler automatic TLS and WebSocket support unless the production host already standardizes on nginx or Traefik.
- **Source refs:** ITEM-architecture-3, ITEM-stack-14, ITEM-pitfalls-2, ITEM-pitfalls-3
- **Priority:** MEDIUM

### Q-12: Should the project standardize on Node 24 LTS or a more conservative Node 22 LTS for web Docker/CI?

- **Category:** technical
- **Why it matters:** Stack research recommends Node 24 LTS for longer support, while supplemental Codex notes suggested Node 22. The plan needs one runtime baseline for Dockerfiles, CI, and engines.
- **Default recommendation:** Use Node 24 LTS unless dependency testing exposes a blocker; document fallback to Node 22 if needed.
- **Source refs:** ITEM-stack-2, codex-analysis
- **Priority:** MEDIUM

### Q-13: Do we need MeshMapper coverage, weather, LOS, route history, QR contacts, or official map embedding at launch?

- **Category:** scope
- **Why it matters:** The live-map app supports many advanced features, but coverage APIs may require credentials/rate-limit handling and some layers may introduce privacy or UI complexity.
- **Default recommendation:** Launch with core live nodes/routes/status first; enable LOS/history if already provided by live-map; defer coverage until MeshMapper credentials and UX copy are ready.
- **Source refs:** ITEM-prior-art-3, ITEM-prior-art-6, ITEM-prior-art-12, ITEM-pitfalls-6
- **Priority:** MEDIUM

### Q-14: What browser support and fallback behavior is required for serial USB utilities?

- **Category:** ux
- **Why it matters:** Web Serial requires HTTPS/trusted localhost, user activation, supported browsers, permissions policy, and disconnect/error handling.
- **Default recommendation:** Feature-detect Web Serial, provide unsupported-browser instructions, require explicit connect clicks, and isolate serial permissions to the tools service/page.
- **Source refs:** ITEM-pitfalls-10, ITEM-prior-art-4, ITEM-prior-art-11
- **Priority:** MEDIUM

### Q-15: Who will maintain forks/pinned versions of the live-map, utilities, and icons after launch?

- **Category:** constraints
- **Why it matters:** Sidecar integration reduces rewrite risk but creates version pinning, security patch, licensing, and upstream merge responsibilities.
- **Default recommendation:** Assign a maintainer and pin each external dependency to a release/commit; add a quarterly update review checklist.
- **Source refs:** ITEM-stack-6, ITEM-stack-7, ITEM-stack-8, ITEM-architecture-7, ITEM-prior-art-3, ITEM-prior-art-4
- **Priority:** MEDIUM

## Technical Direction

### Stack

- Main web app: existing Next.js 16 App Router, React 19, TypeScript, local MDX, and Tailwind CSS v4. Keep server components as the default and isolate interactive/browser-only UI as client components. (ITEM-stack-1, ITEM-stack-5, ITEM-stack-12, ITEM-architecture-1)
- Runtime: standardize Docker/CI on Node 24 LTS unless compatibility tests force Node 22. Use `output: 'standalone'` for the production image. (ITEM-stack-2, ITEM-stack-3)
- Deployment: multi-stage Dockerfile for Next.js, non-root runtime user, explicit env vars, GHCR release workflow, and Docker Compose topology with reverse proxy. (ITEM-stack-3, ITEM-stack-4, ITEM-stack-14)
- Live map: sidecar FastAPI/Leaflet `meshcore-mqtt-live-map`; Next links/embeds and consumes `/stats` or `/api/nodes` summaries only. (ITEM-stack-6, ITEM-stack-11, ITEM-architecture-2, ITEM-architecture-5)
- Utilities: sidecar Flask/Python `meshcore-utilities-site`, preferably patched to current safe Python/Flask versions if forked and tested. (ITEM-stack-8, ITEM-stack-9, ITEM-architecture-6)
- Assets: vendor selected Colorado Mesh icon assets into `public/brand/` after license/permission confirmation; do not hotlink GitHub assets. (ITEM-stack-13, ITEM-architecture-9)

Supplemental Codex analysis suggested Astro/MapLibre as a possible greenfield static-site approach, but the codebase-specific research strongly favors preserving Next.js because the repository already has App Router, MDX, API routes, metadata, and existing content.

### Architecture

The architecture should be service composition, not code fusion:

- `web`: Next.js public shell, content, guides, blog, SEO, navigation, design system, branded map/tools entry pages, thin summary/health API adapters.
- `meshmap`: FastAPI live-map service owning MQTT ingestion, decoding, live state, WebSockets, routes, LOS/weather/coverage/history, and `/data` persistence.
- `utilities`: Flask utilities service owning repeater/companion naming, prefix matrix, serial console, contacts, and Python `coloradomesh` package logic.
- `reverse-proxy`: TLS, host/path routing, WebSocket upgrades, migrated security headers/redirects/cache rules, compression, and optional CSP handling.
- `release`: GitHub Actions release workflow building/pushing the web image to GHCR; external services should use pinned upstream images or separately built fork images.

Recommended URL shape:

- `https://meshcore.coloradomesh.org/` — Next.js shell.
- `https://meshcore.coloradomesh.org/map` — Colorado-branded intro/entry route.
- `https://map.meshcore.coloradomesh.org/` — live-map service root, recommended.
- `https://tools.meshcore.coloradomesh.org/` — utilities service root, recommended.

### Prior Art to Leverage

- Local design prototype: use as visual/product spec for palette, typography, mountain/topo motifs, operational panels, utility cards, and map/observer page layout; do not copy runtime code or mock data. (ITEM-prior-art-1)
- Existing site: preserve content, SEO, MDX/blog/guides, community naming logic, and current technical context where still valid. (ITEM-prior-art-2)
- `yellowcooln/meshcore-mqtt-live-map`: use as primary live map engine and live data source. (ITEM-prior-art-3)
- `Colorado-Mesh/meshcore-utilities-site`: use as authoritative utilities behavior and service boundary. (ITEM-prior-art-4)
- `Colorado-Mesh/icons`: use as canonical Colorado Mesh logo source after permission/license confirmation. (ITEM-prior-art-5)
- Official MeshCore map/blog: borrow UX patterns for freshness colors, duplicate filtering, QR contacts, public-key links, share URLs, and coordinate copy. (ITEM-prior-art-6)
- MeshCore broker/capture/CLI projects: use as references for broker auth, observer setup documentation, and serial command conventions, not as web app code. (ITEM-prior-art-9, ITEM-prior-art-10, ITEM-prior-art-11)
- MeshMapper coverage API: configure through live-map if credentials exist; do not build a custom coverage layer first. (ITEM-prior-art-12)

## Detailed Planning Implications

1. Begin with brand/config foundations: add central brand constants for `SITE_NAME`, `BASE_URL`, social URLs, GitHub org, Discord, logo paths, and region labels; replace Denver references systematically and add a grep check for unintended legacy strings. (ITEM-architecture-9, ITEM-pitfalls-7)
2. Convert the visual prototype into reusable Next/Tailwind primitives before page rewrites: `BrandHeader`, `LiveStatusPill`, `MetricStrip`, `TopoBackground`, `MountainSilhouette`, `SectionEyebrow`, `ToolCard`, and `NetworkPanel`. (ITEM-stack-5, ITEM-architecture-8)
3. Containerize the existing Next site early: configure Next standalone output, write a multi-stage Dockerfile, add `.dockerignore`, non-root runtime, explicit env vars, and a local container smoke test. (ITEM-stack-3, ITEM-pitfalls-4)
4. Add Docker Compose with `web`, `meshmap`, `utilities`, and `proxy` services. Include health checks, persistent live-map volumes, and documented env examples. (ITEM-stack-14, ITEM-architecture-3)
5. Decide and implement routing before UI integration. Prefer live-map and utilities subdomains; if path routing is required, allocate explicit work for static asset paths, service workers, API prefixes, and WebSocket upgrade config. (ITEM-architecture-2, ITEM-pitfalls-2)
6. Add thin Next server adapters only after the live-map service is reachable: `/api/network-summary` and `/api/site-health` are acceptable; MQTT decoding and route history are not. (ITEM-architecture-10, ITEM-stack-11)
7. Replace current public `/map`, `NetworkMap`, `NetworkHealthCard`, `/api/nodes`, `/api/stats`, `/api/health`, and `services/mqtt-collector` usage in staged steps with validation against live-map stats before removal. (ITEM-architecture-5, ITEM-pitfalls-14)
8. Migrate Netlify-specific security headers, redirects, and cache rules into the reverse proxy and/or Next responses; verify with `curl -I` against containers and include CSP support for map WebSocket/tile/static origins. (ITEM-pitfalls-3)
9. Add GitHub Release CD as a separate workflow from CI: GHCR login, metadata tags, Buildx, package permissions, optional attestations, and release-only trigger. (ITEM-stack-4, ITEM-pitfalls-5)
10. Gate public launch on privacy and licensing decisions: node location policy, icon usage permission, GPL map service attribution/source, utilities license/ownership, and public documentation. (ITEM-pitfalls-6, ITEM-pitfalls-8, ITEM-pitfalls-13)
11. Treat Web Serial utilities as progressive enhancement: feature detection, secure context, click-to-connect, permissions-policy, unsupported-browser fallback, and device disconnect handling. (ITEM-pitfalls-10)
12. Verification should include: Next build, Docker build, Compose up, proxy route checks, WebSocket `101` smoke test, network summary endpoint fallback behavior, no banned Denver strings, no mock stats on production pages, and header/CSP checks. (ITEM-pitfalls-2, ITEM-pitfalls-3, ITEM-pitfalls-7, ITEM-pitfalls-12)

## Risk Register

| Risk | Severity | Mitigation | Source refs |
|------|----------|------------|-------------|
| Treating live-map as a drop-in React widget | CRITICAL | Run as sidecar; integrate via subdomain/proxy/API; preserve WebSocket, MQTT secrets, `/data` volumes | ITEM-pitfalls-1, ITEM-stack-6, ITEM-architecture-2 |
| WebSockets fail behind reverse proxy | CRITICAL | Configure upgrade headers/timeouts; add production smoke test for `101 Switching Protocols` | ITEM-pitfalls-2 |
| Netlify headers/redirects/cache lost in Docker | CRITICAL | Port Netlify config into proxy/Next; test headers with containers; update CSP for map/tools origins | ITEM-pitfalls-3 |
| Privacy exposure from exact locations/routes/keys | CRITICAL | Define opt-in/blur rules, stale confidence, public data policy, removal process | ITEM-pitfalls-6 |
| GPL live-map copied into main app without strategy | CRITICAL | Keep service boundary; if modified, fork and publish corresponding source/notices | ITEM-pitfalls-13, ITEM-stack-7 |
| Bloated or broken Next container | MODERATE | Use standalone output, multi-stage build, non-root runtime, explicit env vars | ITEM-pitfalls-4, ITEM-stack-3 |
| GHCR release workflow fails or produces ambiguous images | MODERATE | Use release trigger, permissions, Docker metadata/action tags, labels, optional attestations | ITEM-pitfalls-5, ITEM-stack-4 |
| Denver branding remains in metadata/content/assets | MODERATE | Central brand module; systematic replacement; CI grep guard | ITEM-pitfalls-7, ITEM-architecture-9 |
| Icon/logo rights unclear | MODERATE | Get written permission/license; vendor with attribution | ITEM-pitfalls-8, ITEM-stack-13 |
| Utilities submodule creates app/library mismatch | MODERATE | Run Flask as sidecar; pin image/fork; port only stable tools later | ITEM-pitfalls-9, ITEM-stack-8 |
| Web Serial fails for unsupported browsers or insecure contexts | MODERATE | Feature detection, HTTPS, user activation, fallback instructions, scoped permissions policy | ITEM-pitfalls-10 |
| Hydration/runtime errors from browser-only map/serial code | MODERATE | Keep browser APIs in client components and `useEffect`; dynamic import with SSR disabled where needed | ITEM-pitfalls-11 |
| Prototype mock data accidentally ships | MODERATE | Reimplement design primitives; replace mock stats with real sources or explicit placeholders | ITEM-pitfalls-12 |
| Network health metric definitions drift | MODERATE | Define source/time window/freshness/failure behavior; validate live-map vs legacy during migration | ITEM-pitfalls-14 |

## Conflicts & Tradeoffs

1. **Next.js vs Astro shell:** Supplemental Codex analysis recommended Astro for a mostly static portal, but stack/architecture research recommends keeping Next.js because the current repo already has App Router, MDX, API routes, metadata, and SEO/content infrastructure. Decision: keep Next.js. (codex-analysis vs ITEM-stack-1, ITEM-architecture-1, ITEM-prior-art-2)
2. **Node 22 vs Node 24:** Supplemental Codex analysis suggested Node 22 LTS, while stack research recommends Node 24 LTS because Node 20 is EOL and Node 24 is the current Active LTS line in 2026. Decision: prefer Node 24 unless dependency testing blocks it. (codex-analysis vs ITEM-stack-2)
3. **MapLibre/Leaflet component map vs live-map sidecar:** Supplemental Codex discussed MapLibre/Leaflet choices for an in-app map module, but the external live-map is already a Leaflet/FastAPI service with richer MeshCore functionality. Decision: sidecar first; no MapLibre migration in phase 1. (codex-analysis vs ITEM-stack-6, ITEM-architecture-2, ITEM-prior-art-3)
4. **Path routing vs subdomain routing for live map:** Stack research says reverse proxying under `/map` or `/live-map` is possible, while architecture highlights root-relative live-map paths and recommends a subdomain. Decision: subdomain default; path routing only if user requires unified URL. (ITEM-stack-6, ITEM-stack-14 vs ITEM-architecture-2)
5. **Submodule vs service/fork for utilities:** Prior-art notes mention a submodule as one practical integration option, but stack, architecture, and pitfalls research recommend avoiding submodules for app-shaped Flask utilities. Decision: sidecar/pinned image/fork first; no submodule unless release engineering explicitly requires source checkout. (ITEM-prior-art-4 vs ITEM-stack-8, ITEM-architecture-7, ITEM-pitfalls-9)
6. **Browser-direct MQTT vs server-side ingestion:** Supplemental Codex notes say browser MQTT can be acceptable for public read-only topics, while stack/pitfalls recommend server-side ingestion to keep credentials and broker topology out of client code. Decision: use live-map server-side ingestion and WebSocket/API fan-out. (codex-analysis vs ITEM-stack-11, ITEM-pitfalls-1, ITEM-pitfalls-6)

## Confidence Assessment

| Dimension | Status | Confidence | Notes |
|-----------|--------|------------|-------|
| stack | complete | HIGH | Strong codebase-specific recommendations for Next.js, Node, Docker, GHCR, sidecars, MDX, Tailwind |
| pitfalls | complete | HIGH | Detailed deployment, privacy, licensing, WebSocket, branding, and hydration risks with mitigations |
| architecture | complete | HIGH | Clear service boundaries, URL shape, sidecar strategy, thin Next API guidance |
| prior-art | complete | HIGH | Extensive comparison of local prototype, existing site, live-map, utilities, icons, official MeshCore tooling |
| codex-analysis | complete | MEDIUM | Optional supplemental research only; useful for alternatives but conflicts with codebase-specific Next.js direction |

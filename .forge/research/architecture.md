# Architecture Research: Colorado MeshCore Site Redesign

Checked: 2026-05-05

Project context: brownfield Next.js site at `/Users/cjvana/Documents/GitHub/denvermc-org`, redesign inspired by `/Users/cjvana/Downloads/meshcore`, public URL `meshcore.coloradomesh.org`, Docker-primary deployment, Colorado Mesh branding, external live-map and utilities integration.

### ITEM-architecture-1: Keep Next.js as the primary Colorado MeshCore shell

- **Recommendation:** Keep the existing Next.js App Router app as the main public site and restructure it into clear route groups: `(home)`, `(network)`, `(guides)`, `(blog)`, and `(utilities)`. Use Server Components for mostly-static marketing, guides, and MDX content; isolate interactive pieces as Client Components.
- **Rationale:** The current repo is already a Next.js/Tailwind/MDX app with App Router pages, metadata, JSON-LD, blog content, and components. Next.js guidance explicitly supports `src/app`, route groups, colocated route-specific files, and keeping pages/layouts server-rendered by default while using Client Components only where state, browser APIs, or third-party interactive libraries are required. This fits a hybrid site where most pages are content-heavy, but map/tools need client interactivity.
- **Confidence:** HIGH
- **Source:** Official docs — https://nextjs.org/docs/app/getting-started/project-structure; https://nextjs.org/docs/app/getting-started/server-and-client-components
- **Checked:** 2026-05-05
- **Alternatives rejected:** Rewriting the whole site in Flask or copying the local design canvas directly would discard existing Next.js SEO/content infrastructure. Making the root layout a Client Component would bloat the client bundle and violate current Next.js guidance.

### ITEM-architecture-2: Treat the yellowcooln live map as a sidecar service, not a React component rewrite

- **Recommendation:** Replace the current `/map` and observer/health UI by deploying `yellowcooln/meshcore-mqtt-live-map` as an independent Docker service and linking or embedding it from the Next.js shell. Prefer a dedicated subdomain such as `map.meshcore.coloradomesh.org` or `live.meshcore.coloradomesh.org`; keep `/map` in Next.js as the Colorado-branded entry page that links/embeds the live service.
- **Rationale:** The live-map project is a complete FastAPI + Leaflet + WebSocket + MQTT application with its own state files, route history, line-of-sight tools, weather/coverage overlays, PWA assets, and `/api/nodes`, `/stats`, `/snapshot`, `/ws`, `/los`, `/peers/{id}` endpoints. Its frontend currently uses absolute paths like `/static/styles.css`, `/static/app.js`, `/ws`, `/snapshot`, and `/sw.js`, making subpath hosting behind `/map` possible only with careful proxy rules or upstream patches. A sidecar service minimizes rewrite risk and gives the project its strongest feature set immediately.
- **Confidence:** HIGH
- **Source:** GitHub — https://github.com/yellowcooln/meshcore-mqtt-live-map; repo docs `ARCHITECTURE.md` and `README.md` inspected via GitHub CLI
- **Checked:** 2026-05-05
- **Alternatives rejected:** Reimplementing live routing, decoder integration, LOS, history, and WebSockets inside the current Next/Turso app would duplicate an actively maintained project. Git-submodule-importing it into `src/components` is not viable because it is Python/FastAPI plus plain JS, not a React package.

### ITEM-architecture-3: Use Docker Compose as the local and production topology boundary

- **Recommendation:** Make Docker the primary architecture unit: `web` (Next.js standalone), `meshmap` (FastAPI live-map image or fork build), optional `utilities` (Flask tools), and a reverse proxy (`caddy`, `nginx`, or `traefik`) that routes hostnames/subdomains. Add health checks and shared environment examples, but avoid sharing application state volumes between services except through explicit HTTP APIs.
- **Rationale:** The project requirement is Docker-primary. Next.js supports `output: 'standalone'`, which creates a minimal `.next/standalone` server plus traced runtime files; Docker multi-stage builds are the standard way to keep build tools out of production images. The map and utilities projects already have Dockerfiles/compose files, so the least-risk structure is service composition rather than code fusion.
- **Confidence:** HIGH
- **Source:** Official docs — https://nextjs.org/docs/app/api-reference/config/next-config-js/output; https://docs.docker.com/build/building/multi-stage/
- **Checked:** 2026-05-05
- **Alternatives rejected:** Netlify-only deployment conflicts with Docker-primary. A single container running Next.js, FastAPI, Flask, and MQTT consumers under one process supervisor would make logging, updates, restarts, and vulnerability ownership harder.

### ITEM-architecture-4: Publish Docker images from GitHub Releases to GHCR

- **Recommendation:** Add release-triggered CD that builds and pushes the Next.js site image to GitHub Container Registry (`ghcr.io/colorado-mesh/...`) on published GitHub Releases. If the project forks or vendors the live-map/utilities apps, build those as separate images rather than packing them into the web image.
- **Rationale:** GitHub’s Docker publishing workflow recommends release or branch triggers, registry login, Docker metadata-derived tags/labels, Buildx build/push, and optional attestations. Separate images preserve service boundaries and make it possible to roll back only the web shell or only the map/tools service.
- **Confidence:** HIGH
- **Source:** Official docs — https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-docker-images
- **Checked:** 2026-05-05
- **Alternatives rejected:** Building images manually on the server is not repeatable. Publishing only `latest` without release tags makes rollbacks ambiguous. Pushing a monolithic image containing unrelated runtimes defeats the service architecture.

### ITEM-architecture-5: Consolidate live network data around the live-map API

- **Recommendation:** Retire the current UI dependency on `src/app/api/nodes`, `src/app/api/stats`, `src/app/api/health`, `NetworkMap`, `NetworkHealthCard`, and `services/mqtt-collector` for public map/health experiences. Use the live-map service as the live-data source, and have the Next shell consume only small server-side summaries from the map’s `/stats` or `/api/nodes` endpoints for nav badges and homepage stat strips.
- **Rationale:** The current repo maintains a Turso-backed data model and MQTT collector, but the required replacement map already subscribes to MQTT, decodes packets, stores runtime state, streams WebSockets, and exposes node/stats APIs. Running both collectors would create inconsistent node counts, online logic, retention rules, and route interpretation. A read-only boundary from Next to live-map keeps responsibilities clear: Next is content/brand/navigation; live-map is realtime network state.
- **Confidence:** HIGH
- **Source:** Codebase — `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/nodes/route.ts`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`, `/Users/cjvana/Documents/GitHub/denvermc-org/services/mqtt-collector/src/index.ts`; GitHub — https://github.com/yellowcooln/meshcore-mqtt-live-map
- **Checked:** 2026-05-05
- **Alternatives rejected:** Keeping the Turso collector as a parallel source of truth would produce drift. Proxying every live-map API through Next.js would add latency and failure modes without adding value.

### ITEM-architecture-6: Integrate Colorado Mesh utilities as a separate app first, then selectively port stable client-side tools

- **Recommendation:** Deploy `Colorado-Mesh/meshcore-utilities-site` as its own Docker service initially, reachable from the new site’s Utilities navigation. Prefer subdomain hosting (`tools.meshcore.coloradomesh.org`) or reverse proxying under `/utilities` because the Flask app has `ProxyFix` and `APPLICATION_ROOT` support. Replace current Next tools with links/embeds to this service where appropriate; only port specific pure-client tools into Next after behavior and data contracts stabilize.
- **Rationale:** The utilities repo is a Flask app with blueprints for repeater namer, companion namer, prefix matrix, serial USB command console, `/contacts`, Dockerfile, and compose support. It is not currently packaged as a reusable JS/React library. Running it as a service preserves upstream behavior and reduces the redesign scope. Later, the naming and prefix tools can be ported into Next for unified UI, while serial/USB workflows may remain better isolated.
- **Confidence:** HIGH
- **Source:** GitHub — https://github.com/Colorado-Mesh/meshcore-utilities-site; repo `README.md`, `app.py`, `Dockerfile`, and templates inspected via GitHub CLI
- **Checked:** 2026-05-05
- **Alternatives rejected:** A git submodule under `src/` would not make Flask routes usable inside Next.js. A wholesale rewrite risks changing setup logic users depend on. Vendoring without license clarity is risky because the utilities repo currently reports no GitHub license metadata.

### ITEM-architecture-7: Avoid git submodules for external apps unless the deployment intentionally builds from source

- **Recommendation:** Prefer released Docker images or maintained forks for live-map and utilities integration. If source-level changes are required, use a Colorado-Mesh fork and build that service image explicitly. Use git subtree or vendored snapshots only for small static assets or code that must be edited in this repo; avoid submodules for production-critical services unless the team accepts the workflow overhead.
- **Rationale:** Git submodules store only a commit pointer, require `--recurse-submodules` or explicit initialization, often leave contributors in detached HEAD, and require parent commits to update pointers. That overhead is tolerable for tightly controlled source builds, but unnecessary when the external projects already have Docker runtime boundaries. The live-map project is GPL-3.0, so keeping it as a separate service with source attribution is cleaner than copying code into the Next app.
- **Confidence:** HIGH
- **Source:** Official docs — https://git-scm.com/book/en/v2/Git-Tools-Submodules; GitHub — https://github.com/yellowcooln/meshcore-mqtt-live-map
- **Checked:** 2026-05-05
- **Alternatives rejected:** A submodule sounds lightweight but creates CI and contributor failure modes. Copy-pasting the live-map source into this repo would couple licensing, release cadence, and Python/JS tooling to the web shell.

### ITEM-architecture-8: Build a Colorado Mesh design system from the local inspiration, not from copied JSX

- **Recommendation:** Translate `/Users/cjvana/Downloads/meshcore/screens.jsx` into reusable Next/Tailwind design primitives: `BrandHeader`, `LiveStatusPill`, `MetricStrip`, `TopoBackground`, `MountainSilhouette`, `SectionEyebrow`, `ToolCard`, and `NetworkPanel`. Keep the visual language (night navy, mesh teal, sunset orange, mono network labels, Front Range motifs) while reauthoring components and content for Colorado Mesh.
- **Rationale:** The local example is a design-canvas/prototype with inline styles, synthetic data, random map dots, and direct `public/logo-512.png` paths. It is excellent as art direction but not production architecture. The current repo already has Tailwind v4 design tokens and reusable components, so the right move is to formalize the visual vocabulary into maintainable CSS tokens and components.
- **Confidence:** HIGH
- **Source:** Local example — `/Users/cjvana/Downloads/meshcore/screens.jsx`; Codebase — `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/globals.css`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Directly copying the prototype would import inline styles, fake data, and non-responsive artboard assumptions. Keeping the current Denver branding tokens without a design-system pass would make the redesign feel inconsistent.

### ITEM-architecture-9: Centralize branding and public URL metadata

- **Recommendation:** Replace hard-coded Denver identity with a small brand configuration module (`src/lib/brand.ts` or expanded `constants.ts`) containing `SITE_NAME`, `BASE_URL`, social metadata, Discord URL, GitHub org URL, logo paths, and mesh region labels. Copy web-appropriate Colorado Mesh logo assets into `public/brand/` with attribution to the icons repo, and update app icons/manifest/OG images from that source.
- **Rationale:** The current repo still has hard-coded `BASE_URL = 'https://denvermc.com'`, `SITE_NAME = 'Denver MeshCore'`, Denver social metadata, and Denver nav/content strings. The icons repo contains official Colorado Mesh icon assets but is not a runtime package. A central brand module prevents drift across metadata, JSON-LD, manifest, nav, footer, and Open Graph images.
- **Confidence:** HIGH
- **Source:** Codebase — `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/constants.ts`, `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/layout.tsx`; GitHub — https://github.com/Colorado-Mesh/icons
- **Checked:** 2026-05-05
- **Alternatives rejected:** Fetching logo assets from GitHub at runtime is fragile and slower. Scattering string replacements across pages will regress when new content is added.

### ITEM-architecture-10: Use thin Next API routes only as aggregation/adaptation edges

- **Recommendation:** Keep Next.js API routes only for site-specific aggregation, such as `/api/network-summary` fetching live-map `/stats`, `/api/site-health` checking sidecar availability, or sitemap/feed generation. Do not put MQTT subscription, packet decoding, route history, or serial-device control inside Next route handlers.
- **Rationale:** Next route handlers are appropriate for small server-side adapters close to the web UI. The live-map and utilities applications already own long-running MQTT/WebSocket/serial concerns. Keeping those out of Next avoids lifecycle mismatch and makes horizontal scaling clearer.
- **Confidence:** MEDIUM
- **Source:** Official docs — https://nextjs.org/docs/app/getting-started/server-and-client-components; Codebase — `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Turning Next.js into the realtime backend would duplicate FastAPI functionality. Having browsers call every sidecar directly from many places would make auth, error handling, and CORS inconsistent.

## Proposed component/service boundaries

- `web` / Next.js:
  - Public content, guides, blog, SEO, nav/footer, Colorado Mesh design system.
  - Static pages and MDX remain server-rendered.
  - Client islands only for menu, copied widgets, small tool wrappers, and embedded sidecar views.
  - Optional thin APIs: network summary, sidecar health checks.
- `meshmap` / FastAPI live map:
  - MQTT subscription, MeshCore decoding, live node state, routes, WebSocket broadcast, route history, LOS/weather/coverage overlays.
  - Mounted preferably on a subdomain.
- `utilities` / Flask utilities:
  - Repeater/companion naming, prefix matrix, serial USB command console, contacts JSON.
  - Mounted on tools subdomain or `/utilities` with `APPLICATION_ROOT` if proxying under a path.
- `reverse-proxy`:
  - TLS, host routing, security headers, compression, WebSocket upgrade handling.
- External assets:
  - Colorado Mesh icons copied into `public/brand/` at build-time or committed as static assets with attribution.

## Recommended URL shape

- `https://meshcore.coloradomesh.org/` — Next.js shell.
- `https://meshcore.coloradomesh.org/map` — branded intro/entry route, possibly iframe/embed if acceptable.
- `https://map.meshcore.coloradomesh.org/` — live-map service root (recommended default).
- `https://tools.meshcore.coloradomesh.org/` — utilities service root (already aligned with existing tools host).

If subdomains are not acceptable, budget explicit proxy/path-prefix work for live-map because of its root-relative static, WebSocket, service worker, and API paths.

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-architecture-1 | HIGH | Official docs | https://nextjs.org/docs/app/getting-started/project-structure; https://nextjs.org/docs/app/getting-started/server-and-client-components |
| ITEM-architecture-2 | HIGH | GitHub | https://github.com/yellowcooln/meshcore-mqtt-live-map |
| ITEM-architecture-3 | HIGH | Official docs | https://nextjs.org/docs/app/api-reference/config/next-config-js/output; https://docs.docker.com/build/building/multi-stage/ |
| ITEM-architecture-4 | HIGH | Official docs | https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-docker-images |
| ITEM-architecture-5 | HIGH | Codebase/GitHub | `/Users/cjvana/Documents/GitHub/denvermc-org/services/mqtt-collector/src/index.ts`; https://github.com/yellowcooln/meshcore-mqtt-live-map |
| ITEM-architecture-6 | HIGH | GitHub | https://github.com/Colorado-Mesh/meshcore-utilities-site |
| ITEM-architecture-7 | HIGH | Official docs/GitHub | https://git-scm.com/book/en/v2/Git-Tools-Submodules; https://github.com/yellowcooln/meshcore-mqtt-live-map |
| ITEM-architecture-8 | HIGH | Local example/Codebase | `/Users/cjvana/Downloads/meshcore/screens.jsx`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/globals.css` |
| ITEM-architecture-9 | HIGH | Codebase/GitHub | `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/constants.ts`; https://github.com/Colorado-Mesh/icons |
| ITEM-architecture-10 | MEDIUM | Official docs/Codebase | https://nextjs.org/docs/app/getting-started/server-and-client-components; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/` |

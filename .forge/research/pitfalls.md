# Pitfalls Research — Colorado MeshCore Site Redesign

Project context: Brownfield Next.js site redesign for `meshcore.coloradomesh.org`, inspired by `/Users/cjvana/Downloads/meshcore`, rebranded to Colorado Mesh, Docker-primary deployment, GH Release Docker CD, live map replacement from `yellowcooln/meshcore-mqtt-live-map`, and utilities integration from `Colorado-Mesh/meshcore-utilities-site`.

### ITEM-pitfalls-1: Treating the live map as a drop-in React widget

- **What goes wrong:** The current `/map` page is a client-only React Leaflet component that polls `/api/nodes`; the requested replacement is a standalone FastAPI/static Leaflet app with MQTT ingestion and WebSocket fan-out. A direct port into `NetworkMap.tsx` would either lose route/history/coverage features or expose MQTT/security configuration to the browser.
- **Root cause:** `meshcore-mqtt-live-map` has a different runtime model: Python FastAPI backend, static JS frontend, MQTT subscriber, WebSocket endpoint, persistent `/data`, and Docker Compose. The existing site has a Next.js API/database polling model and no WebSocket reverse proxy layer.
- **Prevention:** Run the map as a separate container/service and integrate it by reverse proxy or subdomain first. If the Next.js site needs data, create a server-side proxy/adapter API that calls the map service; do not copy its static frontend into a Next component until the data contract is documented. Preserve WebSocket upgrade support for `/ws`, persistent volumes for `/data`, and server-side secrets for MQTT and production tokens.
- **Severity:** CRITICAL
- **Phase relevance:** Architecture and deployment planning before UI replacement
- **Confidence:** HIGH
- **Source:** WebFetch + Codebase — https://github.com/yellowcooln/meshcore-mqtt-live-map; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/map/page.tsx`
- **Checked:** 2026-05-05

### ITEM-pitfalls-2: Breaking WebSockets behind Docker/reverse proxy

- **What goes wrong:** The live map works locally but browsers show stale markers or reconnect loops in production because the reverse proxy serves HTTP pages but does not tunnel WebSocket upgrades to the FastAPI backend.
- **Root cause:** WebSocket `Upgrade` and `Connection` are hop-by-hop headers; proxies such as NGINX do not forward them automatically. The target map depends on browser WebSocket output, while the existing repo has no Docker/proxy config and current deployment is Netlify-oriented.
- **Prevention:** Put WebSocket behavior in the deployment acceptance criteria. If using NGINX/Caddy/Traefik, explicitly configure WebSocket upgrade headers and long read timeouts for the map service. Add a production smoke test that opens the map and verifies the WebSocket reaches `101 Switching Protocols`.
- **Severity:** CRITICAL
- **Phase relevance:** Docker compose, reverse proxy, and release validation
- **Confidence:** HIGH
- **Source:** Official docs + Codebase — https://nginx.org/en/docs/http/websocket.html; `/Users/cjvana/Documents/GitHub/denvermc-org` Docker file inspection found no Dockerfile/Compose; `/Users/cjvana/Documents/GitHub/denvermc-org/netlify.toml`
- **Checked:** 2026-05-05

### ITEM-pitfalls-3: Losing security headers, cache rules, and redirects when moving from Netlify to Docker

- **What goes wrong:** The Docker deployment launches successfully but lacks the site’s current HSTS/CSP/cache/redirect behavior because `netlify.toml`, `public/_headers`, and `public/_redirects` are not interpreted by a plain Next.js container.
- **Root cause:** The current repo is configured around Netlify’s build plugin and header/redirect files. Docker-primary deployment requires those concerns to move into Next.js middleware/route config, reverse proxy config, or container platform config.
- **Prevention:** Treat Netlify config as migration input, not deployment config. Port headers and redirects into the Docker ingress layer or Next.js responses, then test with `curl -I` against the container. Keep CSP current for new map endpoints, WebSocket endpoints, tile servers, Colorado Mesh assets, and any serial tooling pages.
- **Severity:** CRITICAL
- **Phase relevance:** Deployment hardening before public cutover
- **Confidence:** HIGH
- **Source:** Codebase + Official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/netlify.toml`; `/Users/cjvana/Documents/GitHub/denvermc-org/public/_headers`; `/Users/cjvana/Documents/GitHub/denvermc-org/public/_redirects`; https://nextjs.org/docs/app/getting-started/deploying
- **Checked:** 2026-05-05

### ITEM-pitfalls-4: Shipping a non-standalone or bloated Next.js container

- **What goes wrong:** Docker images are large, slow to start, or fail in production because the app uses `next start` with full `node_modules`, omits required runtime files, or assumes Netlify’s runtime plugin behavior.
- **Root cause:** The repo has `next.config.js` with no `output: 'standalone'`, no Dockerfile, and no Docker release workflow. Official Next.js Docker guidance recommends standalone output for minimal production containers.
- **Prevention:** Add `output: 'standalone'`, build a multi-stage Dockerfile around `.next/standalone`, copy `.next/static` and `public`, run as a non-root user, and make environment variables explicit. Keep local development outside Docker unless needed, but make release artifacts Docker-first.
- **Severity:** MODERATE
- **Phase relevance:** Containerization and CI/CD implementation
- **Confidence:** HIGH
- **Source:** Official docs + Codebase — https://nextjs.org/docs/app/getting-started/deploying; https://docs.docker.com/guides/nextjs/containerize/; `/Users/cjvana/Documents/GitHub/denvermc-org/next.config.js`; `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`
- **Checked:** 2026-05-05

### ITEM-pitfalls-5: Publishing Docker images on release without provenance, tags, or permissions

- **What goes wrong:** GitHub Releases are created but no usable container is published, images have inconsistent tags, or GHCR publish fails with permissions errors. Downstream users cannot tell which image matches which release.
- **Root cause:** The repo currently has CI/security workflows but no release-triggered Docker publish workflow. GHCR publishing needs explicit workflow permissions, registry login, metadata-driven tags, and ideally artifact attestations.
- **Prevention:** Add a release workflow using `on: release: types: [published]`, `packages: write`, `attestations: write`, `id-token: write`, `docker/metadata-action`, and `docker/build-push-action`. Pin actions to SHAs for supply-chain hygiene and tag images with semver and digest-backed metadata.
- **Severity:** MODERATE
- **Phase relevance:** CD implementation before first release
- **Confidence:** HIGH
- **Source:** Official docs + Codebase — https://docs.github.com/en/actions/publishing-packages/publishing-docker-images; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/security.yml`
- **Checked:** 2026-05-05

### ITEM-pitfalls-6: Exposing precise node locations, public keys, and share URLs without a privacy policy

- **What goes wrong:** The new map exposes exact coordinates, public keys, QR contacts, route traces, or share URLs for operators who did not understand the public visibility implications. This can create trust issues in a community radio network.
- **Root cause:** Mesh maps often make node markers searchable and shareable. The existing map already displays node positions and public-key prefixes; MeshCore map patterns include popups with coordinates, keys, node types, QR contact data, and URL parameters.
- **Prevention:** Decide privacy defaults before launch. Use opt-in for precise coordinates, support blurred/approximate display for personal nodes, hide stale/manual confidence appropriately, document what is public, and provide a removal/update path. Keep route/path traces from revealing more than the community intends.
- **Severity:** CRITICAL
- **Phase relevance:** Map requirements, UX copy, and data model design
- **Confidence:** HIGH
- **Source:** WebFetch + Codebase — https://blog.meshcore.io/2026/04/04/meshcore-map; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`
- **Checked:** 2026-05-05

### ITEM-pitfalls-7: Mixing old Denver branding with new Colorado Mesh identity

- **What goes wrong:** The redesign visually says Colorado MeshCore, but metadata, PWA manifest, navigation alt text, schema, constants, social cards, GitHub org links, and page copy still say Denver MeshCore or point to `denvermc.com`.
- **Root cause:** Brand strings are spread across constants, layout metadata, route metadata, manifest, navigation, blog/content, and public assets. The local inspiration uses `Colorado MeshCore` and `public/logo-512.png`, but the current app still centralizes `BASE_URL = 'https://denvermc.com'` and `SITE_NAME = 'Denver MeshCore'`.
- **Prevention:** Do a brand inventory and update all source-of-truth constants first: `BASE_URL`, `SITE_NAME`, Open Graph/Twitter metadata, manifest, schema, alt text, favicon/logo assets, GitHub org URL, and navigation labels. Add a grep-based CI check for banned legacy strings (`denvermc.com`, `Denver MeshCore`) except in explicit migration/redirect contexts.
- **Severity:** MODERATE
- **Phase relevance:** Redesign implementation and launch QA
- **Confidence:** HIGH
- **Source:** Codebase + Local inspiration — `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/constants.ts`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/layout.tsx`; `/Users/cjvana/Documents/GitHub/denvermc-org/public/manifest.json`; `/Users/cjvana/Downloads/meshcore/Colorado MeshCore.html`; `/Users/cjvana/Downloads/meshcore/screens.jsx`
- **Checked:** 2026-05-05

### ITEM-pitfalls-8: Using Colorado Mesh icons without confirming asset license terms

- **What goes wrong:** The site launches with Colorado Mesh logos from the icons repo, but the repo does not show an explicit LICENSE, making reuse/redistribution terms unclear for Docker images and public website assets.
- **Root cause:** The project constraint requires logos from `Colorado-Mesh/icons`; WebFetch found README attribution to `megabear - KD5IHC` but no explicit license in visible repository content. Website content may have its own license, but that does not automatically license icon assets.
- **Prevention:** Get written permission or an explicit license from Colorado Mesh before redistribution, then preserve required attribution. Prefer adding the assets through a clearly documented vendored-assets folder with a source/permission note rather than assuming GitHub visibility equals license grant.
- **Severity:** MODERATE
- **Phase relevance:** Branding asset integration before release
- **Confidence:** MEDIUM
- **Source:** WebFetch/WebSearch — https://github.com/Colorado-Mesh/icons; https://coloradomesh.org/license
- **Checked:** 2026-05-05

### ITEM-pitfalls-9: Integrating utilities as a submodule when they are an app, not a library

- **What goes wrong:** The main site vendors or submodules `meshcore-utilities-site`, then CI breaks, routing duplicates, styling diverges, and updates require awkward submodule pointer management. Tool replacement stalls because the utilities code is Flask/static-app-shaped rather than exported components or packages.
- **Root cause:** The utilities repo appears Docker-first/Python app-oriented with `app.py`, templates/static/backend, port `50000`, and serial command schemas. GitHub Actions does not checkout submodules by default, and parent repos pin a submodule commit instead of automatically tracking latest.
- **Prevention:** Do not use a submodule as the default integration path. First run utilities as a separate `tools.meshcore.coloradomesh.org` service or reverse-proxied path; extract schemas/data contracts where useful; rewrite only the UI pieces that need first-class Next.js integration. If a submodule is chosen, configure `actions/checkout` with `submodules: recursive`, full history as needed, and explicit cross-repo credentials if private.
- **Severity:** MODERATE
- **Phase relevance:** Utilities integration decision and CI setup
- **Confidence:** HIGH
- **Source:** WebFetch + Official docs — https://github.com/Colorado-Mesh/meshcore-utilities-site; https://github.com/actions/checkout; https://git-scm.com/docs/git-submodule
- **Checked:** 2026-05-05

### ITEM-pitfalls-10: Building serial USB tooling without Web Serial browser constraints

- **What goes wrong:** The serial console works for one developer but fails for many visitors, fails on HTTP preview URLs, or tries to request a serial port on page load and is blocked by the browser.
- **Root cause:** Web Serial is limited availability, experimental, requires secure contexts, requires user activation for `requestPort()`, and can be blocked by Permissions-Policy. The utilities site advertises canned serial USB commands, but production browser support cannot be assumed.
- **Prevention:** Feature-detect `navigator.serial`, show unsupported-browser fallback instructions, require a click/tap to connect, handle permission denial and device disconnects, and serve only over HTTPS or trusted localhost. Add `Permissions-Policy: serial=(self)` only on pages that need it if the deployment policy is restrictive.
- **Severity:** MODERATE
- **Phase relevance:** Utilities UX and security header implementation
- **Confidence:** HIGH
- **Source:** Official docs + WebFetch — https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API; https://github.com/Colorado-Mesh/meshcore-utilities-site
- **Checked:** 2026-05-05

### ITEM-pitfalls-11: Creating hydration/runtime errors with browser-only map and serial libraries

- **What goes wrong:** Production builds pass, but the browser logs hydration errors or `window is not defined` when map, Leaflet, Web Serial, or demo-canvas code runs during server render. This can break pages intermittently and make SSR output mismatch client output.
- **Root cause:** Next.js server-rendered components cannot use browser-only APIs in render logic. The existing Leaflet wrapper correctly uses `dynamic(..., { ssr: false })`, but new map/utilities code could regress by importing Leaflet, WebSocket browser code, `window`, `document`, or `navigator.serial` from server-rendered modules. The local inspiration file is a browser-only static React/Babel canvas, not production Next.js code.
- **Prevention:** Keep browser-only code in isolated client components loaded with `next/dynamic({ ssr: false })` where necessary. Use `useEffect` for browser API access and render stable placeholders server-side. Do not copy the local design-canvas runtime into the production app.
- **Severity:** MODERATE
- **Phase relevance:** Map/utilities frontend implementation
- **Confidence:** HIGH
- **Source:** Official docs + Codebase/Local inspiration — https://nextjs.org/docs/messages/react-hydration-error; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMapWrapper.tsx`; `/Users/cjvana/Downloads/meshcore/Colorado MeshCore.html`; `/Users/cjvana/Downloads/meshcore/design-canvas.jsx`
- **Checked:** 2026-05-05

### ITEM-pitfalls-12: Copying the local design mockup too literally

- **What goes wrong:** The final site inherits demo-only artifacts: hard-coded fake stats, random node dots, React 18 UMD/Babel scripts, Google font preconnects, generated screenshots, canvas controls, and placeholder labels. This would violate the “inspired by, not direct clone” constraint and undermine trust in live network data.
- **Root cause:** `/Users/cjvana/Downloads/meshcore` is a design canvas, not an app source. It includes hard-coded artboards, `Math.random()` mock data, static numbers such as `247 ONLINE`, and a design-canvas wrapper intended for visual review.
- **Prevention:** Treat the mockup as a visual reference only: extract color/spacing/mountain/console motifs, then reimplement in the existing Next.js component system with real data bindings and accessible responsive states. Replace every mock stat with either real map/observer data or clearly labeled placeholders until data is available.
- **Severity:** MODERATE
- **Phase relevance:** UI implementation and content QA
- **Confidence:** HIGH
- **Source:** Local inspiration — `/Users/cjvana/Downloads/meshcore/Colorado MeshCore.html`; `/Users/cjvana/Downloads/meshcore/screens.jsx`; `/Users/cjvana/Downloads/meshcore/design-canvas.jsx`
- **Checked:** 2026-05-05

### ITEM-pitfalls-13: Combining GPL map code into the main site without license strategy

- **What goes wrong:** Developers copy significant GPL-3.0 map code into the main Next.js app, then the whole combined work may need GPL-compatible distribution terms. Alternatively, the project ships Docker images containing GPL software but does not provide corresponding source access.
- **Root cause:** `meshcore-mqtt-live-map` is GPL-3.0. GPL obligations depend on distribution/conveying and whether integration creates one combined work versus separate aggregated programs. Containers do not avoid license analysis.
- **Prevention:** Prefer service-level integration over code copying: run the GPL map as a separate container with clear attribution and source link. If copying or modifying GPL code, plan GPL-compliant source distribution for the exact shipped version. Get legal review before merging GPL code into the main app if the main repo/license expectations differ.
- **Severity:** CRITICAL
- **Phase relevance:** Integration approach decision before implementation
- **Confidence:** HIGH
- **Source:** WebFetch + Official license FAQ — https://github.com/yellowcooln/meshcore-mqtt-live-map; https://www.gnu.org/licenses/gpl-faq.en.html; https://www.gnu.org/licenses/gpl-3.0.en.html
- **Checked:** 2026-05-05

### ITEM-pitfalls-14: Trusting “network health” scores without preserving metric definitions

- **What goes wrong:** The redesigned observer page shows polished health scores, but users cannot tell whether numbers come from MQTT live packets, the legacy Turso DB, bot API, or mock/design data. Metrics may silently change meaning during migration.
- **Root cause:** The existing app merges Turso packet/node stats with `BOT_API_URL` stats and labels some 30-day counts as `packets_today` for compatibility. The requested map replacement has its own live MQTT/route/history concepts. The local mockup includes demo “composite score” and fake real-time rows.
- **Prevention:** Define each metric’s source, time window, freshness threshold, and failure behavior before redesigning cards. Add UI footnotes/tooltips for source and last update. During migration, show side-by-side validation between legacy `/api/stats`/`/api/health` and the new map service before replacing public metrics.
- **Severity:** MODERATE
- **Phase relevance:** Data integration and observer UI rewrite
- **Confidence:** HIGH
- **Source:** Codebase + Local inspiration + WebFetch — `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/db/index.ts`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/api/stats/route.ts`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/bot-api.ts`; `/Users/cjvana/Downloads/meshcore/screens.jsx`; https://github.com/yellowcooln/meshcore-mqtt-live-map
- **Checked:** 2026-05-05

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-pitfalls-1 | HIGH | WebFetch + Codebase | https://github.com/yellowcooln/meshcore-mqtt-live-map; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx` |
| ITEM-pitfalls-2 | HIGH | Official docs + Codebase | https://nginx.org/en/docs/http/websocket.html; `/Users/cjvana/Documents/GitHub/denvermc-org/netlify.toml` |
| ITEM-pitfalls-3 | HIGH | Codebase + Official docs | `/Users/cjvana/Documents/GitHub/denvermc-org/netlify.toml`; https://nextjs.org/docs/app/getting-started/deploying |
| ITEM-pitfalls-4 | HIGH | Official docs + Codebase | https://nextjs.org/docs/app/getting-started/deploying; https://docs.docker.com/guides/nextjs/containerize/ |
| ITEM-pitfalls-5 | HIGH | Official docs + Codebase | https://docs.github.com/en/actions/publishing-packages/publishing-docker-images; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml` |
| ITEM-pitfalls-6 | HIGH | WebFetch + Codebase | https://blog.meshcore.io/2026/04/04/meshcore-map; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx` |
| ITEM-pitfalls-7 | HIGH | Codebase + Local files | `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/constants.ts`; `/Users/cjvana/Downloads/meshcore/screens.jsx` |
| ITEM-pitfalls-8 | MEDIUM | WebFetch/WebSearch | https://github.com/Colorado-Mesh/icons; https://coloradomesh.org/license |
| ITEM-pitfalls-9 | HIGH | WebFetch + Official docs | https://github.com/Colorado-Mesh/meshcore-utilities-site; https://github.com/actions/checkout |
| ITEM-pitfalls-10 | HIGH | Official docs + WebFetch | https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API; https://github.com/Colorado-Mesh/meshcore-utilities-site |
| ITEM-pitfalls-11 | HIGH | Official docs + Codebase | https://nextjs.org/docs/messages/react-hydration-error; `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMapWrapper.tsx` |
| ITEM-pitfalls-12 | HIGH | Local files | `/Users/cjvana/Downloads/meshcore/Colorado MeshCore.html`; `/Users/cjvana/Downloads/meshcore/screens.jsx`; `/Users/cjvana/Downloads/meshcore/design-canvas.jsx` |
| ITEM-pitfalls-13 | HIGH | WebFetch + Official license FAQ | https://github.com/yellowcooln/meshcore-mqtt-live-map; https://www.gnu.org/licenses/gpl-faq.en.html |
| ITEM-pitfalls-14 | HIGH | Codebase + Local files + WebFetch | `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/db/index.ts`; `/Users/cjvana/Downloads/meshcore/screens.jsx`; https://github.com/yellowcooln/meshcore-mqtt-live-map |

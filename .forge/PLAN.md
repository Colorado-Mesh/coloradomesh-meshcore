# Forge Implementation Plan

## Overview
Redesign the existing Denver MeshCore Next.js site into a Docker-primary Colorado MeshCore portal at `meshcore.coloradomesh.org`. The plan preserves useful guides/blog content while fully renaming visible Denver branding to Colorado MeshCore, rebuilds the public experience with the local prototype’s night-sky operations-console direction, ports live-map behavior from `yellowcooln/meshcore-mqtt-live-map` into the main site experience, ports all feasible tools from `Colorado-Mesh/meshcore-utilities-site`, replaces legacy Turso/bot-derived public metrics with map-derived stats, and adds Docker/GHCR release delivery.

## Technical Decisions
- Keep the current Next.js 16 App Router stack instead of rewriting the site in Astro because the repository already has App Router routes, MDX/blog infrastructure, metadata, sitemap, Tailwind v4, and existing guide/tool components. Research refs: ITEM-stack-1, ITEM-architecture-1, ITEM-prior-art-2.
- Use Node 24 for Docker and GitHub Actions, matching the user’s runtime decision, while verifying dependencies with `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Research refs: ITEM-stack-2; user decision overrides Node 22 fallback.
- Set `output: 'standalone'` in `next.config.js` and ship a multi-stage Docker image. Research refs: ITEM-stack-3, ITEM-architecture-3, ITEM-pitfalls-4.
- Publish release images to GHCR on GitHub Releases/tags with semver aliases and `latest`. Research refs: ITEM-stack-4, ITEM-pitfalls-5.
- Use the linked live map as functional prior art and GPL source lineage, but port its map/data concepts into this Next.js app rather than running it as a sidecar. Source files to inspect/port from upstream include `backend/app.py`, `backend/config.py`, `backend/decoder.py`, `backend/state.py`, `backend/history.py`, `backend/los.py`, `backend/static/app.js`, `backend/static/index.html`, `backend/static/styles.css`, `backend/static/sw.js`, and tests under `tests/`. Research refs: ITEM-stack-6, ITEM-architecture-2, ITEM-pitfalls-1, ITEM-pitfalls-13; user decision overrides sidecar default.
- Preserve GPL compliance for branded/forked live-map-derived work by adding attribution and a source/compliance note when live-map code or behavior is ported. Research refs: ITEM-stack-7, ITEM-pitfalls-13, ITEM-prior-art-3.
- Port feasible utilities from `Colorado-Mesh/meshcore-utilities-site` into the Next app, prioritizing behavior from `backend/api/routes/*`, `backend/api/services/*`, `serial_commands.schema.json`, `static/data/*.json`, and `static/js/*.js`. Research refs: ITEM-stack-8, ITEM-architecture-6, ITEM-pitfalls-9, ITEM-prior-art-4; user decision overrides sidecar default.
- Use exact public map locations for all nodes per user decision, with UI copy that clearly states data is public/live. Research refs: ITEM-pitfalls-6.
- Centralize Colorado MeshCore branding and remove visible Denver MeshCore branding throughout app metadata, navigation, footer, routes, content, manifest, headers, sitemap, and JSON-LD. Research refs: ITEM-architecture-9, ITEM-pitfalls-7.
- Because this session is backed by Codex GPT-5.5, visual/frontend implementation work must be delegated to native Opus 4.7 xhigh via `co-ui` or `/opus-ui`; non-visual integration, backend/API, Docker, workflow, and test work can be implemented directly in this session.

## Implementation Steps

### Step 1: Brand foundation, runtime configuration, and URL baseline
**Goal:** Establish a single Colorado MeshCore brand/config source and remove the core Denver/Netlify/Node 20 assumptions before deeper feature work.
**Why now:** Every page, metadata object, API adapter, Docker setting, and imported tool needs a stable brand and runtime config contract.
**Dependencies:** Current `src/lib/constants.ts`, `src/app/layout.tsx`, `src/components/JsonLd.tsx`, `public/manifest.json`, `public/_headers`, `public/_redirects`, `netlify.toml`, and workflow Node versions.
**Files:**
- Modify `src/lib/constants.ts`
- Modify `src/app/layout.tsx`
- Modify `src/components/JsonLd.tsx`
- Modify `src/app/sitemap.ts`
- Modify `src/app/feed.xml/route.ts`
- Modify `public/manifest.json`
- Modify `public/robots.txt`
- Modify `.github/workflows/ci.yml`
- Modify `.github/workflows/security.yml`
- Modify `package.json`
- Modify `package-lock.json` only if dependency/script changes require it
- Modify or retire `netlify.toml` only after Docker config exists in later steps; this step should only update stale comments/runtime if touched
**Existing code to inspect first:**
- `src/lib/constants.ts` for `BASE_URL`, `SITE_NAME`, `SITE_TAGLINE`, `SITE_DESCRIPTION`, API route constants, thresholds, and `BOT_NODE_NAME`
- `src/app/layout.tsx` for metadata, canonical URL, OpenGraph, Twitter, icons, and JSON-LD injection
- `src/components/JsonLd.tsx` for organization/community schema hard-coded brand names and URLs
- `src/app/sitemap.ts` for `/map`, `/observer`, and `BASE_URL` usage
- `src/app/feed.xml/route.ts` for feed title/description/link strings
- `public/manifest.json`, `public/_headers`, `public/_redirects`, `netlify.toml`
- `.github/workflows/ci.yml` and `.github/workflows/security.yml` currently use Node 20
**Implementation plan:**
1. Replace scattered brand constants with a single exported brand/runtime object in `src/lib/constants.ts`, including `BASE_URL = 'https://meshcore.coloradomesh.org'`, `SITE_NAME = 'Colorado MeshCore'`, `COMMUNITY_NAME = 'Colorado Mesh'`, GitHub org URL, Discord URL, MeshCore docs URL, logo paths, social handles if known, and runtime map/API env variable names.
2. Update app metadata in `src/app/layout.tsx` to use the brand constants for title templates, description, keywords, authors, OpenGraph, Twitter, canonical metadata, and icon alt text.
3. Update JSON-LD generation in `src/components/JsonLd.tsx`, sitemap, RSS feed, manifest, and robots output to use the new `BASE_URL` and Colorado MeshCore naming.
4. Update CI/security workflow Node versions to `24` and add a package `engines.node` requirement such as `>=24 <26` if compatible with local verification.
5. Replace hard-coded `denvermc.com`, `Denver MeshCore`, `Denver MeshCore Community`, `@denver_meshcore`, and stale Node 20 references in the touched config/metadata files.
6. Add scripts to support later verification, such as `typecheck` for `tsc --noEmit`, if not already present.
7. Run a grep guard for `Denver MeshCore`, `denvermc.com`, and `node-version: '20'`; leave legitimate historical content for later content-migration steps only if not user-visible metadata/navigation.
**Contracts and interfaces:**
- `src/lib/constants.ts` becomes the source of truth for site name, base URL, public URLs, and API endpoint names.
- CI uses Node 24 for install/lint/typecheck/build/audit.
- Runtime config names introduced here must be used by later steps: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MAP_TILE_URL`, `MESHCORE_MQTT_URL`, `MESHCORE_MQTT_USERNAME`, `MESHCORE_MQTT_PASSWORD`, `MESHCORE_MQTT_TOPIC`, `MESHCORE_MQTT_CLIENT_ID`, `MESHCORE_MAP_HISTORY_ENABLED`, and `MESHCORE_MAP_SAMPLE_DATA`.
**State/data changes:** None to persistent app data.
**Edge cases:**
- `metadataBase` must remain a valid absolute URL.
- Manifest icons must still resolve even before replacing assets.
- JSON-LD must not produce invalid URLs when env vars are absent.
- Existing API constants used by components should not be renamed without updating callers.
**Acceptance criteria:**
- Main metadata, manifest, sitemap, feed, CI workflows, and brand constants say Colorado MeshCore and `meshcore.coloradomesh.org`.
- Node 24 is the CI/security runtime baseline.
- No stale Denver brand strings remain in app shell metadata/navigation config touched by this step.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `grep -R "Denver MeshCore\|denvermc.com\|node-version: '20'" -n src public .github package.json netlify.toml content || true`
**Manual validation:** Start the app and inspect page source/metadata for the homepage, `/map`, `/guides`, and `/blog` after this step or in the later browser validation pass.
**Risks:**
- Stale brand metadata can persist through sitemap/RSS/JSON-LD if only visible components are changed. Research refs: ITEM-pitfalls-7, ITEM-architecture-9.
- Node 24 can expose dependency incompatibility; verification must run before commit. Research refs: ITEM-stack-2.
**Out of scope for this step:** Full page redesign, Docker image, map data port, utility port, deleting legacy routes, and visual QA.

### Step 2: Colorado Mesh assets and visual system handoff
**Goal:** Replace the current brand visuals with Colorado Mesh assets and implement the prototype-inspired visual system through native Opus UI delegation.
**Why now:** The redesign’s visual language should land before page-by-page rewrites so subsequent map/tools/content pages use shared primitives instead of one-off styling.
**Dependencies:** User confirmed logo redistribution is authorized. Current app uses `public/logo.png`, `public/logo-192.png`, `public/logo-512.png`, favicons, `src/app/globals.css`, `src/components/Navigation.tsx`, and `src/components/Footer.tsx`. The local prototype is `/Users/cjvana/Downloads/meshcore/Colorado MeshCore.html`.
**Files:**
- Modify `src/app/globals.css`
- Modify `src/components/Navigation.tsx`
- Modify `src/components/MobileMenu.tsx`
- Modify `src/components/Footer.tsx`
- Create/modify reusable visual components under `src/components/` such as `BrandMark.tsx`, `TopoBackground.tsx`, `HeroPanel.tsx`, `MetricStrip.tsx`, `ToolCard.tsx`, `NetworkPanel.tsx`, and `SectionEyebrow.tsx`
- Replace public logo/icon files in `public/` from `Colorado-Mesh/icons` assets
- Possibly add `public/brand/` for source SVG/PNG variants
**Existing code to inspect first:**
- `/Users/cjvana/Downloads/meshcore/Colorado MeshCore.html` for visual direction: night-sky console, Space Grotesk/JetBrains Mono, mesh teal, sunset orange, mountain identity, key screens: landing, map, utilities, observer
- `src/app/globals.css` for current Tailwind v4 tokens, Colorado color variables, background utilities, card styles, and button classes
- `src/components/Navigation.tsx`, `src/components/MobileMenu.tsx`, `src/components/Footer.tsx`
- `public/logo.png`, `public/logo-192.png`, `public/logo-512.png`, favicons, manifest icons
- `Colorado-Mesh/icons`: `source/svg/icon1.svg`, `source/svg/icon2.svg`, `linux/*.png`, `mac/iconset/*.png`, `win/colorado-mesh.ico`
**Implementation plan:**
1. Delegate this step to native Opus 4.7 xhigh using `co-ui` or `/opus-ui`, with a concise handoff that includes the local prototype path, the target files, the brand decisions, and the instruction to avoid broad feature logic changes.
2. Vendor approved Colorado Mesh icon assets into `public/brand/` and replace site icons/favicons/PWA icons with appropriate sizes from `Colorado-Mesh/icons`, preserving optimized PNG/ICO/SVG references.
3. Update global design tokens in `src/app/globals.css` to align with the prototype: dark operations-console default, mesh teal primary, sunset orange accent, mountain/topographic motifs, and readable light/dark handling.
4. Implement shared UI primitives for hero panels, topo/mesh backgrounds, operational cards, metric strips, tool cards, and network panels so later steps reuse them.
5. Update `Navigation`, `MobileMenu`, and `Footer` to use the Colorado MeshCore brand mark, balanced navigation for Home, Map, Tools, Guides, Blog, About, and Discord, and remove `/observer` as a primary nav item if it is being hard-removed later.
6. Verify responsive behavior for mobile menu, focus states, contrast, and fixed header overlap.
7. Ensure no CDN font imports from the local prototype are copied blindly; use Next font or existing font strategy unless Opus chooses and validates a safe replacement.
**Contracts and interfaces:**
- Visual primitives must remain ordinary React/Next components with typed props and no app-wide data fetching.
- `Navigation` and `Footer` must consume brand constants rather than hard-coded Denver strings.
- Asset paths used in metadata/manifest must correspond to actual files in `public/`.
**State/data changes:** Public static assets change; no database state.
**Edge cases:**
- Avoid breaking Next image optimization with missing asset dimensions.
- Keep keyboard and screen-reader semantics for navigation/mobile menu.
- Avoid copying prototype mock data, inline React CDN scripts, or Babel setup.
- Keep Tailwind v4 syntax valid.
**Acceptance criteria:**
- Site shell visibly uses Colorado Mesh logos and no visible Denver branding.
- Shared design primitives exist and are used by shell components.
- Navigation reflects the new information architecture: balanced audience, map, tools, guides, blog, about/community.
- The prototype’s art direction is reflected without importing its runtime code.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
**Manual validation:** Run the dev server and inspect home, mobile navigation, footer, and a content page in the browser at desktop and mobile widths. Monitor console errors.
**Risks:**
- Prototype mock data or CDN-only runtime code can accidentally ship if copied instead of reimplemented. Research refs: ITEM-pitfalls-12, ITEM-prior-art-1.
- This is visual/frontend work and must be delegated to Opus from this Codex-backed session.
**Out of scope for this step:** Live map implementation, utility behavior porting, Docker, and content rewrites beyond shell-visible branding.

### Step 3: Map-derived data contracts and runtime MQTT adapter
**Goal:** Create the app’s live-map data layer and runtime configuration contract, replacing Turso/bot public stats as the source for public map-derived metrics.
**Why now:** The map UI, tools prefix matrix, and homepage metrics need stable TypeScript contracts before components are rewritten.
**Dependencies:** Step 1 brand/runtime constants. Current legacy data comes from `src/lib/db/index.ts`, `src/app/api/nodes/route.ts`, `src/app/api/stats/route.ts`, `src/app/api/health/route.ts`, `src/hooks/useStats.ts`, and `src/lib/types.ts`. Upstream behavior comes from live-map `backend/config.py`, `backend/decoder.py`, `backend/state.py`, `backend/history.py`, `backend/static/app.js`, and `tests/test_websocket_snapshot.py`.
**Files:**
- Modify `src/lib/types.ts`
- Add `src/lib/map/types.ts`
- Add `src/lib/map/config.ts`
- Add `src/lib/map/normalize.ts`
- Add `src/lib/map/sample-data.ts`
- Add `src/lib/map/store.ts` or `src/lib/map/client.ts`
- Add/modify `src/app/api/map/nodes/route.ts`
- Add/modify `src/app/api/map/stats/route.ts`
- Add/modify `src/app/api/map/stream/route.ts` if WebSocket/SSE is feasible in the Next runtime; otherwise document polling fallback in this step and plan WebSocket separately
- Modify `src/hooks/useStats.ts` or add `src/hooks/useMapStats.ts`
- Modify existing callers only enough to compile; full UI replacement occurs later
**Existing code to inspect first:**
- `src/lib/types.ts` for `Node`, `NodeWithStats`, `CommunityStats`, and `NetworkHealth`
- `src/app/api/nodes/route.ts`, `src/app/api/stats/route.ts`, `src/app/api/health/route.ts`, `src/app/api/health/history/route.ts`
- `src/hooks/useStats.ts`
- `src/components/StatsSection.tsx`, `src/components/PrefixMatrix.tsx`, `src/components/NamingWizard.tsx`
- Upstream live-map files: `backend/config.py`, `backend/decoder.py`, `backend/state.py`, `backend/static/app.js`, `tests/test_decoder_*.py`, `tests/test_websocket_snapshot.py`
**Implementation plan:**
1. Define framework-neutral map contracts: `MapNode`, `MapLink`, `MapRoute`, `MapStats`, `MapSnapshot`, `MapConnectionStatus`, and normalized node roles/types that can support exact latitude/longitude, last heard, public key, firmware/model, battery, route, neighbors, and metadata.
2. Implement `src/lib/map/config.ts` to read runtime env vars on the server with safe defaults for sample data and local development, while never requiring committed MQTT secrets for build.
3. Implement normalizers in `src/lib/map/normalize.ts` that convert upstream live-map-like payloads and legacy `NodeWithStats` shapes into the new `MapNode` contract so migration can be staged.
4. Implement a server-side map snapshot provider that initially supports sample data and optional existing `/api/nodes`/Turso fallback for development only, then can be extended to MQTT ingestion without changing UI contracts.
5. Add `/api/map/nodes` and `/api/map/stats` routes returning the new `ApiResponse` shape with cache headers appropriate for live data.
6. Add a `useMapStats`/`useMapSnapshot` hook for client components with refresh interval, loading, error, and last-updated state.
7. Ensure exact coordinates are returned when present and no privacy blurring logic is introduced because the user chose all exact public data.
8. Update TypeScript exports and leave legacy `/api/nodes` and `/api/stats` in place until the replacement components are wired in Step 4/5.
**Contracts and interfaces:**
- `GET /api/map/nodes` returns `{ success: true, data: MapNode[] }`.
- `GET /api/map/stats` returns `{ success: true, data: MapStats }` with map-derived counts such as total nodes, online nodes, visible nodes, repeaters, stale nodes, links/routes when known, and `lastUpdated`.
- Runtime env config is server-only unless explicitly prefixed `NEXT_PUBLIC_`.
- Build must succeed without MQTT secrets by using sample/empty data behavior.
**State/data changes:**
- Introduces in-memory/snapshot map state only. No new database migration unless implementation discovers a durable history requirement and asks for plan change.
**Edge cases:**
- Missing MQTT env vars must not break `npm run build`.
- Invalid coordinates, missing public keys, stale timestamps, and duplicate IDs must normalize consistently.
- Serverless/standalone Next runtime may not be suitable for long-lived MQTT connections; if so, use polling/sample route first and add a documented stop condition before inventing a separate service.
**Acceptance criteria:**
- New map API routes compile and return stable typed data in local development.
- Homepage/map/tools components can consume `MapStats`/`MapNode` without importing Turso types.
- No MQTT credentials are exposed to browser bundles.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `curl -s http://localhost:3000/api/map/stats` during manual server validation
- `curl -s http://localhost:3000/api/map/nodes` during manual server validation
**Manual validation:** Run the dev server, fetch the new API routes, and confirm missing env vars produce empty/sample responses rather than build/runtime crashes.
**Risks:**
- Treating live-map telemetry as clean data creates misleading metrics unless normalizers handle missing/stale/duplicate data. Research refs: ITEM-pitfalls-14, codex-analysis pitfalls.
- Browser-exposed MQTT credentials would be a security issue; keep ingestion/config server-side. Research refs: ITEM-stack-11, ITEM-pitfalls-6.
**Out of scope for this step:** Full MQTT protocol parity, map rendering, route history UI, deleting legacy APIs, and utilities.

### Step 4: Port and brand the live network map experience
**Goal:** Replace the current `NetworkMap`/legacy `/map` experience with a branded in-site live map based on the upstream live-map functionality and the new map data contracts.
**Why now:** This is the core product replacement for the old map and is required before removing observer/network-health pages.
**Dependencies:** Steps 1-3, existing Leaflet dependencies, upstream live-map frontend behavior, and Opus UI delegation for visual implementation details.
**Files:**
- Modify `src/app/map/page.tsx`
- Replace or heavily modify `src/components/NetworkMap.tsx`
- Modify `src/components/NetworkMapWrapper.tsx`
- Add `src/components/map/LiveMap.tsx`
- Add `src/components/map/MapLegend.tsx`
- Add `src/components/map/NodePopup.tsx`
- Add `src/components/map/MapToolbar.tsx`
- Add `src/components/map/ConnectionStatus.tsx`
- Add `src/components/map/MapStatsOverlay.tsx`
- Modify `src/app/globals.css` for map-specific styles if not already handled in Step 2
- Add `src/app/map/loading.tsx` and `src/app/map/error.tsx` if useful
- Add GPL attribution/compliance text in an appropriate route/component or existing legal/about area when live-map code/behavior is ported
**Existing code to inspect first:**
- `src/app/map/page.tsx`
- `src/components/NetworkMap.tsx`
- `src/components/NetworkMapWrapper.tsx`
- `src/lib/map/*` from Step 3
- Upstream `backend/static/app.js`, `backend/static/index.html`, `backend/static/styles.css`, `backend/static/sw.js`, `backend/static/landing.html`
- Upstream tests for node modes, weather, coverage, LOS, websocket snapshot, peer history, route resolution
**Implementation plan:**
1. Delegate visual/frontend map implementation to native Opus via `co-ui` or `/opus-ui`, instructing Opus to use the Step 3 contracts and the local prototype’s map artboard direction while preserving functional scope.
2. Replace the old map page hero/copy/links with a Colorado MeshCore live map page that includes map-derived stats, exact-location notice, connection freshness, and clear actions for joining or using tools.
3. Rebuild the Leaflet map component around `MapNode` data, using exact coordinates, role/type styling, online/stale visual states, clustering or filtering if feasible with existing dependencies, and responsive height/layout.
4. Port upstream live-map UI behaviors that are feasible in Next: node popups, share/copy fields where practical, route/neighbor display if exposed by the data contract, freshness badges, and connection state.
5. Add map controls for filter/search by node name/type/public key and source/freshness indicators.
6. Remove old observer link CTAs from `/map` and replace with Tools/Guides/Discord links.
7. Include GPL attribution/source note if any upstream live-map code or directly derived UI behavior is used.
8. Ensure browser-only Leaflet code remains isolated in client components and does not break SSR/build.
**Contracts and interfaces:**
- `LiveMap` accepts `initialNodes?: MapNode[]`, `refreshInterval?: number`, and optional map center/zoom props.
- Client fetches from `/api/map/nodes` and `/api/map/stats`, not `/api/nodes` or `/api/stats`.
- All map display uses `MapNode` fields, not Turso `NodeWithStats` fields.
**State/data changes:** None beyond client state.
**Edge cases:**
- Leaflet must not run during SSR.
- Empty data should show a useful no-data state, not a broken map.
- Invalid/missing coordinates should be omitted from marker rendering but counted appropriately in stats.
- Exact location notice must not imply privacy blurring.
- Mobile map controls must remain usable.
**Acceptance criteria:**
- `/map` renders a branded Colorado MeshCore live map using new map APIs.
- Current old map copy and observer stats links are gone.
- Map markers/popups display exact node locations and live-map-derived fields when available.
- No public map UI fetches legacy `/api/nodes` directly.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
**Manual validation:** Run the dev server, open `/map`, verify markers or empty/sample state, filters, popups, mobile responsiveness, console output, and network requests to `/api/map/*` only.
**Risks:**
- Leaflet hydration/runtime errors are common if browser APIs run server-side. Research refs: ITEM-pitfalls-11.
- Porting too much upstream behavior at once can exceed the main-site architecture; keep the first pass scoped to core live nodes/stats and feasible route/neighbor display. Research refs: ITEM-pitfalls-1, ITEM-prior-art-3.
**Out of scope for this step:** Full backend MQTT parity if Step 3 chose a staged snapshot provider, utilities porting, Docker, and removing legacy APIs.

### Step 5: Port utilities into a first-class `/tools` experience
**Goal:** Replace overlapping current tools with all feasible tools from `Colorado-Mesh/meshcore-utilities-site` as integrated Next.js pages/components.
**Why now:** The user wants the utilities ported into the site, and tools need the same map-derived node data contracts introduced earlier.
**Dependencies:** Steps 1-3, current `NamingWizard`, `CompanionNamer`, `PrefixMatrix`, and upstream utilities repo structure.
**Files:**
- Add `src/app/tools/page.tsx`
- Add `src/app/tools/repeater-name/page.tsx`
- Add `src/app/tools/companion-name/page.tsx`
- Add `src/app/tools/prefix-matrix/page.tsx`
- Add `src/app/tools/serial-usb/page.tsx`
- Modify or replace `src/components/NamingWizard.tsx`
- Modify or replace `src/components/CompanionNamer.tsx`
- Modify or replace `src/components/PrefixMatrix.tsx`
- Add `src/components/tools/ToolShell.tsx`
- Add `src/components/tools/SerialUsbTool.tsx`
- Add `src/lib/tools/regions.ts` or data JSON under `src/lib/tools/data/`
- Add `src/lib/tools/serial-commands.ts`
- Add `src/lib/tools/key-generator.ts` only if key-generation code is feasible and license-safe
- Modify `src/components/index.ts`
- Modify navigation/footer to point to `/tools`
- Add public/static data only if it must be directly fetched by browser code
**Existing code to inspect first:**
- Existing components: `src/components/NamingWizard.tsx`, `src/components/CompanionNamer.tsx`, `src/components/PrefixMatrix.tsx`
- Existing utility data: `src/lib/data/airports`, `src/lib/data/cities`, `src/lib/data/landmarks`, `src/lib/utils/haversine`
- Upstream utilities: `backend/api/routes/repeater_name_tool/index.py`, `backend/api/routes/companion_name_tool/index.py`, `backend/api/routes/prefix_matrix/index.py`, `backend/api/routes/serial_usb_tool/index.py`, `backend/api/services/contacts.py`, `backend/api/services/external_key_logic.py`, `backend/api/services/meshcore_stats.py`, `backend/constants.py`, `serial_commands.schema.json`, `static/data/default_serial_commands.json`, `static/data/emojis.json`, `static/data/recommended_settings.json`, `static/data/regions.json`, `static/js/repeater_name_tool.js`, `static/js/companion_name_tool.js`, `static/js/prefix_matrix.js`, `static/js/serial_usb_tool_page.js`, `static/js/meshcore-key-generator.js`, `static/js/noble-ed25519-key-generator-offline.js`
**Implementation plan:**
1. Audit upstream utilities and current tools into a keep/replace/defer matrix inside the Step 5 execution plan before changing components.
2. Build a `/tools` index using the Step 2 `ToolCard` primitive with cards for repeater naming, companion naming, prefix matrix, serial USB, and any feasible key/settings utilities.
3. Port repeater naming behavior from upstream into a typed Next component, reusing existing airport/city/landmark data where compatible and replacing old Denver labels with Colorado MeshCore.
4. Port companion naming behavior and emoji/role guidance from upstream, preserving current useful behavior where it is more complete.
5. Convert `PrefixMatrix` to consume `/api/map/nodes`/`MapNode` instead of legacy `/api/nodes`, with exact public key prefix occupancy and free-prefix suggestions.
6. Port the Serial USB tool as a progressive-enhancement client component using Web Serial feature detection, secure-context checks, explicit connect button, schema-driven command list from `serial_commands.schema.json`/default commands, disconnect handling, and unsupported-browser fallback.
7. Evaluate offline key-generation code from upstream for license/security feasibility; include only if it can be ported cleanly with attribution and no unsafe randomness patterns.
8. Remove the old homepage inline tool sections after the `/tools` routes exist, replacing them with a concise tools teaser or navigation card.
9. Update navigation/footer/sitemap to include `/tools` and concrete tool subroutes.
**Contracts and interfaces:**
- `/tools` is the top-level tools hub.
- Tool pages are client components only where browser APIs are needed.
- Serial tool never attempts device access without user activation.
- Prefix matrix uses `MapNode.publicKey` or equivalent normalized field, not `NodeWithStats.public_key`.
**State/data changes:** Static tool data may be added under `src/lib/tools/data` or `public/tools/data`; no database state.
**Edge cases:**
- Web Serial is unavailable in many browsers and must show fallback instructions.
- Nominatim/geocoding usage in current naming wizard must keep clear user disclosure and not block core naming if unavailable.
- Key generation, if ported, must use browser crypto correctly or be deferred.
- Existing tools have 23-character MeshCore name limits; preserve validation.
**Acceptance criteria:**
- `/tools` and feasible tool subroutes render and work.
- Current naming and prefix features still work, now branded Colorado MeshCore.
- Prefix matrix uses map-derived data.
- Web Serial tool is present with feature detection/fallback.
- Old homepage inline tools are removed or demoted in favor of `/tools`.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
**Manual validation:** Run the dev server, exercise `/tools`, repeater naming, companion naming, prefix matrix search/suggest, and serial unsupported-browser/secure-context messaging. If a compatible browser/device is unavailable, explicitly record that Web Serial hardware validation was not performed.
**Risks:**
- The utilities repo is Flask/app-shaped rather than library-shaped, so direct porting may uncover behavior not cleanly expressible in one step. Research refs: ITEM-pitfalls-9, ITEM-prior-art-4.
- Web Serial requires HTTPS/trusted localhost, user activation, and browser support. Research refs: ITEM-pitfalls-10, ITEM-prior-art-11.
**Out of scope for this step:** Server-side Flask deployment, old API deletion, Docker release workflow, and advanced map features unrelated to tools.

### Step 6: Redesign homepage and preserve/rebrand core content
**Goal:** Deliver the balanced-audience Colorado MeshCore homepage and rebrand useful guides/blog/content while removing legacy homepage map/tool/observer assumptions.
**Why now:** After map and tools routes exist, the homepage can point to real destinations and map-derived stats without relying on old components.
**Dependencies:** Steps 1-5 and visual primitives from Step 2.
**Files:**
- Modify `src/app/page.tsx`
- Modify `src/components/StatsSection.tsx` or replace with map-derived component
- Modify `src/app/about/page.tsx`
- Modify `src/app/why-meshcore/page.tsx`
- Modify `src/app/start/page.tsx`
- Modify guide pages under `src/app/guides/*`
- Modify use-case pages under `src/app/use-cases/*`
- Modify content files under `content/blog/*.mdx`
- Modify `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, and blog metadata only if hard-coded Denver strings appear
- Modify `src/components/Breadcrumbs.tsx` only if brand assumptions appear
**Existing code to inspect first:**
- `src/app/page.tsx` current hero, `StatsSection`, inline naming/prefix tools, mission, features, Discord CTA
- `src/components/StatsSection.tsx` current `/api/stats` dependency
- All route files listed by `find src/app -maxdepth 5 -type f`
- `content/blog/best-meshcore-devices-colorado.mdx`, `denver-network-coverage-update.mdx`, `emergency-preparedness-guide.mdx`, `getting-started-meshcore-denver.mdx`, `solar-powered-repeater-setup.mdx`
- Grep output for `Denver`, `denver`, `observer`, `NetworkHealth`, `NetworkMap`
**Implementation plan:**
1. Delegate the homepage visual rewrite portions to native Opus via `co-ui` or `/opus-ui`, using the shared components and Step 2 visual system; keep content/route logic changes scoped and reviewable.
2. Rewrite homepage structure for a balanced audience: concise Colorado MeshCore value proposition, primary CTAs for Map, Tools, Guides/Get Started, Discord, map-derived metric strip, operator cards, newcomer onboarding, and maintainer/open-source links.
3. Replace `StatsSection` with map-derived stats from `/api/map/stats`, including last-updated/source text and graceful empty/error state.
4. Remove inline homepage `NamingWizard` and `PrefixMatrix` sections now that `/tools` owns those features; replace with tool cards linking to `/tools/repeater-name`, `/tools/companion-name`, `/tools/prefix-matrix`, and `/tools/serial-usb`.
5. Systematically update visible copy in app pages and MDX content from Denver MeshCore to Colorado MeshCore per user’s full-rename decision, preserving technical substance of guides and blog posts.
6. Remove references to old observer/analyzer route from homepage/cards/content unless replaced with the new live map or map-derived stats language.
7. Update page metadata, OpenGraph titles/descriptions, breadcrumb schema labels, and web application schema names for rebranded pages.
8. Run grep checks and manually review any remaining Denver references to decide whether they are stale and should be removed.
**Contracts and interfaces:**
- Homepage stats consume `MapStats` only.
- Homepage tools links point to `/tools/*` pages.
- Content pages remain statically renderable unless already dynamic for known reasons.
**State/data changes:** Content only; no database state.
**Edge cases:**
- Avoid changing technical standards accidentally while renaming.
- Keep apostrophes/MDX syntax valid.
- Hard-remove old URLs later only after sitemap/nav no longer reference them.
- `StatsSection` error state must not show fake numbers.
**Acceptance criteria:**
- Homepage is fully Colorado MeshCore branded and no longer embeds old naming/prefix tools inline.
- Homepage stats are map-derived and include source/freshness context.
- Core docs/blog content is preserved but rebranded.
- Navigation paths from homepage all resolve.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `grep -R "Denver MeshCore\|Denver mesh\|denvermc.com\|/observer" -n src content public || true`
**Manual validation:** Run the dev server, click through homepage CTAs, `/guides`, representative guide pages, `/blog`, and a blog post; inspect console and layout on desktop/mobile.
**Risks:**
- Full rename can unintentionally alter meaningful geographic/historical details; user explicitly chose full visible rename, so preserve technical facts while changing brand references. Research refs: ITEM-pitfalls-7.
- Fake or stale metrics can mislead users; stats must be live-map-derived or clearly unavailable. Research refs: ITEM-pitfalls-14.
**Out of scope for this step:** Map/tool internals, Docker, CI/CD release, and legacy API deletion.

### Step 7: Hard-remove legacy observer, health, Turso public map APIs, and duplicate metrics
**Goal:** Remove the old map/observer/network-health surface and duplicate Turso/bot public metric pipeline from the user-facing app.
**Why now:** New map/tools/homepage paths must already exist so hard removal does not leave broken navigation.
**Dependencies:** Steps 3-6 completed and verified.
**Files:**
- Delete `src/app/observer/page.tsx`
- Delete or stop exporting `src/components/ObserverStats.tsx`
- Delete or stop exporting `src/components/NetworkHealthCard.tsx`
- Delete or stop exporting `src/components/TopContributors.tsx` if only used by observer
- Delete or retire `src/app/api/health/route.ts`
- Delete or retire `src/app/api/health/history/route.ts`
- Delete or retire `src/app/api/stats/route.ts` if no remaining caller uses it
- Delete or retire `src/app/api/nodes/route.ts` and `src/app/api/nodes/[id]/route.ts` after prefix/map callers are migrated
- Delete or retire `src/app/api/cleanup/route.ts` if it only supports old Turso packet retention and no longer has a runtime owner
- Modify `src/lib/types.ts` to remove legacy-only `CommunityStats`, `NetworkHealth`, `NodeWithStats` fields only if no remaining caller uses them
- Modify `src/lib/db/*` only if no remaining route imports DB helpers; otherwise leave unused DB module for a separate cleanup only if build/lint allows
- Modify `src/hooks/useStats.ts` if replaced by `useMapStats`
- Modify `src/components/index.ts`
- Modify `src/app/sitemap.ts`
- Modify navigation/footer/breadcrumbs if any old `/observer` links remain
**Existing code to inspect first:**
- `src/components/index.ts` exports
- `grep -R "ObserverStats\|NetworkHealthCard\|TopContributors\|useStats\|/api/stats\|/api/health\|/api/nodes\|/observer" -n src content public`
- `src/lib/db/index.ts`, `src/lib/db/migrations/*`, `src/lib/db/README.md`
- `src/app/api/discord-webhook/route.ts` to ensure Discord alerts are not unexpectedly tied to old health state before deleting shared types
**Implementation plan:**
1. Run a full reference grep and create a deletion list of legacy observer/map/health files that are no longer referenced after Steps 3-6.
2. Remove `/observer` route entirely per user’s hard-remove decision and update sitemap/navigation/footer/content links so nothing points to it.
3. Remove legacy public stats/health/node API routes once all UI consumers use `/api/map/*`.
4. Remove old components/hooks from exports and delete files that are truly unused.
5. Keep database modules only if some remaining backend routes still need them, such as Discord webhook/state; otherwise remove old DB migration scripts and `db:migrate` script in a separate sub-action with build verification.
6. Update `package.json` dependencies only after import analysis: remove `@libsql/client`, `@netlify/functions`, or other legacy dependencies only if no remaining source imports them.
7. Run lint/typecheck/build after deletion and fix missing imports or stale references.
8. Run a grep guard for hard-removed routes and legacy API fetches.
**Contracts and interfaces:**
- Removed routes return Next 404; no redirects are added.
- Supported public live data endpoints are `/api/map/nodes` and `/api/map/stats`.
- Tool prefix matrix and homepage do not use old `/api/nodes` or `/api/stats`.
**State/data changes:** Potential removal of old DB dependency and migration scripts if truly unused; no data migration.
**Edge cases:**
- `src/app/api/discord-webhook/route.ts` may still rely on `NetworkHealth`/DB state; do not delete shared types until references are gone or migrated.
- Build can pass while stale content links remain; grep and manual click-through are required.
- Hard removal means old URLs intentionally 404.
**Acceptance criteria:**
- `/observer` and replaced legacy APIs are removed or intentionally 404.
- No source/content references point to `/observer`, old public health cards, or legacy stats APIs.
- No duplicate public metric source remains in active UI.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `grep -R "ObserverStats\|NetworkHealthCard\|TopContributors\|/observer\|/api/stats\|/api/health\|/api/nodes" -n src content public || true`
**Manual validation:** Run the dev server, verify `/observer` 404s, `/map` works, `/tools` works, homepage stats still render, and no navigation sends users to removed pages.
**Risks:**
- Removing DB/types too aggressively can break Discord webhook or hidden API code. Verify imports before deletion. Research refs: ITEM-architecture-5, ITEM-pitfalls-14.
- User chose hard removal, so SEO/redirect loss is accepted; do not add redirects. User decision overrides Q&A default.
**Out of scope for this step:** New map/tool features and Docker release workflow.

### Step 8: Docker-primary runtime, Compose examples, and migrated headers
**Goal:** Make the site runnable as the primary Docker artifact and provide Compose-based runtime configuration examples for local/production use.
**Why now:** App functionality should be stable before containerization, but Docker must land before release CD.
**Dependencies:** Steps 1-7 and successful `npm run build`.
**Files:**
- Modify `next.config.js`
- Add `Dockerfile`
- Add `.dockerignore`
- Add `compose.yaml` or `docker-compose.yml`
- Add `.env.example`
- Add `docker/` files if needed, such as `docker/Caddyfile` or `docker/nginx.conf`
- Modify `public/_headers` or document it as legacy if Docker proxy owns headers
- Modify `netlify.toml` to mark Netlify as legacy or remove only if user approves removal beyond Docker-primary scope
- Modify `package.json` scripts if needed for container smoke tests
**Existing code to inspect first:**
- `next.config.js` currently has no standalone output
- `netlify.toml` and `public/_headers` for security headers/CSP/cache behavior
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `db:migrate`
- `package-lock.json` and `.next/package.json` should not be used as source config
**Implementation plan:**
1. Set `output: 'standalone'` in `next.config.js` and verify `npm run build` emits `.next/standalone`.
2. Add a multi-stage Node 24 Dockerfile using `npm ci`, `npm run build`, a non-root runtime user, copied `.next/standalone`, `.next/static`, and `public`, with `HOSTNAME=0.0.0.0` and `PORT=3000`.
3. Add `.dockerignore` excluding `node_modules`, `.next`, `.forge`, `.git`, local env files, logs, and other non-runtime artifacts.
4. Add `.env.example` documenting public site URL, map/MQTT runtime env vars, sample-data flag, and any optional tile/provider settings.
5. Add `compose.yaml` with a `web` service, env-file support, explicit env vars, port mapping, restart policy, health check, and optional commented proxy profile.
6. Add a proxy config if needed to migrate security headers/CSP/cache rules from `netlify.toml`/`public/_headers`, ensuring CSP allows map tile and MQTT/WebSocket origins configured by runtime.
7. Test local Docker build and container startup.
8. Update docs only in existing README/CONTRIBUTING if already present and necessary; otherwise keep Docker usage in Compose comments and `.env.example` to avoid creating extra docs.
**Contracts and interfaces:**
- Docker image runs `node server.js` from Next standalone output.
- Container listens on `3000` by default.
- Runtime configuration is passed through env vars; secrets are not baked into the image.
- Compose supports setting env vars via `.env`/`env_file`.
**State/data changes:** Docker files only.
**Edge cases:**
- Next standalone output must include required public assets and static files.
- CSP must not block map tiles, MQTT/WebSocket endpoints, or Web Serial page assets.
- Build must not depend on production MQTT secrets.
- The container must run as non-root.
**Acceptance criteria:**
- `docker build` succeeds.
- `docker run` or `docker compose up` serves the app at localhost.
- Security/cache headers are preserved or intentionally moved to proxy config.
- Runtime env vars can be set through Compose.
**Verification commands:**
- `npm run build`
- `docker build -t colorado-meshcore-site:forge .`
- `docker compose config`
- `docker compose up --build` for manual validation
- `curl -I http://localhost:3000/`
- `curl -s http://localhost:3000/api/map/stats`
**Manual validation:** Open the Docker-served site in a browser, check homepage, `/map`, `/tools`, a guide, and console/network errors.
**Risks:**
- Netlify headers/redirects/cache behavior can be lost during Docker migration. Research refs: ITEM-pitfalls-3.
- Docker images can accidentally run dev servers or include unnecessary artifacts. Research refs: ITEM-pitfalls-4.
**Out of scope for this step:** GHCR publishing workflow and production infrastructure deployment.

### Step 9: GitHub Release CD for GHCR images
**Goal:** Publish Docker images to GHCR from GitHub Releases/tags using semver aliases and `latest`.
**Why now:** Docker image must build locally before adding release automation.
**Dependencies:** Step 8 Dockerfile/Compose verified.
**Files:**
- Add `.github/workflows/docker-release.yml`
- Modify `.github/workflows/ci.yml` only if adding Docker build smoke to CI
- Possibly modify `package.json` scripts if a release smoke script is useful
**Existing code to inspect first:**
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- GitHub repository owner/name assumptions from `git remote -v` during step execution
- Dockerfile and Compose files from Step 8
**Implementation plan:**
1. Add a workflow triggered by `release: published` and version tags such as `v*.*.*`, with `workflow_dispatch` for manual validation if desired.
2. Use `actions/checkout@v4`, `docker/setup-buildx-action`, `docker/login-action` to `ghcr.io`, and `docker/metadata-action` to generate semver, major/minor, SHA, and `latest` tags for stable releases.
3. Use `docker/build-push-action` to build and push the Dockerfile, with OCI labels for source, revision, version, description, and license/compliance notes where appropriate.
4. Set workflow permissions: `contents: read`, `packages: write`, and `attestations`/`id-token` only if adding provenance.
5. Add a CI-only Docker build smoke check if acceptable, without pushing images on PRs.
6. Ensure image name resolves to `ghcr.io/<owner>/<repo>` or an explicitly configured Colorado Mesh package name.
7. Verify workflow syntax locally as much as possible and run `npm run build`/Docker build before commit.
**Contracts and interfaces:**
- Release publish creates GHCR tags: exact release version, semver aliases, SHA, and `latest`.
- PR/main CI does not push stable images unless user separately requests edge publishing.
**State/data changes:** GitHub package publication occurs only when workflow runs on GitHub releases.
**Edge cases:**
- GitHub package permissions must allow GHCR writes.
- `latest` should only be attached to stable release events, not arbitrary PR builds.
- Workflow should not require local secrets.
**Acceptance criteria:**
- A release workflow exists and is syntactically valid.
- The Docker image builds in CI context and is configured to push to GHCR on releases.
- CI still lints/typechecks/builds with Node 24.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `docker build -t colorado-meshcore-site:release-test .`
**Manual validation:** Inspect generated workflow YAML for triggers, permissions, tags, and image name; optionally run `gh workflow view` after commit if available.
**Risks:**
- Ambiguous image tags or missing package permissions can make releases unusable. Research refs: ITEM-pitfalls-5, ITEM-stack-4.
- Release workflow changes are visible shared CI/CD behavior, so verify carefully before commit.
**Out of scope for this step:** Creating an actual GitHub release or pushing an image manually unless the user requests it.

### Step 10: Final integration, browser validation, and cleanup
**Goal:** Validate the complete redesigned site across app routes, Docker runtime, map/tools behavior, and hard-removal decisions before final review.
**Why now:** Cross-step issues can appear only after brand, UI, map, tools, route deletion, Docker, and CD are assembled.
**Dependencies:** Steps 1-9.
**Files:**
- Modify any files required to fix integration issues found during validation
- Update `.forge/steps/step-10-plan.md` during execution with exact fixes before editing
- Save final review artifact under `.forge/reviews/final-claude-review.json` in Phase 8
**Existing code to inspect first:**
- `git diff 6dd693f91eb10f37919189838085b632baefbb13...HEAD`
- `src/app/sitemap.ts`
- `src/components/Navigation.tsx`, `src/components/Footer.tsx`, `src/components/index.ts`
- `package.json`, workflows, Dockerfile, Compose files
- Remaining grep output for old brand/routes/APIs
**Implementation plan:**
1. Run the complete automated verification suite: lint, typecheck, Next build, Docker build, Compose config, and any targeted route/API curl checks.
2. Start the dev server and use the browser to validate homepage, `/map`, `/tools`, each feasible tool route, `/guides`, a guide page, `/blog`, a blog post, `/about`, and removed `/observer` behavior.
3. Start the Docker container/Compose stack and repeat the golden-path browser checks against the container-served app.
4. Inspect browser console and network requests for hydration, missing assets, blocked CSP, map tile/API, and Web Serial unsupported-browser states.
5. Run grep guards for old branding, removed routes, old APIs, and mock/prototype artifacts.
6. Fix only integration defects discovered by validation; if fixes require scope expansion, update `.forge/PLAN.md` and ask the user before proceeding.
7. Ensure no `.forge/research` or tool-result artifacts are accidentally included in Docker image or app runtime.
8. Prepare final verification notes for Phase 8 final Claude review.
**Contracts and interfaces:**
- All public supported routes should render under dev server and Docker.
- Removed routes intentionally 404.
- Docker build must not depend on local `.env` secrets.
- Browser validation is required before reporting UI/frontend completion.
**State/data changes:** None beyond fixes.
**Edge cases:**
- Browser-only serial/map code may pass build but fail at runtime.
- Docker-served app may differ from dev server due to standalone output/static files.
- CSP/proxy/header changes may block required connections.
**Acceptance criteria:**
- Automated checks pass.
- Browser golden paths pass in dev and Docker runtime.
- No unexpected console/network errors on key pages.
- Old observer and duplicate metric APIs are not linked from the app.
- Final Claude review can evaluate complete changes since `.forge/.base-ref`.
**Verification commands:**
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `docker build -t colorado-meshcore-site:final .`
- `docker compose config`
- `grep -R "Denver MeshCore\|denvermc.com\|/observer\|/api/stats\|/api/health\|/api/nodes" -n src content public .github Dockerfile compose.yaml package.json || true`
**Manual validation:** Dev-server and Docker browser checks for homepage, map, tools, representative content, removed observer route, responsive navigation, console, and network.
**Risks:**
- Per-step reviews may miss cross-step runtime bugs; final integration is required. Research refs: Forge review caveat, ITEM-pitfalls-2, ITEM-pitfalls-3, ITEM-pitfalls-11.
**Out of scope for this step:** New product features beyond fixing integration defects and validation blockers.

## Cross-Step Integration Checks
- Brand consistency: `grep -R "Denver MeshCore\|denvermc.com\|@denver_meshcore" -n src content public .github netlify.toml package.json || true`, then manually classify any remaining references.
- Removed routes: verify `/observer` intentionally 404s and no app links point to it.
- Data source consistency: homepage, map, and tools prefix matrix must use `/api/map/*`, not `/api/stats`, `/api/health`, or `/api/nodes`.
- Runtime config: app must build without production MQTT secrets and run with Compose env vars.
- License/compliance: live-map-derived work must preserve GPL attribution/source notice; icon assets are authorized by user decision.
- UI runtime: browser checks must cover map hydration, mobile navigation, tool interactions, and Web Serial unsupported-browser fallback.
- Docker parity: Docker-served pages must match dev-server behavior for key routes.
- Header/security parity: Docker/proxy path must preserve security headers from Netlify where applicable and allow map/tool connectivity.
- Release readiness: GHCR workflow must not publish on PRs and must tag release images as requested.

## Testing Strategy
- Per-step automated checks: `npm run lint`, `npx tsc --noEmit`, and `npm run build` unless the step explicitly does not touch source.
- Map/API checks: `curl` new `/api/map/stats` and `/api/map/nodes` routes during dev server and Docker validation.
- Docker checks: `docker build`, `docker compose config`, `docker compose up --build`, and `curl -I` for served headers.
- Browser checks: homepage, `/map`, `/tools`, tool subroutes, guides, blog, about, mobile nav, console/network logs, and intentional `/observer` 404.
- Workflow checks: YAML inspection plus local Docker build; do not trigger real release publishing unless requested.
- Review gates: each implementation step stages specific files, gets a Claude `forge-reviewer` review saved under `.forge/reviews/claude-step-N.json`, fixes required changes, then commits. Final full-project Claude review runs after all steps.

## Out of Scope
- Creating or pushing an actual GitHub release/image manually unless the user asks.
- Running the live map as an external sidecar/subdomain in the first implementation path.
- Keeping old `/observer` or adding redirects for removed routes.
- Hiding or blurring public map node locations.
- Building a custom full IoT platform beyond MeshCore map/tools/community portal needs.
- Adding paid/commercial telemetry platforms.
- Introducing feature flags or backward-compatibility shims for old Denver branding/routes.

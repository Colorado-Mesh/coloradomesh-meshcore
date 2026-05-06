# Stack Research: Colorado MeshCore Site Redesign

Checked: 2026-05-05

Project context: brownfield Next.js site redesign for `meshcore.coloradomesh.org`, Docker-primary deployment, Colorado Mesh rebrand, live map/network-health replacement using `yellowcooln/meshcore-mqtt-live-map`, and utilities replacement/integration from `Colorado-Mesh/meshcore-utilities-site`.

### ITEM-stack-1: Keep the main site on Next.js 16 App Router, TypeScript, and React 19

- **Recommendation:** Continue using Next.js App Router with TypeScript and React, but update the current patch versions to `next@16.2.4`, `react@19.2.5`, `react-dom@19.2.5`, `@next/mdx@16.2.4`, and matching React type packages. Keep `src/app` as the primary routing model.
- **Rationale:** The repo is already a Next.js App Router app (`src/app/*`) with TypeScript, MDX, Tailwind, API routes, and React Leaflet components. Next.js official docs confirm Docker deployments support all Next.js features, while Next 16 requires Node.js 20.9+ and recommends latest React/React DOM. Patch-upgrading is lower risk than changing frameworks and preserves the existing content, SEO metadata, sitemap/feed routes, and component model.
- **Confidence:** HIGH
- **Source:** Official docs + codebase — https://nextjs.org/docs/app/guides/upgrading/version-16; `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not rewrite the main site in Astro/SvelteKit/Vite SPA; the existing app already depends on Next API routes, metadata, MDX, and server rendering. Do not stay on stale `next@16.1.1` / `react@19.2.3` when current compatible patches exist.

### ITEM-stack-2: Use Node 24 LTS for Docker and CI, not Node 20

- **Recommendation:** Standardize production Docker images and GitHub Actions on Node 24 LTS (`node:24-bookworm-slim` or a pinned `node:24.x-bookworm-slim`). Update CI from `node-version: '20'` to `24` and ensure `package.json` engines allow Node 24.
- **Rationale:** Current CI uses Node 20, and the existing collector Dockerfile uses `node:20-alpine`; Node’s official releases page now marks Node 20 as EOL and says production apps should use Active or Maintenance LTS. Node 24 is the 2026 Active LTS line with longer support than Node 22. Next.js 16 only requires Node 20.9+, so Node 24 is compatible and more future-proof.
- **Confidence:** HIGH
- **Source:** Official docs + codebase — https://nodejs.org/en/about/releases/; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`; `/Users/cjvana/Documents/GitHub/denvermc-org/services/mqtt-collector/Dockerfile`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not use Node 20 for new production images. Do not use odd/current Node 26 for stable production until it becomes LTS. Use Node 22 only if a dependency blocks Node 24, with an explicit migration plan.

### ITEM-stack-3: Make Docker standalone output the primary deployment artifact

- **Recommendation:** Add `output: 'standalone'` to `next.config.js`, create a multi-stage Dockerfile for the main site, run `npm ci --no-audit --no-fund`, build with `npm run build`, copy `.next/standalone`, `.next/static`, and `public` into a non-root runtime image, and run `node server.js` with `HOSTNAME=0.0.0.0` and `PORT=3000`.
- **Rationale:** Docker-primary is a stated constraint. Next.js standalone output is the official minimal runtime mode for Docker and avoids shipping full development dependencies. The repo already has `package-lock.json`, so npm’s CI workflow is appropriate and reproducible. This also moves the site away from Netlify-primary config toward a portable container image.
- **Confidence:** HIGH
- **Source:** Official docs — https://nextjs.org/docs/app/api-reference/config/next-config-js/output; https://docs.docker.com/guides/nextjs/containerize/
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not rely on Netlify as the primary deployment target for this redesign. Do not use `next export`; the site has API routes and dynamic/live integrations. Do not install full `node_modules` in the runtime image.

### ITEM-stack-4: Publish the main Docker image to GHCR on GitHub Releases

- **Recommendation:** Add a release-triggered GitHub Actions workflow using `release: { types: [published] }`, `docker/login-action`, `docker/metadata-action`, and `docker/build-push-action` to publish `ghcr.io/<owner>/<repo>` tags based on semver, `latest`, and commit SHA. Keep CI build/lint separate from release publishing.
- **Rationale:** The project explicitly asks for CD for Docker on GitHub releases. GitHub’s official GHCR pattern uses the repository `GITHUB_TOKEN` with `packages: write`, and Docker’s official metadata/build actions provide consistent tags and OCI labels. Release-only publishing avoids pushing images for every commit unless later desired.
- **Confidence:** HIGH
- **Source:** Official docs — https://docs.github.com/en/actions/publishing-packages/publishing-docker-images; https://docs.docker.com/build/ci/github-actions/manage-tags-labels/
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not publish only to Docker Hub unless the user explicitly wants an external registry. Do not manually build/push from a developer laptop. Do not skip provenance/labels; use metadata-action labels at minimum and consider attestations after the first release workflow works.

### ITEM-stack-5: Keep Tailwind CSS v4 and implement the inspiration as a real component design system

- **Recommendation:** Keep Tailwind CSS v4 (`tailwindcss@4.2.4`, `@tailwindcss/postcss@4.2.4`) and the current CSS variable token approach. Translate `/Users/cjvana/Downloads/meshcore/screens.jsx` into reusable React components and design tokens: night-sky navy, mesh teal, sunset orange, mountain/topographic motifs, `Space Grotesk` display text, and `JetBrains Mono` for operational data.
- **Rationale:** The local inspiration is a static React 18 UMD/Babel design canvas, not a production stack. It is valuable for visual direction only. The repo already uses Tailwind v4’s `@import "tailwindcss"` and `@theme inline`; the official Tailwind Next.js setup matches this. Keeping Tailwind avoids adding a component framework while enabling a faithful Colorado Mesh aesthetic.
- **Confidence:** HIGH
- **Source:** Official docs + local files — https://tailwindcss.com/docs/installation/framework-guides/nextjs; `/Users/cjvana/Downloads/meshcore/screens.jsx`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app/globals.css`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not copy the static HTML/Babel setup from the inspiration directory. Do not introduce Chakra/MUI/shadcn as a dependency requirement for the redesign; the design is custom and the current Tailwind token system is sufficient.

### ITEM-stack-6: Run meshcore-mqtt-live-map as a dedicated sidecar service, not a Next.js rewrite

- **Recommendation:** Integrate `yellowcooln/meshcore-mqtt-live-map` as a separate Docker service behind the same domain, preferably reverse-proxied at `/map` or `/live-map`, and let it own live MQTT ingestion, packet decoding, WebSocket streaming, state persistence, heat/history/LOS/coverage/weather layers, and map UI. Use its published image or build from a pinned fork/commit; have the Next site link/embed/proxy it and optionally consume its `/api/nodes` and `/stats` endpoints for homepage badges.
- **Rationale:** The target repo is purpose-built for MeshCore live maps: FastAPI backend, Leaflet frontend, MQTT subscription, official `@michaelhart/meshcore-decoder`, WebSockets, persisted `/data` state, route history, peers, coverage, LOS, and PWA support. Reimplementing that in Next would be high risk and would lag upstream. Sidecar deployment also fits the Docker-primary requirement cleanly.
- **Confidence:** HIGH
- **Source:** GitHub + upstream README — https://github.com/yellowcooln/meshcore-mqtt-live-map; `gh repo view yellowcooln/meshcore-mqtt-live-map`; upstream `README.md`, `docker-compose.yaml`, `backend/Dockerfile`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not port the entire FastAPI/Leaflet app into React/Next in phase 1. Do not keep the current simple `NetworkMap.tsx` and health cards as the main map/metrics experience. Do not use a git submodule as the primary runtime boundary; a container boundary is cleaner.

### ITEM-stack-7: Treat meshcore-mqtt-live-map GPL-3.0 as a fork-or-container dependency with explicit license compliance

- **Recommendation:** If only running the upstream image unmodified, keep it as a separate service and document its license. If modifying branding/UI, fork it under the Colorado Mesh org, keep GPL-3.0 notices/source availability, and pin the Docker build to a commit or release tag.
- **Rationale:** The live map repository license is GPL-3.0. Its features are exactly what the project needs, but copying code directly into the main Next app would likely pull copyleft obligations into that combined work. A clearly separated service/fork makes update management and license compliance easier.
- **Confidence:** HIGH
- **Source:** GitHub — https://github.com/yellowcooln/meshcore-mqtt-live-map; upstream `LICENSE`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not paste GPL map code into proprietary or differently licensed app code without an explicit license decision. Do not leave the live map unpinned to `latest` in production if reproducible releases matter.

### ITEM-stack-8: Integrate meshcore-utilities-site as a utilities sidecar first; migrate UI selectively later

- **Recommendation:** Run `Colorado-Mesh/meshcore-utilities-site` as a Docker sidecar under `/utilities` or `tools.meshcore.coloradomesh.org` initially, then progressively replace current Next tools by calling its JSON endpoints or by reimplementing React frontends backed by the same Python domain logic. Prefer pinning a container build or fork commit over adding it as a git submodule in the main repo.
- **Rationale:** The utilities app is a Flask service with concrete, current Colorado Mesh logic: repeater/companion name generation, prefix matrix, serial USB console, contacts, `coloradomesh==0.11.1`, Pydantic models, and Docker support. Its backend depends on Python libraries/data not present in the Next app. A sidecar preserves working logic quickly while avoiding a mixed Python-in-Next build. Submodules add CI/developer friction and are only worthwhile if the main repo must build both images from a single checkout.
- **Confidence:** HIGH
- **Source:** GitHub + upstream code — https://github.com/Colorado-Mesh/meshcore-utilities-site; upstream `README.md`, `app.py`, `requirements.txt`, `Dockerfile`, route files
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not iframe random deployed tools as the only integration if the new site must feel cohesive. Do not immediately rewrite all utilities in TypeScript; the Python `coloradomesh` package already owns important naming/public-key rules. Do not use a git submodule unless release engineering requires local source checkout.

### ITEM-stack-9: Use Flask 3.1.x/Python for utilities, but upgrade the utility service patch level

- **Recommendation:** Keep the utility service on Flask/Python but update it to Python 3.12 and `Flask==3.1.3` when integrating, unless `coloradomesh` blocks that. Keep `pydantic==2.x` and `coloradomesh==0.11.1` initially, then upgrade only with tool-output regression tests.
- **Rationale:** The upstream utilities Dockerfile currently uses Python 3.11 and `Flask==3.1.2`; Flask 3.1.3 is the current 3.1.x security/bugfix release. Since this service may sit publicly behind the Colorado Mesh domain, patch currency matters more than framework churn.
- **Confidence:** MEDIUM
- **Source:** Official docs + GitHub — https://flask.palletsprojects.com/en/stable/changes/; https://github.com/Colorado-Mesh/meshcore-utilities-site
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not rewrite utility backend logic into Next API routes before understanding `coloradomesh` package APIs and serial tool behavior. Do not leave known patch updates unapplied for a public service.

### ITEM-stack-10: Use live-map state for live data; keep Turso only for site-owned historical/Discord data

- **Recommendation:** Let `meshcore-mqtt-live-map` own live node state in its `/data` volume and API. Retire or de-emphasize the current Turso-backed `nodes`, `packets`, and health routes for public map/metrics. If the main Next app still needs remote database access for Discord bot state or legacy APIs, upgrade `@libsql/client` to `0.17.3` or migrate new remote Turso code to `@tursodatabase/serverless@1.1.3`.
- **Rationale:** The current repo uses `@libsql/client@0.15.15` and custom network health SQL, but the replacement map already provides richer live functionality and persistence. Turso’s current TypeScript docs position `@libsql/client` as ORM/legacy-compatible and recommend `@tursodatabase/serverless` for new remote server/container access. Avoid running two competing sources of truth for node status.
- **Confidence:** MEDIUM
- **Source:** Official docs + codebase — https://docs.turso.tech/sdk/ts/quickstart; https://tursodatabase.github.io/libsql-client-ts/; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/db/index.ts`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not add PostgreSQL/Supabase just for map state. Do not preserve current health metrics as authoritative after adopting the live map. Do not maintain duplicate MQTT collectors unless there is a clear data product that live-map cannot provide.

### ITEM-stack-11: Keep MQTT decoding server-side; avoid browser-direct MQTT for the main site

- **Recommendation:** Use server-side MQTT ingestion only: the live-map FastAPI service with `paho-mqtt==2.1.0` and `@michaelhart/meshcore-decoder@0.3.0`, or the existing Node collector with `mqtt@5.15.1` if retained. Expose browser updates through the live-map WebSocket/API rather than connecting the Next UI directly to the MQTT broker.
- **Rationale:** MQTT.js supports browsers only over WebSockets (`ws://`/`wss://`), which complicates authentication and exposes broker topology. The live-map already handles MQTT reconnects, presence, route decoding, and WebSocket fan-out. Server-side ingestion is simpler to secure and reason about.
- **Confidence:** HIGH
- **Source:** Official/GitHub docs + npm CLI — https://github.com/mqttjs/MQTT.js; https://github.com/yellowcooln/meshcore-mqtt-live-map; `npm view mqtt version`; `npm view @michaelhart/meshcore-decoder version`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not put MQTT credentials or broker URLs in client-side Next code. Do not build a second real-time protocol layer when the live-map service already streams updates.

### ITEM-stack-12: Keep MDX for guides/blog, but configure it correctly for Next 16/Turbopack

- **Recommendation:** Keep local MDX for guides and blog content with `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `remark-gfm`, `rehype-slug`, `gray-matter`, and `reading-time`, but convert `next.config.js` to the official MDX wrapper (`next.config.mjs` or compatible CJS) and include `pageExtensions` if MDX files should be routable/importable. Add `@types/mdx@2.0.13`.
- **Rationale:** The repo already has MDX dependencies and `mdx-components.tsx`, but `next.config.js` is currently empty. Next’s App Router MDX docs state `mdx-components.tsx` is required and show the plugin/config shape. This keeps long-form community guides maintainable while the redesign changes UI and integrations.
- **Confidence:** HIGH
- **Source:** Official docs + codebase — https://nextjs.org/docs/app/guides/mdx; `/Users/cjvana/Documents/GitHub/denvermc-org/next.config.js`; `/Users/cjvana/Documents/GitHub/denvermc-org/mdx-components.tsx`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not move guides/blog into a CMS for this scope. Do not rely on `next-mdx-remote` unless remote MDX is actually required; local MDX and filesystem content are enough for the current repo.

### ITEM-stack-13: Vendor selected Colorado Mesh icon assets at build time, do not hotlink them

- **Recommendation:** Pull selected SVG/PNG assets from `Colorado-Mesh/icons` into this repo’s `public/` during implementation, preserving credit to megabear/KD5IHC and confirming license/permission before distribution. Use SVGs for scalable UI marks and PNG/ICO only for favicons/PWA manifests.
- **Rationale:** The icons repo contains platform icon sets and source SVGs but no explicit license metadata. The new site needs deterministic Docker builds and should not depend on GitHub raw asset availability at runtime. Current public assets still include Denver/current logos and should be replaced as part of the rebrand.
- **Confidence:** MEDIUM
- **Source:** GitHub + codebase — https://github.com/Colorado-Mesh/icons; `/Users/cjvana/Documents/GitHub/denvermc-org/public`; `/Users/cjvana/Downloads/meshcore/public`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not hotlink GitHub assets in production pages. Do not copy all platform icon files into the web image; only ship web/PWA-relevant assets. Do not assume license from absence of a LICENSE file.

### ITEM-stack-14: Use Docker Compose plus a reverse proxy for local/prod topology

- **Recommendation:** Define a root `docker-compose.yml` with at least `site` (Next), `live-map` (FastAPI/Leaflet), `utilities` (Flask), and optionally `proxy` (Caddy or Traefik) services. Route `meshcore.coloradomesh.org/` to Next, `/map` or `/live-map` to live-map, and `/utilities` to Flask utilities, with persistent volumes for live-map `/data` and `/backup`.
- **Rationale:** The project is now a multi-service web app, not a single static site. Compose keeps local development and release smoke tests close to production, and a reverse proxy solves path/domain integration without forcing all technologies into one runtime. Both external target projects already provide Docker assets.
- **Confidence:** HIGH
- **Source:** GitHub + codebase — https://github.com/yellowcooln/meshcore-mqtt-live-map; https://github.com/Colorado-Mesh/meshcore-utilities-site; `/Users/cjvana/Documents/GitHub/denvermc-org/services/mqtt-collector/docker-compose.yml`
- **Checked:** 2026-05-05
- **Alternatives rejected:** Do not deploy all services as independent unrelated sites with no shared routing. Do not force Python services into the Next Docker image. Do not use Kubernetes unless operational requirements later demand it.

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-stack-1 | HIGH | Official docs + codebase | https://nextjs.org/docs/app/guides/upgrading/version-16; `/Users/cjvana/Documents/GitHub/denvermc-org/package.json` |
| ITEM-stack-2 | HIGH | Official docs + codebase | https://nodejs.org/en/about/releases/; CI/Docker files |
| ITEM-stack-3 | HIGH | Official docs | https://nextjs.org/docs/app/api-reference/config/next-config-js/output; https://docs.docker.com/guides/nextjs/containerize/ |
| ITEM-stack-4 | HIGH | Official docs | https://docs.github.com/en/actions/publishing-packages/publishing-docker-images; https://docs.docker.com/build/ci/github-actions/manage-tags-labels/ |
| ITEM-stack-5 | HIGH | Official docs + local files | https://tailwindcss.com/docs/installation/framework-guides/nextjs; `/Users/cjvana/Downloads/meshcore/screens.jsx` |
| ITEM-stack-6 | HIGH | GitHub upstream | https://github.com/yellowcooln/meshcore-mqtt-live-map |
| ITEM-stack-7 | HIGH | GitHub upstream | https://github.com/yellowcooln/meshcore-mqtt-live-map |
| ITEM-stack-8 | HIGH | GitHub upstream | https://github.com/Colorado-Mesh/meshcore-utilities-site |
| ITEM-stack-9 | MEDIUM | Official docs + GitHub upstream | https://flask.palletsprojects.com/en/stable/changes/; https://github.com/Colorado-Mesh/meshcore-utilities-site |
| ITEM-stack-10 | MEDIUM | Official docs + codebase | https://docs.turso.tech/sdk/ts/quickstart; https://tursodatabase.github.io/libsql-client-ts/ |
| ITEM-stack-11 | HIGH | GitHub docs + npm CLI | https://github.com/mqttjs/MQTT.js; https://github.com/yellowcooln/meshcore-mqtt-live-map |
| ITEM-stack-12 | HIGH | Official docs + codebase | https://nextjs.org/docs/app/guides/mdx |
| ITEM-stack-13 | MEDIUM | GitHub upstream + codebase | https://github.com/Colorado-Mesh/icons |
| ITEM-stack-14 | HIGH | GitHub upstream + codebase | https://github.com/yellowcooln/meshcore-mqtt-live-map; https://github.com/Colorado-Mesh/meshcore-utilities-site |

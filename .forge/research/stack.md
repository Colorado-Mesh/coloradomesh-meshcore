# Stack Research: Colorado MeshCore Site Hardening Pass

Checked: 2026-05-06

Scope: brownfield Next.js site at `/Users/cjvana/Documents/GitHub/denvermc-org`, plus upstream parity inspection of `/tmp/meshcore-utilities-site` and `/tmp/meshcore-mqtt-live-map`.

### ITEM-stack-1: Keep the site on Next.js 16 + React 19 with Node 24 LTS

- **Recommendation:** Keep the current core stack: Next.js `16.2.5`, React/React DOM `19.2.x`, TypeScript `5.x`, npm lockfile, and Node `24` for local, CI, and Docker. Treat Node 24 as the deployment baseline, not merely a permissive version range.
- **Rationale:** The repo is already on Next 16.2.5, React 19.2.3, TypeScript 5, and `node:24-alpine`. Next 16 officially requires Node 20.9+ and TypeScript 5.1+, while Node 24 is Active LTS in 2026. Staying on the existing stack avoids a rewrite and keeps alignment with React Leaflet v5's React 19 requirement.
- **Confidence:** HIGH
- **Source:** Local repo + Official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`; `/Users/cjvana/Documents/GitHub/denvermc-org/Dockerfile`; https://nextjs.org/docs/app/guides/upgrading/version-16; https://github.com/nodejs/Release
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not downgrade to Next 15/React 18; it would fight the installed React Leaflet v5 stack. Do not port the Flask utilities site wholesale; the current deliverable is a consolidated Next.js site.

### ITEM-stack-2: Use no application database; keep content/static parity data in-repo and live state external

- **Recommendation:** Do not add Postgres/Supabase/Redis for this pass. Keep blog/guides/static parity data as MDX/TypeScript/JSON in the repo, keep short-lived live-map aggregation in server memory, and rely on `meshcore-mqtt-live-map` for persistent MQTT state/history.
- **Rationale:** The current repo has static MDX content, static TS data files, and API routes that proxy/normalize map data. The live-map upstream already persists device state, route history, peer history, backups, and optional coverage caches. Adding a database to the site would duplicate upstream responsibilities and create operational work without solving the audit/parity goal.
- **Confidence:** HIGH
- **Source:** Local repo + Upstream clone — `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`; `/tmp/meshcore-mqtt-live-map/README.md`; `/tmp/meshcore-mqtt-live-map/ARCHITECTURE.md`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not add Supabase just because CSP already allows it; there is no current product requirement for user accounts or durable site-owned map state. Do not store MQTT history in Next.js API route globals beyond transient cache.

### ITEM-stack-3: Consume `meshcore-mqtt-live-map` through its `/api/nodes` API as the primary integration

- **Recommendation:** Treat yellowcooln's live map as a separate decoder/state service and configure this site with `MESHCORE_LIVE_MAP_API_URL=<live-map>/api/nodes`, `mode=full`, and server-side token support. Keep direct MQTT support as a fallback only for already-decoded JSON payloads.
- **Rationale:** The upstream live map decodes raw MeshCore packets using `@michaelhart/meshcore-decoder`, tracks MQTT presence, stores state/history, exposes `/api/nodes`, `/snapshot`, `/stats`, `/peers/{id}`, and supports `PROD_TOKEN`. The current site already has server-side token handling and an API-normalization path, but raw direct MQTT in this repo cannot match upstream's route decoding, multibyte path handling, peer history, or persistence.
- **Confidence:** HIGH
- **Source:** Upstream clone + Local repo — `/tmp/meshcore-mqtt-live-map/README.md`; `/tmp/meshcore-mqtt-live-map/backend/app.py`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`; npm registry `npm view @michaelhart/meshcore-decoder version` returned `0.3.0`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not subscribe the Next.js site directly to raw `meshcore/#` packets for parity; that would recreate the FastAPI service. Do not expose the live-map token to browsers; keep token use server-side only.

### ITEM-stack-4: Keep Leaflet 1.9.4 + React Leaflet 5, and make tile configuration actually runtime-configurable

- **Recommendation:** Keep `leaflet@1.9.4`, `react-leaflet@5.0.0`, and `@types/leaflet`, but harden the current implementation by reading the configured tile URL/attribution instead of hardcoding CARTO tiles in `NetworkMap.tsx`.
- **Rationale:** React Leaflet v5 is the right binding for React 19 and requires React, React DOM, and Leaflet peer dependencies. The current repo declares `NEXT_PUBLIC_MAP_TILE_URL` and `getMapRuntimeConfig().mapTileUrl`, but `NetworkMap.tsx` hardcodes `https://{s}.basemaps.cartocdn.com/dark_all/...`; that makes compose/env configuration misleading and complicates CSP/tile-provider changes.
- **Confidence:** HIGH
- **Source:** Local repo + Official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/config.ts`; https://react-leaflet.js.org/docs/start-installation/; https://leafletjs.com/reference
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not migrate to Mapbox GL/MapLibre for this pass; Leaflet is already present, stable, and matches both the current implementation and upstream live-map UI. Do not adopt Leaflet 2 alpha.

### ITEM-stack-5: Add Zod for runtime validation of env, live-map payloads, and API responses

- **Recommendation:** Add `zod@4.4.3` and use schemas for runtime env parsing, `meshcore-mqtt-live-map` `/api/nodes` responses, internal `/api/map/*` responses, and external geocoding responses.
- **Rationale:** Current map normalization accepts many payload shapes defensively but without a schema boundary. The live-map upstream documents node fields (`public_key`, `name`, `device_role`, `last_seen`, `timestamp`, `location.latitude/longitude`) and token-protected modes. Zod gives type inference plus runtime checks and fits the strict TypeScript repo without introducing a database or RPC framework.
- **Confidence:** HIGH
- **Source:** Local repo + Official docs + npm registry — `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/normalize.ts`; https://zod.dev/; npm registry `npm view zod version` returned `4.4.3`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not rely only on TypeScript interfaces for network data; they vanish at runtime. Do not add a heavier API framework for two simple internal map endpoints.

### ITEM-stack-6: Add AJV-based schema parity checks for upstream serial command profiles

- **Recommendation:** Add `ajv@8.20.0` or a small schema-validation script and vendor/check the upstream `serial_commands.schema.json` plus `default_serial_commands.json` as fixtures. CI should fail when the in-repo `DEFAULT_SERIAL_COMMAND_PROFILE` drifts unintentionally from upstream command IDs, confirmation flags, line endings, baud defaults, or destructive-action safeguards.
- **Rationale:** The upstream utilities site defines a JSON schema and canonical serial command profile. The current Next site reimplements the profile in TypeScript and currently appears close, but there is no automated parity guard. Schema/golden checks are cheaper and safer than importing the whole Flask/Python stack.
- **Confidence:** HIGH
- **Source:** Upstream clone + Local repo — `/tmp/meshcore-utilities-site/serial_commands.schema.json`; `/tmp/meshcore-utilities-site/static/data/default_serial_commands.json`; `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/tools/serial-commands.ts`; npm registry `npm view ajv version` returned `8.20.0`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not hand-audit serial command parity on every release. Do not install Python/Flask just to validate a JSON profile.

### ITEM-stack-7: Keep Web Serial native; test it with typed mocks, not browser-specific serial libraries

- **Recommendation:** Keep the current native Web Serial implementation and add unit tests with mocked `navigator.serial`, `ReadableStream`, and `WritableStream` for connection state, command sends, destructive confirmations, disconnect cleanup, and unsupported/insecure-context messaging.
- **Rationale:** Web Serial is limited to secure contexts and Chromium-family desktop browsers, which the page already communicates. The current TypeScript interfaces keep the browser API isolated and avoid a dependency that cannot make Firefox/Safari support exist. The best hardening is deterministic behavior tests and accurate fallback copy.
- **Confidence:** HIGH
- **Source:** Local repo + Web docs — `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/tools/SerialUsbTool.tsx`; https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API; https://developer.chrome.com/docs/capabilities/serial; https://caniuse.com/web-serial
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not add a serial-port polyfill for browsers; Web Serial support is platform-gated. Do not try to run hardware serial tests in normal PR CI.

### ITEM-stack-8: Add Vitest + React Testing Library for fast unit and component tests

- **Recommendation:** Add `vitest@4.1.5`, `@vitejs/plugin-react@6.0.1`, `jsdom@29.1.1`, `@testing-library/react@16.3.2`, `@testing-library/dom`, and `vite-tsconfig-paths@6.1.1`. Add scripts such as `test`, `test:run`, and include `npm run test:run` in PR CI.
- **Rationale:** The current repo has lint, typecheck, and build scripts but no tests. Next.js officially documents Vitest + React Testing Library for unit testing synchronous Server Components and Client Components, while recommending E2E for async Server Components. High-value targets here are map normalization/status thresholds, rate-limit behavior, serial command helpers, naming validation, prefix matrix logic, and API response shape validation.
- **Confidence:** HIGH
- **Source:** Local repo + Official docs + npm registry — `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`; https://nextjs.org/docs/app/guides/testing/vitest; npm registry version checks on 2026-05-06
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not use Jest for new tests unless a blocker appears; Vitest is faster to add for this TypeScript/client-heavy codebase. Do not try to unit-test async App Router pages as the primary coverage strategy.

### ITEM-stack-9: Add Playwright E2E smoke tests for critical routes and tool flows

- **Recommendation:** Add `@playwright/test@1.59.1` with Chromium-only PR smoke tests against a production build. Cover `/`, `/map`, `/tools/repeater-name`, `/tools/companion-name`, `/tools/prefix-matrix`, `/tools/serial-usb`, the mobile nav breakpoint, 404/global error basics, and map API empty/sample-data states.
- **Rationale:** Next.js recommends Playwright for E2E testing and explicitly says it is the right tool for async components. This site's risk is not algorithm-only; it is route wiring, browser APIs, dynamic map import/Leaflet rendering, responsive navigation, and UI state. A small Chromium suite is pragmatic for normal PRs; full browser matrices can be scheduled.
- **Confidence:** HIGH
- **Source:** Official docs + Local repo — https://nextjs.org/docs/app/guides/testing/playwright; https://playwright.dev/docs/ci; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app`; npm registry `npm view @playwright/test version` returned `1.59.1`
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not rely on `next build` as UX verification. Do not run Chromium+Firefox+WebKit on every PR initially; that is likely too slow/noisy for pragmatic CI hardening.

### ITEM-stack-10: Add `@axe-core/playwright` and Lighthouse CI for non-visual UI/UX verification

- **Recommendation:** Add `@axe-core/playwright@4.11.3` to the Playwright suite for WCAG A/AA page-state scans, and add `@lhci/cli@0.15.1` as a scheduled or optional PR check for performance/accessibility regressions on a small route set.
- **Rationale:** The session constraint says visual aesthetics must be delegated, but automated a11y/performance checks are non-visual hardening. Playwright's official accessibility guidance supports axe scans in current page state and warns that automated checks are partial; Lighthouse CI is built for regression budgets and PR/status reporting.
- **Confidence:** HIGH
- **Source:** Official docs + npm registry — https://playwright.dev/docs/next/accessibility-testing; https://googlechrome.github.io/lighthouse-ci/; npm registry version checks on 2026-05-06
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not add Percy/Chromatic as a default requirement in this Codex-backed pass; those are visual-diff tools and should be owned by the Opus UI workflow if desired. Do not make broad Lighthouse performance budgets blocking before baselines are captured.

### ITEM-stack-11: Harden Next.js config with typed routes, typegen, and middleware/proxy migration awareness

- **Recommendation:** Enable `typedRoutes: true` in `next.config.js`, add a CI step for `next typegen` before `tsc --noEmit`, and plan to rename `src/middleware.ts` to `src/proxy.ts` when implementing code changes.
- **Rationale:** Next.js 16 has stable route-aware typing and generated `.next/types`; this repo has many internal links and App Router pages where typed route checks would catch stale paths. Next 16 also deprecates `middleware` in favor of `proxy`; the current repo still has `src/middleware.ts` for API rate limiting, so the hardening pass should not ignore the migration warning.
- **Confidence:** HIGH
- **Source:** Local repo + Official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/src/middleware.ts`; `/Users/cjvana/Documents/GitHub/denvermc-org/tsconfig.json`; https://nextjs.org/docs/app/api-reference/config/typescript; https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes; https://nextjs.org/docs/app/guides/upgrading/version-16
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not wait for runtime navigation bugs to discover broken links. Do not suppress Next 16 proxy migration warnings by pinning older framework versions.

### ITEM-stack-12: Expand CI with fast tests, dependency review, CodeQL, Dependabot groups, Docker cache, smoke run, and SBOM

- **Recommendation:** Update CI to run `npm ci`, lint, typegen/typecheck, Vitest, Playwright smoke, build, and Docker build with GitHub Actions cache. Add dependency-review for PRs, CodeQL JavaScript/TypeScript scanning, grouped Dependabot updates for npm and GitHub Actions, a container smoke run hitting `/api/map/stats`, and `sbom: true` on Docker release.
- **Rationale:** Current CI only runs ESLint, typecheck, Next build, Docker build, and a separate high-severity `npm audit`. Docker release already has provenance but not SBOM. GitHub officially supports CodeQL for JavaScript/TypeScript, Dependabot grouping, and dependency review; Docker officially supports GHA build cache plus SBOM/provenance attestations. A smoke run catches broken standalone output that build-only Docker checks miss.
- **Confidence:** HIGH
- **Source:** Local repo + Official docs — `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/security.yml`; `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/docker-release.yml`; https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql; https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference; https://docs.docker.com/build/cache/backends/gha/; https://docs.docker.com/build/ci/github-actions/attestations/
- **Checked:** 2026-05-06
- **Alternatives rejected:** Do not make heavyweight full-browser E2E or Trivy image scans required on every PR at first; keep those scheduled/release-gated if added. Do not rely solely on `npm audit` for supply-chain hardening.

## Confidence Summary

| Item ID | Level | Source Type | URL/Reference |
|---------|-------|-------------|---------------|
| ITEM-stack-1 | HIGH | Local repo + Official docs | `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`; https://nextjs.org/docs/app/guides/upgrading/version-16; https://github.com/nodejs/Release |
| ITEM-stack-2 | HIGH | Local repo + Upstream clone | `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/store.ts`; `/tmp/meshcore-mqtt-live-map/README.md`; `/tmp/meshcore-mqtt-live-map/ARCHITECTURE.md` |
| ITEM-stack-3 | HIGH | Upstream clone + Local repo + npm registry | `/tmp/meshcore-mqtt-live-map/README.md`; `/tmp/meshcore-mqtt-live-map/backend/app.py`; `npm view @michaelhart/meshcore-decoder version` |
| ITEM-stack-4 | HIGH | Local repo + Official docs | `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/NetworkMap.tsx`; https://react-leaflet.js.org/docs/start-installation/; https://leafletjs.com/reference |
| ITEM-stack-5 | HIGH | Local repo + Official docs + npm registry | `/Users/cjvana/Documents/GitHub/denvermc-org/src/lib/map/normalize.ts`; https://zod.dev/; `npm view zod version` |
| ITEM-stack-6 | HIGH | Upstream clone + Local repo + npm registry | `/tmp/meshcore-utilities-site/serial_commands.schema.json`; `/tmp/meshcore-utilities-site/static/data/default_serial_commands.json`; `npm view ajv version` |
| ITEM-stack-7 | HIGH | Local repo + Web docs | `/Users/cjvana/Documents/GitHub/denvermc-org/src/components/tools/SerialUsbTool.tsx`; https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API; https://developer.chrome.com/docs/capabilities/serial |
| ITEM-stack-8 | HIGH | Local repo + Official docs + npm registry | `/Users/cjvana/Documents/GitHub/denvermc-org/package.json`; https://nextjs.org/docs/app/guides/testing/vitest; npm version checks |
| ITEM-stack-9 | HIGH | Official docs + Local repo | https://nextjs.org/docs/app/guides/testing/playwright; https://playwright.dev/docs/ci; `/Users/cjvana/Documents/GitHub/denvermc-org/src/app` |
| ITEM-stack-10 | HIGH | Official docs + npm registry | https://playwright.dev/docs/next/accessibility-testing; https://googlechrome.github.io/lighthouse-ci/; npm version checks |
| ITEM-stack-11 | HIGH | Local repo + Official docs | `/Users/cjvana/Documents/GitHub/denvermc-org/src/middleware.ts`; https://nextjs.org/docs/app/api-reference/config/typescript; https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes |
| ITEM-stack-12 | HIGH | Local repo + Official docs | `/Users/cjvana/Documents/GitHub/denvermc-org/.github/workflows/ci.yml`; https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql; https://docs.docker.com/build/ci/github-actions/attestations/ |

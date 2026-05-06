# Step 10 Execution Plan: Final integration validation

## Goal
Validate the redesigned Colorado MeshCore site across automated checks, browser runtime behavior, Docker runtime behavior, route removals, and stale-reference guards before final review.

## Current Code Observations
- The working tree was clean before starting Step 10.
- Steps 1-9 are committed, with Step 9 adding `.github/workflows/docker-release.yml` and a no-push Docker smoke job in `.github/workflows/ci.yml`.
- `src/app/sitemap.ts` includes current core routes plus `/tools` subroutes and does not include `/observer`.
- `src/components/Navigation.tsx` and `src/components/Footer.tsx` link to current Home, Map, Tools, Guides, Blog, About, and Discord destinations with no `/observer` links.
- `src/components/index.ts` no longer exports observer/health components; it exports the current brand, map, stats, and tool components.
- `package.json` targets Node `>=24 <26` and has `lint`, `typecheck`, and `build` scripts.
- `Dockerfile` uses Node 24 standalone output and runs as non-root `nextjs`.
- `compose.yaml` serves the app on port 3000 and healthchecks `/api/map/stats`.
- The stale-reference grep currently reports two comment-only references: `src/lib/utils.ts` and `src/lib/data/landmarks.ts`.

## Files to Change
- `.forge/steps/step-10-plan.md` — record Step 10 execution and any discovered fixes before editing.
- `src/lib/utils.ts` — remove stale Denver MeshCore wording from a file header comment.
- `src/lib/data/landmarks.ts` — update the stale naming-standard comment to Colorado MeshCore.
- Additional files only if validation reveals integration defects that are in scope for Step 10.

## Ordered Implementation Checklist
1. Write this focused Step 10 execution plan from the master plan and current code observations.
2. Apply the known stale-comment cleanup in `src/lib/utils.ts` and `src/lib/data/landmarks.ts`.
3. Run automated verification: `npm run lint`, `npm run typecheck`, `npm run build`, `docker build -t colorado-meshcore-site:final .`, and `docker compose config`.
4. Run stale-reference guards for old branding, old observer links, old public metrics APIs, and prototype/mock artifacts.
5. Start the dev server and browser-validate the homepage, `/map`, `/tools`, tool subroutes, `/guides`, a guide page, `/blog`, a blog post, `/about`, mobile navigation, and intentional `/observer` 404 behavior.
6. Start the Docker runtime and repeat golden-path browser/API validation against the container-served app.
7. Inspect browser console and network output for hydration errors, missing assets, blocked CSP, failed map/API requests, or unexpected legacy endpoint calls.
8. Fix only integration defects discovered by validation, updating this plan before any additional file edits.
9. Stage Step 10 files, request Forge review, save `.forge/reviews/claude-step-10.json`, and commit if approved.
10. Run final full-project Claude review, save `.forge/reviews/final-claude-review.json`, and address blockers if any.

## Interfaces and Data Contracts
- Supported public live-data endpoints remain `GET /api/map/nodes` and `GET /api/map/stats`.
- Removed legacy observer and metric routes should intentionally 404 with no redirects.
- Docker runtime must serve the Next standalone app on port 3000 without requiring local `.env` secrets.
- Browser map and stats flows must use `/api/map/*`, not `/api/stats`, `/api/health`, or `/api/nodes`.

## Verification Plan
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Automated: `npm run build`
- Docker: `docker build -t colorado-meshcore-site:final .`
- Docker: `docker compose config`
- API/route: curl `/`, `/api/map/stats`, `/api/map/nodes`, and `/observer` in dev and Docker runtimes.
- Regression: `grep -R "Denver MeshCore\|denvermc.com\|/observer\|/api/stats\|/api/health\|/api/nodes" -n src content public .github Dockerfile compose.yaml package.json || true`
- Manual/browser: homepage, `/map`, `/tools`, `/tools/repeater-name`, `/tools/companion-name`, `/tools/prefix-matrix`, `/tools/serial-usb`, `/guides`, `/guides/getting-started`, `/blog`, a blog post, `/about`, responsive navigation, console, and network.

## Stop Conditions
- Stop and ask the user before adding new product features beyond fixing validation defects.
- Stop before pushing tags, publishing releases, or pushing Docker images.
- Stop before adding compatibility redirects for removed routes, because hard removal was an explicit project decision.
- Stop if Docker or browser validation fails due to missing local platform capabilities rather than an app defect, and report the unvalidated area explicitly.

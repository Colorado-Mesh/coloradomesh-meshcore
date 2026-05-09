# Step 1 Execution Plan: Central site metadata and route coverage foundation

## Goal
Create a typed route/site metadata foundation so navigation, footer, sitemap, breadcrumbs, and tests can share one source of truth.

## Current Code Observations
- `src/components/Navigation.tsx` hardcodes primary links as Home, Map, Tools, Guides, Blog, About.
- `src/components/Footer.tsx` has separate hardcoded quick/community/resource lists that only partially align with current IA.
- `src/app/sitemap.ts` hardcodes static pages and currently omits visible `/guides`, guide child pages, and `/use-cases` index while separately auto-discovering use-case children and dynamic blog/tag pages.
- `src/app/start/page.tsx` currently redirects to `/guides/getting-started`, but approved plan will later convert it into a real chooser hub.
- `tests/e2e/smoke.spec.ts` currently treats only `/`, `/map`, and `/tools` as critical pages.
- `package.json` already has Vitest, Playwright, axe, Lighthouse, lint, typecheck, and build scripts.

## Files to Change
- `src/lib/site.ts` — add typed site metadata, route helper functions, primary nav/footer/sitemap/test route derivations.
- `src/lib/__tests__/site.test.ts` — add unit tests for route metadata invariants and sitemap-visible coverage.
- `src/app/sitemap.ts` — derive static sitemap entries from the metadata while preserving blog and use-case child discovery behavior.
- `.forge/steps/step-1-plan.md` — this execution plan.

## Ordered Implementation Checklist
1. Define the `SiteRoute` type and metadata for current static public routes, including `/start`, `/map`, `/tools`, all tool pages, `/guides`, all guide pages, `/why-meshcore`, `/use-cases`, `/blog`, and `/about`.
2. Add helper functions for route lookup, primary nav links, footer groups, static sitemap entries, public route lists, and critical test routes.
3. Update `src/app/sitemap.ts` to use metadata-derived static sitemap routes while preserving dynamic blog posts/tags and auto-discovered use-case child routes.
4. Add unit tests for unique paths, valid parent paths, six approved primary nav labels, sitemap inclusion for visible guide/use-case pages, and route lookup behavior.
5. Run targeted unit tests, typecheck, and build.
6. Stage Step 1 files, run the Forge reviewer, address blockers if any, and commit Step 1.

## Interfaces and Data Contracts
- `SiteRoute.path`: absolute internal route beginning with `/`.
- `SiteRoute.label`: user-facing label for route cards/links.
- `SiteRoute.navLabel`: optional shorter/primary navigation label.
- `SiteRoute.section`: route group used for navigation and footer grouping.
- `SiteRoute.parent`: optional parent route path that must exist.
- `SiteRoute.primaryNavOrder`: ordered numeric top-nav position when present.
- `SiteRoute.footerGroup`: optional footer grouping key.
- `SiteRoute.sitemap`: false or sitemap metadata with `changeFrequency` and `priority`.
- `getPrimaryNavLinks()` returns the approved top-level labels: `Get Started`, `Live Map`, `Tools`, `Guides`, `Learn`, `About`.
- `getStaticSitemapRoutes(BASE_URL, lastModified)` returns static sitemap entries without dynamic blog post/tag duplication.

## Verification Plan
- Automated: `npm run test:unit -- src/lib/__tests__/site.test.ts`, `npm run typecheck`, `npm run build`.
- Manual: inspect generated sitemap code behavior and ensure `/guides`, guide child pages, and `/use-cases` index are now included by metadata.
- Regression: existing dynamic blog and use-case child sitemap generation remains intact; no navigation rendering changes occur in this step.

## Stop Conditions
- If route metadata cannot represent the current route inventory without introducing new routes, stop and adjust the plan before implementation.
- If sitemap migration would drop existing blog posts, tag pages, or use-case child pages, stop and preserve existing logic.
- If tests reveal many currently visible pages missing from the app tree, stop and confirm scope before inventing routes.

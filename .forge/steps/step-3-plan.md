# Step 3 Execution Plan: `/start` chooser hub and homepage journey alignment

## Goal
Replace the redirect-only `/start` route with a canonical `Get Started` chooser hub, then align homepage journey links around newcomer, operator, and community paths without changing public URLs or adding new workflows.

## Current Code Observations
- `src/app/start/page.tsx` currently only calls `redirect('/guides/getting-started')`, so the approved `Get Started` nav item lands on a redirect instead of a useful hub.
- `src/app/page.tsx` already has homepage hero CTAs, promoted tool cards, and a “Pick a path” section, but the cards are rendered with the fixed label `Operator` even for `Newcomer` and community-adjacent journeys.
- `src/app/guides/getting-started/page.tsx` already teaches first-radio setup and links onward to radio settings, repeater setup, naming standard, Discord, and the live map.
- `src/app/guides/repeater-setup/page.tsx` already has deep repeater setup, serial preflight, naming, and Discord handoffs.
- `src/app/tools/page.tsx` already presents the four current tools as first-class cards and links back to the live map and Discord.
- `src/app/map/page.tsx` links to `/start` using “Quick start” language; if touched, that label should become consistent with `Get Started`.
- `tests/e2e/smoke.spec.ts` currently smoke/a11y tests `/`, `/map`, and `/tools`, and has navigation tests, but does not assert `/start` as a real page or validate the three journey paths.

## Files to Change
- `src/app/start/page.tsx` — replace redirect with a server-rendered chooser hub with metadata, breadcrumbs, JSON-LD, three journey cards, and supporting links.
- `src/app/page.tsx` — align hero CTAs and “Pick a path” copy/cards with `Get Started`, `Live Map`, `Tools`, and the newcomer/operator/community journey model.
- `src/app/map/page.tsx` — only update `/start` link labels if needed to remove “Quick Start”/`Get Started` drift.
- `tests/e2e/smoke.spec.ts` — add `/start` to critical coverage and assert the hub exposes the three paths plus links to guides, map, tools, and about/community destinations.

## Ordered Implementation Checklist
1. Delegate the frontend/page implementation to Opus UI with this execution plan, because this Codex-backed session must not directly implement visual/frontend page work.
2. In `/start`, add `Metadata` with title/description/canonical `/start` and Open Graph/Twitter fields following existing page patterns.
3. In `/start`, add breadcrumb JSON-LD for Home → Get Started and visible breadcrumbs using existing `Breadcrumbs`/`JsonLd` helpers.
4. Build the `/start` page from existing brand components (`HeroPanel`, `SectionEyebrow`, `ToolCard`, `NetworkPanel` where useful) rather than introducing new styling systems.
5. Add three balanced journey cards: Newcomer, Operator, and Community, each with one primary action and 2-3 supporting links.
6. Route newcomer links to `/guides/getting-started`, `/guides/radio-settings`, and `/guides/naming-standard`; operator links to `/tools`, `/map`, and `/guides/repeater-setup`; community links to `/about`, Discord, `/why-meshcore`, `/use-cases`, or `/blog` as appropriate.
7. Update homepage CTAs so the main first-step path uses `/start`/`Get Started` while keeping Live Map and Tools highly visible.
8. Update homepage journey card metadata so audience labels are not all rendered as `Operator`; use `Newcomer`, `Operator`, and `Community` or equivalent.
9. Remove “Quick Start” wording for `/start` if it appears in touched cross-links; use `Get Started` consistently.
10. Expand Playwright smoke coverage for `/start` and the journey paths without asserting fragile visual layout details.

## Interfaces and Data Contracts
- `/start` remains an internal public route and must no longer call `redirect()`.
- Visible onboarding terminology is `Get Started`.
- Public route URLs remain unchanged.
- External Discord links must keep `target="_blank"` and `rel="noopener noreferrer"`.
- The hub must not add legal, safety, radio, privacy, or licensing disclaimers beyond existing site copy.
- The hub must not add node submission, repeater submission, account, or update workflows.
- Tests should assert accessible headings/links and route reachability, not CSS classes or visual positioning.

## Verification Plan
- Automated: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
- Automated: `npm run test:a11y`
- Automated: `npm run build`
- Manual/browser: start a production server and check `/` and `/start` at desktop and mobile widths; verify the hero CTAs, three journey cards, supporting links, and no console errors.
- Regression: confirm top navigation still marks `Get Started` active on `/start`, Live Map/Tools/Guides/Learn active states still work, and `/map`/`/tools` still load.

## Stop Conditions
- Stop and ask before adding any new route, dependency, form, submission/update workflow, or disclaimer.
- Stop and update the master plan before changing the approved top-nav labels or public URL structure.
- Stop if Opus UI changes unrelated visual design beyond the Step 3 page/journey scope.
- Stop if verification reveals a failure requiring broad map/tool/client-component rewrites outside the Step 3 journey work.

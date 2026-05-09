# Step 5 Execution Plan: Opus-delegated component consistency and visual UX polish

## Goal
Apply moderate visual and component consistency to the completed IA surfaces without changing public routes, adding workflows, or using this Codex-backed session to directly implement frontend aesthetic changes.

## Current Code Observations
- `HeroPanel` already centralizes hero spacing, title sizing, background variants, actions, and optional metadata panels for the homepage, `/start`, `/map`, `/tools`, and `/guides`.
- `ToolCard` is the shared card primitive for both tools and guide/action cards, but some pages still use hand-built panel links with similar styling.
- `Navigation` and `MobileMenu` already consume route metadata and expose active state, skip-link-compatible structure, and accessible mobile dialog behavior.
- `Footer` uses metadata-derived groups and safe external links, with a darker mountain treatment that should remain recognizable.
- Step 4 introduced consistent IA handoffs across `/tools`, `/guides`, and high-impact guide pages; Step 5 should polish consistency, not rewrite the IA.
- The Forge reviewer approved Step 4 and noted one minor non-blocking label inconsistency: homepage still says `Web Serial console` while touched pages use `Serial USB console`.

## Files to Change
- `src/components/brand/HeroPanel.tsx` — Opus may refine reusable hero spacing/responsive presentation if needed.
- `src/components/brand/ToolCard.tsx` — Opus may improve shared card consistency/flex behavior if needed.
- `src/components/Navigation.tsx` — Opus may polish current-state/focus/header visual treatment without changing metadata contracts.
- `src/components/MobileMenu.tsx` — Opus may polish mobile menu visual hierarchy while preserving dialog/focus behavior.
- `src/components/Footer.tsx` — Opus may polish footer grouping/spacing while preserving all metadata-derived links.
- `src/app/page.tsx` — Opus may align homepage cards/CTAs with current IA and the `Serial USB console` label.
- `src/app/start/page.tsx` — Opus may align journey cards/hero/CTA rhythm with homepage and hubs.
- `src/app/map/page.tsx` — Opus may align map hero/action cards with the global visual system while preserving map behavior.
- `src/app/tools/page.tsx` — Opus may reduce bespoke panel duplication and align tool sections/cards.
- `src/app/guides/page.tsx` — Opus may align guide cards/handoff panel with tools and homepage.
- Selected guide pages only if needed for visual consistency of newly added handoff blocks; no content or workflow expansion.
- `tests/e2e/smoke.spec.ts` only if Opus makes non-behavioral markup changes that require robust selector updates.

## Ordered Implementation Checklist
1. Invoke `co-ui` from the project root with a scoped prompt for moderate visual/component consistency only.
2. Instruct Opus to preserve all public routes, route metadata/canonical URLs, JSON-LD, tool/guide visibility, active nav behavior, mobile menu accessibility, and external-link safety.
3. Instruct Opus not to add dependencies, disclaimers, forms, node/repeater submission/update flows, map feature changes, or broad redesign work.
4. Ask Opus to prioritize shared component consistency across hero panels, cards, CTAs, spacing rhythm, nav/footer current states, and responsive layout.
5. After Opus returns, inspect the diff for scope drift, route removals, accessibility regressions, unsafe external links, and accidental behavior changes in client components.
6. Run automated verification: lint, typecheck, targeted smoke, a11y, and build.
7. Start a current production server and browser-check `/`, `/start`, `/map`, `/tools`, `/guides`, plus representative nested guide/tool pages at desktop and mobile widths.
8. Stage only approved Step 5 source/test files plus this plan, request Forge review, save the review JSON, and commit if approved.

## Interfaces and Data Contracts
- Primary navigation labels remain `Get Started`, `Live Map`, `Tools`, `Guides`, `Learn`, `About`.
- Current public routes remain unchanged, including all four tools and all guide pages.
- Route metadata, sitemap/site metadata helpers, breadcrumbs, and JSON-LD must remain valid.
- `Navigation` and `MobileMenu` must keep active-state and accessibility behavior, including `aria-current`, Escape close, focus handling, and safe external links.
- `ToolCard` props and existing imports must remain compatible unless all call sites are updated safely.
- No new runtime dependencies or package manager changes.

## Verification Plan
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Automated: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4574 PLAYWRIGHT_PORT=4574 npm run test:e2e -- tests/e2e/smoke.spec.ts`
- Automated: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4574 PLAYWRIGHT_PORT=4574 npm run test:a11y`
- Automated: `npm run build`
- Manual: run a current production server on `127.0.0.1:4574` and browser-check `/`, `/start`, `/map`, `/tools`, `/guides`, `/tools/serial-usb`, `/guides/getting-started`, and `/guides/repeater-setup` at desktop and mobile widths.
- Manual: verify keyboard-visible focus/current-state affordances in nav/mobile menu and scan Chrome console for warnings/errors.
- Regression: confirm all four tool links and all guide links remain visible from their hubs.

## Stop Conditions
- Pause if the polish requires new dependencies, new routes, new forms/workflows, or any disclaimer/safety/legal copy.
- Pause if Opus removes or renames current public tool/guide routes or changes map runtime behavior.
- Pause if Opus introduces a broad redesign beyond moderate consistency polish.
- Pause if verification failures require non-visual architectural changes outside this step.

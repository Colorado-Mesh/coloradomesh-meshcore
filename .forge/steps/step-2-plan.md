# Step 2 Execution Plan: Colorado Mesh assets and visual system handoff

## Goal
Replace shell-visible brand visuals with Colorado MeshCore assets and establish reusable prototype-inspired visual primitives through native Opus UI implementation.

## Current Code Observations
- `src/app/globals.css` already defines Colorado-themed tokens, mesh/terrain backgrounds, card styles, and button classes, but the file still describes the app as Denver MeshCore and defaults to a lighter design system outside dark-mode media queries.
- `src/components/Navigation.tsx` hard-codes Denver logo alt text, Denver/MeshCore wordmark text, `/observer` as “Analyzers,” and a nav order that does not include `/tools`.
- `src/components/MobileMenu.tsx` repeats Denver logo alt text, Denver/MeshCore wordmark text, and Denver community footer copy.
- `src/components/Footer.tsx` hard-codes Denver branding, `/observer` analyzer links, old GitHub repository URL, and direct external URLs instead of consuming shared constants.
- The local prototype at `/Users/cjvana/Downloads/meshcore/screens.jsx` defines a night-sky operations-console visual language with mesh teal, sunset orange, mountain silhouettes, mono telemetry labels, and artboards for hero, map, utilities, and observer.
- `co-ui` is available at `/Users/cjvana/.local/bin/co-ui` and prints Claude Code CLI help, so this visual/frontend step can be delegated to native Opus as required.
- A local checkout of `Colorado-Mesh/icons` was not found under `/Users/cjvana/Documents/GitHub`, so the implementation should fetch/copy approved assets from `https://github.com/Colorado-Mesh/icons` during the Opus task or use the existing public logo only if fetching is unavailable and clearly reported.
- `.forge/PLAN.md`, `.forge/PROJECT.md`, `.forge/research/`, and `.forge/.base-ref` remain untracked from the Forge planning phase; they should be staged with this step so the repo contains the approved plan context.

## Files to Change
- `src/app/globals.css` — evolve tokens/utilities toward the prototype-inspired dark operations-console system.
- `src/components/Navigation.tsx` — update shell navigation, brand mark, responsive behavior, and constants usage.
- `src/components/MobileMenu.tsx` — mirror new brand/nav behavior and accessible mobile shell.
- `src/components/Footer.tsx` — update footer brand, links, constants usage, and remove `/observer` prominence.
- New reusable visual primitives under `src/components/`, expected candidates: `BrandMark.tsx`, `TopoBackground.tsx`, `HeroPanel.tsx`, `MetricStrip.tsx`, `ToolCard.tsx`, `NetworkPanel.tsx`, and `SectionEyebrow.tsx`.
- `public/brand/` and public icon/logo files — vendor approved Colorado Mesh icon assets and ensure metadata/manifest paths still exist.
- `public/manifest.json` only if icon paths are updated.
- `.forge/steps/step-2-plan.md` and `.forge/reviews/claude-step-2.json` for the workflow trail.
- Stage existing Forge artifacts: `.forge/.base-ref`, `.forge/PROJECT.md`, `.forge/PLAN.md`, and `.forge/research/*`.

## Ordered Implementation Checklist
1. Invoke `co-ui` from the repo root with an Opus 4.7 xhigh handoff that includes the Step 2 plan, prototype paths, target files, constraints, and instruction not to commit or stage.
2. Have Opus vendor Colorado Mesh icons from `https://github.com/Colorado-Mesh/icons` into `public/brand/`, replacing logo/favicons/PWA icons only when actual assets are available.
3. Have Opus implement shared visual primitives with typed props and no data fetching: brand mark, topo background, section eyebrow, hero/panel, metric strip, tool card, and network panel.
4. Have Opus update `globals.css` tokens/utilities toward the prototype’s dark night-sky console aesthetic while preserving Tailwind v4 validity and existing prose readability.
5. Have Opus update `Navigation`, `MobileMenu`, and `Footer` to consume constants, use Colorado MeshCore branding, include `/tools`, keep `/map`, `/guides`, `/blog`, `/about`, and remove `/observer` as a primary shell link.
6. Inspect Opus changes directly, ensuring the implementation did not copy prototype UMD/Babel runtime code, mock data, or broad homepage/map/tool behavior.
7. Run lint, typecheck, build, and a targeted grep for Denver shell strings and prototype runtime artifacts.
8. Run a dev server and browser-check the shell at desktop/mobile widths for homepage and one content page, including mobile nav open/close and console errors.
9. Stage Step 2 files and Forge planning artifacts, request Forge reviewer review, save JSON, fix findings if needed, then commit.

## Interfaces and Data Contracts
- Visual primitives are regular React components with typed props and no server/client data-fetching side effects.
- `Navigation`, `MobileMenu`, and `Footer` consume shared constants from `src/lib/constants.ts` for brand names and external URLs.
- Public logo/icon paths referenced by metadata and manifest must exist after the asset update.
- Navigation contract for this step: Home, Map, Tools, Guides, Blog, About, and Discord. `/observer` should not be a primary shell link.

## Verification Plan
- Automated: `npm run lint`, `npm run typecheck`, `npm run build`.
- Grep: shell files should not contain `Denver MeshCore`, `Denver`, `denvermc.com`, `/observer`, `ReactDOM.createRoot`, `unpkg.com/react`, or `babel.min.js` except comments/content outside this step.
- Manual: run the dev server, inspect homepage shell, footer, mobile menu, and one content page in desktop and mobile viewport using browser tooling; monitor console errors.
- Regression: root layout, navigation, footer, prose content, manifest icons, and metadata icon paths must still resolve.

## Stop Conditions
- Pause if `co-ui` cannot run or cannot edit files; produce a concise `/handoff-opus-ui` prompt instead of implementing visual work directly in this Codex session.
- Pause if Colorado Mesh icon assets cannot be fetched or their license/structure is unclear enough to prevent safe vendoring.
- Pause if Opus changes map/tool/homepage behavior beyond visual shell primitives; revert or trim to Step 2 scope before review.

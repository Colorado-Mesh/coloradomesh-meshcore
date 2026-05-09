# Step 4 Execution Plan: Tools, guides, and learning IA handoff consistency

## Goal
Make `/tools`, `/guides`, and high-impact guide pages reinforce the approved IA: guides teach, tools do, all current tools remain first-class, and learning/community content stays easy to find without adding new workflows or disclaimers.

## Current Code Observations
- `src/app/tools/page.tsx` already uses the branded `HeroPanel`, `SectionEyebrow`, and `ToolCard` patterns and exposes all four current tools: repeater name, companion name, prefix matrix, and serial USB.
- `/tools` currently groups tools into only two sections, so network planning and field/USB operations can be clarified without changing tool routes.
- `src/app/guides/page.tsx` still uses an older bespoke card layout, copy that frames guides broadly, and no clear action handoff from teaching/reference pages into tools.
- `src/app/guides/getting-started/page.tsx` is an older template with guide links in “Next Steps,” but it does not clearly hand users to `/tools`, `/tools/companion-name`, `/tools/repeater-name`, `/tools/prefix-matrix`, or `/map` after setup.
- Guide pages include interactive or shared components; changes must not break client components on naming/prefix tooling or alter existing public URLs.

## Files to Change
- `src/app/tools/page.tsx` — refine grouping/copy and add contextual guide/map handoffs while preserving all four tool cards and routes.
- `src/app/guides/page.tsx` — update hub copy/layout to teaching/reference framing and add clear action handoffs into tools.
- `src/app/guides/getting-started/page.tsx` — add next-step links from learning/setup into map and relevant tools.
- `src/app/guides/repeater-setup/page.tsx` — add or improve handoffs to repeater naming, prefix planning, serial USB, and live map where relevant.
- `src/app/guides/naming-standard/page.tsx` — ensure naming guide points to the action-oriented naming tools without duplicating the tool workflows.
- `src/app/guides/radio-settings/page.tsx` — add contextual handoffs to repeater setup, live map, and serial USB where useful.
- `src/app/guides/troubleshooting/page.tsx` — add support-oriented handoffs to serial USB, live map, tools, and Discord where appropriate.
- `tests/e2e/smoke.spec.ts` — add assertions for `/tools` tool visibility and `/guides` guide visibility/action handoffs.

## Ordered Implementation Checklist
1. Delegate the visual/frontend page edits to Opus UI with a scoped prompt that preserves routes, metadata, tests, no disclaimers, and no submission/update workflows.
2. Keep `/tools` action-oriented: expose all four tools, refine section labels toward naming/identity, network planning, and field/USB operations, and keep Live Map/relevant guide links contextual.
3. Refresh `/guides` as the teaching/reference hub using existing brand components where appropriate, with cards for all current guide pages and a distinct action handoff area into tools.
4. Add focused next-step blocks to high-impact guides so learning pages hand users to the right tools only after teaching the concept.
5. Update Playwright smoke coverage so `/tools` asserts all current tool cards/links and `/guides` asserts all guide pages plus at least one action handoff into `/tools`.
6. Inspect Opus changes for scope drift, route changes, external link safety, and accidental removal of metadata/schema/breadcrumb patterns.
7. Run automated verification and then browser-check `/tools`, `/guides`, and touched guide pages at desktop and mobile widths.

## Interfaces and Data Contracts
- Tool routes must remain unchanged: `/tools/repeater-name`, `/tools/companion-name`, `/tools/prefix-matrix`, `/tools/serial-usb`.
- Guide routes must remain unchanged: `/guides/getting-started`, `/guides/radio-settings`, `/guides/repeater-setup`, `/guides/naming-standard`, `/guides/troubleshooting`.
- No node/repeater submission, update, or intake workflow may be introduced.
- No new legal/safety/radio disclaimer copy may be introduced.
- External Discord/product/docs links must keep `target="_blank"` and `rel="noopener noreferrer"`.
- Interactive client components already present in guide/tool pages must keep working.

## Verification Plan
- Automated: `npm run typecheck`
- Automated: `npm run build`
- Automated: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4574 PLAYWRIGHT_PORT=4574 npm run test:e2e -- tests/e2e/smoke.spec.ts`
- Automated: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4574 PLAYWRIGHT_PORT=4574 npm run test:a11y`
- Manual: run a current production server on `127.0.0.1:4574`, browse `/tools`, `/guides`, `/guides/getting-started`, `/guides/repeater-setup`, `/guides/naming-standard`, `/guides/radio-settings`, and `/guides/troubleshooting` at desktop and mobile widths.
- Manual: verify visible links from guides to tools/map use the intended destinations, and check Chrome console for warnings/errors.
- Regression: confirm `/start` still exposes newcomer/operator/community paths and homepage CTAs still point to Get Started, Live Map, and Tools.

## Stop Conditions
- Pause if implementing Step 4 requires adding a new route, dependency, form/workflow, or disclaimer.
- Pause if Opus removes any existing tool or guide route from discoverable UI.
- Pause if route metadata or navigation labels need to change beyond Step 4’s tools/guides/learning handoff scope.
- Pause if automated verification exposes failures outside the touched IA surfaces that require broader architectural changes.

# Forge Project

## Description
Run a fresh hardening and completeness pass on the current Colorado MeshCore site. Make sure all UI/UX makes sense and works properly. Verify that enough useful functionality/content has been brought over from `https://github.com/Colorado-Mesh/meshcore-utilities-site`, including repeater configs from the original repo. Verify the live map is using `https://github.com/yellowcooln/meshcore-mqtt-live-map/` properly. Add any new dependencies or features that make sense, and harden CI.

## Constraints
- This is a fresh Forge run; previous `.forge/` artifacts were archived and must not be reused as the active plan.
- Treat the current committed codebase as the starting point and audit/improve from there.
- Do not push, publish images, create releases, or affect shared services without explicit user approval.
- UI/UX visual implementation in this Codex-backed session must be delegated to native Opus 4.7 xhigh via `co-ui` or `/opus-ui`; this session can handle non-visual code, API, CI, tests, Docker, and verification work.
- Source repositories to evaluate:
  - `https://github.com/Colorado-Mesh/meshcore-utilities-site`
  - `https://github.com/yellowcooln/meshcore-mqtt-live-map/`

## Context
- Greenfield/Brownfield: Brownfield audit and improvement pass on an existing Next.js site.
- Platform: Web app/site, Docker runtime, GitHub Actions CI/CD.
- Deliverable type: hybrid
- Date: 2026-05-06

## Initial Q&A
1. Pass type: Max parity — audit the current site against upstream utilities and live-map repositories, then pursue as much useful parity as feasible.
2. UI/UX handling: Delegate visual/frontend aesthetic work to native Opus UI; this Codex-backed session handles non-visual code, APIs, tests, CI, Docker, and verification.
3. CI scope: Pragmatic hardening — add high-value checks that are fast enough for normal PRs.

## Follow-up Q&A
1. Repeater and companion settings JSON: Implement downloadable MeshCore settings JSON for both repeater and companion tools in this pass.
2. Utilities repo code/data: Treat `Colorado-Mesh/meshcore-utilities-site` as allowed for direct copying/adaptation where useful.
3. Live-map experience: Pursue full in-site live-map parity, while still using the upstream live-map service as the decoder/runtime where appropriate.
4. Production live source: Production will run `meshcore-mqtt-live-map` as a separate sidecar/service, and this site should consume it server-side.
5. Live-map API token handling: Prefer bearer tokens for protected server-side live-map API access; avoid query-string tokens.
6. Sample-data production behavior: Keep sample data for demos, but add clear production warnings and CI/runtime smoke guards unless demo mode is explicit.
7. PrefixMatrix parity: Port full 4-character planning, reserved IDs, and collision severity using current map snapshot data.
8. Serial settings JSON application: Add guarded serial USB support for uploading/generated settings JSON and turning it into apply-settings commands.
9. Contacts export: Leave public contacts export out for this pass.
10. Geocoding/Nominatim: Move location lookup behind a server-side proxy with identifying headers, rate limiting, caching, and no autocomplete.
11. Advanced live-map feature proxying: Proxy as many upstream live-map endpoints/features as feasible after `/api/nodes` stabilization, including LOS/weather/coverage/WebSocket if practical.
12. Public runtime configuration: Add a server-provided runtime config endpoint for map tile URL/attribution and public settings that operators expect to change after image build.
13. PR CI budget: Target about 10 minutes for normal PR checks.
14. Accessibility/performance checks: Make both axe and Lighthouse CI blocking immediately.
15. Parity report: Keep upstream parity manifest/report for maintainers only, not public UI.

## Refined Project Understanding
This fresh pass should treat the current committed Colorado MeshCore site as the baseline and pursue a high-parity hardening increment. The main product work is to close gaps against `meshcore-utilities-site` and `meshcore-mqtt-live-map`: generated repeater and companion settings JSON, full 4-character PrefixMatrix behavior, guarded serial application of settings JSON, production-safe live-map service integration with bearer-token auth, advanced live-map feature proxying where feasible, runtime public map configuration, and stronger UI/UX verification through delegated Opus visual review plus blocking accessibility/performance CI. Contacts export is explicitly out of scope.

## Decisions Made
- Max parity is preferred over a minimal audit pass.
- Direct adaptation from `Colorado-Mesh/meshcore-utilities-site` is allowed where useful.
- Production topology uses a separate `meshcore-mqtt-live-map` service; the Next app should not become the raw MeshCore MQTT decoder of record.
- Full in-site live-map parity is desired, but implementation should be grounded in upstream service APIs and practical feasibility.
- Bearer tokens are preferred for protected live-map API calls.
- Production sample-data usage must be obvious and guarded.
- Normal PR CI may include lint, typecheck, unit tests, Chromium Playwright smoke, build, Docker smoke, blocking axe, and blocking Lighthouse within roughly 10 minutes.
- Public contacts export is out of scope.

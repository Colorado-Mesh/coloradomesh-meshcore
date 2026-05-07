# Step 3 Execution Plan: Advanced live-map proxy contracts and sidecar runtime topology

## Goal
Add safe server-side contracts for feasible `meshcore-mqtt-live-map` operator endpoints and an opt-in Docker Compose sidecar topology, while keeping the upstream service as the stateful MQTT decoder/runtime.

## Current Code Observations
- `src/app/api/map/snapshot/route.ts`, `src/app/api/map/runtime/route.ts`, `src/app/api/map/nodes/route.ts`, and `src/app/api/map/stats/route.ts` already use App Router route handlers with `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, `NextResponse.json<ApiResponse<T>>()`, and explicit cache-control headers.
- `src/lib/map/config.ts` currently parses `MESHCORE_LIVE_MAP_API_URL`, `MESHCORE_LIVE_MAP_API_TOKEN`, and `MESHCORE_LIVE_MAP_API_REFRESH_SECONDS`, but there is no separate advanced proxy timeout, response-size, or sidecar base-path configuration.
- `src/lib/map/store.ts` now strips URL userinfo, sends live-map API credentials as bearer auth, sets `mode=full`, and returns only generic live-map fetch errors to browser-facing snapshots.
- `src/lib/map/types.ts` has `MapAdvancedFeature` and `MapRuntimePublicConfig`, with `advanced-live-map-proxy` still reported as `deferred` by `buildMapFeatures()`.
- `src/lib/constants.ts` only defines public map API route constants, not `/api/live-map/*` route names.
- `src/lib/parity/manifest.ts` marks `live-map-service-api-consumer` as `partial` and `docker-live-map-sidecar-topology` as `partial`, with notes that advanced proxy routes and a sidecar profile are still planned.
- `compose.yaml` currently defines only the `web` service; `.env.example` documents a preferred `MESHCORE_LIVE_MAP_API_URL` pointing at a compatible `/api/nodes` endpoint, but not a local sidecar service.
- Upstream `/tmp/meshcore-mqtt-live-map/backend/app.py` exposes HTTP endpoints relevant to this step: `/snapshot`, `/stats`, `/api/nodes`, `/peers/{device_id}`, `/los`, `/los/elevations`, `/coverage`, `/debug/last`, `/debug/status`, `/api/verify-turnstile`, and `/ws`.
- Upstream `/tmp/meshcore-mqtt-live-map/backend/weather.py` mounts `/weather/radar/country-bounds` through an APIRouter that requires production token auth.
- Upstream auth tests confirm protected API access accepts bearer tokens and `x-token`; WebSocket auth also accepts query/access-token style flows, but keeping credentials server-side means this step should not expose the upstream WebSocket token directly to browsers.
- Upstream coverage behavior can return unsupported/rate-limited/cache states; proxy code should preserve useful status semantics while redacting upstream URLs, tokens, and raw exception text.

## Files to Change
- `src/lib/live-map/types.ts` — define endpoint IDs, endpoint status, proxy result shapes, query parameter types, and upstream payload aliases that are intentionally permissive.
- `src/lib/live-map/client.ts` — implement base URL normalization, bearer-auth upstream fetches, timeout handling, allowed endpoint mapping, query serialization, response-size protection, status forwarding rules, and redacted errors.
- `src/lib/live-map/normalize.ts` — normalize endpoint availability/status metadata and safe proxy responses if needed outside the client.
- `src/lib/live-map/index.ts` — export public server-only helpers and types.
- `src/lib/live-map/__tests__/client.test.ts` — cover URL construction, auth headers, method/path allowlist behavior, timeout/error redaction, response-size guard, and unavailable configuration.
- `src/app/api/live-map/status/route.ts` — expose configured/available endpoint metadata for UI diagnostics.
- `src/app/api/live-map/snapshot/route.ts` — proxy upstream `/snapshot` with server-side auth.
- `src/app/api/live-map/stats/route.ts` — proxy upstream `/stats`.
- `src/app/api/live-map/nodes/route.ts` — proxy upstream `/api/nodes` with safe query forwarding for `updated_since`, `mode`, and `format`.
- `src/app/api/live-map/peers/[deviceId]/route.ts` — proxy upstream `/peers/{device_id}` with safe `limit` forwarding and path encoding.
- `src/app/api/live-map/los/route.ts` — proxy upstream `/los` with numeric coordinate/height/profile query validation.
- `src/app/api/live-map/los/elevations/route.ts` — proxy upstream `/los/elevations` with bounded `locations` forwarding.
- `src/app/api/live-map/coverage/route.ts` — proxy upstream `/coverage` and preserve unsupported/503 semantics through `ApiResponse`.
- `src/app/api/live-map/weather/radar/country-bounds/route.ts` — proxy upstream `/weather/radar/country-bounds` with numeric coordinate validation.
- `src/lib/map/config.ts` — add public advanced-proxy feature status based on live-map configuration and keep browser-safe runtime projection.
- `src/lib/constants.ts` — add route constants for scoped `/api/live-map/*` endpoints if existing client/server code should reference them.
- `src/lib/parity/manifest.ts` — update live-map API and Docker sidecar items with proxied/deferred details and test refs.
- `.env.example` — document sidecar base URL, token behavior, proxy timeout/size settings if added, and raw-MQTT-vs-live-map-service guidance.
- `compose.yaml` — add disabled-by-default `live-map` service profile and wire `web` defaults to the internal sidecar URL when that profile is used.

## Ordered Implementation Checklist
1. Create `src/lib/live-map/types.ts` with a small endpoint registry for feasible HTTP endpoints and an explicit `deferred` record for `/ws`, `/debug/*`, and Turnstile verification.
2. Implement `src/lib/live-map/client.ts` as the single server-only upstream access point: normalize `MESHCORE_LIVE_MAP_API_URL` to an upstream origin/base, strip userinfo, join endpoint paths safely, attach `Authorization: Bearer ${token}`, enforce timeout, reject unexpected methods/paths, and return generic redacted errors.
3. Add permissive payload forwarding through `ApiResponse<unknown>` for advanced proxy routes, with status codes that distinguish unconfigured upstream, upstream timeout, upstream unavailable/unsupported, and successful upstream payloads.
4. Add route handlers under `src/app/api/live-map/*` for snapshot, stats, nodes, peers, LOS, elevations, coverage, weather radar bounds, and status, reusing the client helper rather than duplicating fetch/auth logic.
5. Validate request query parameters at route boundaries only: path-encode `deviceId`, whitelist `nodes` query keys, bound peer `limit`, require finite lat/lon values, and cap LOS elevation `locations` count/length.
6. Update `getMapFeatures()` so `advanced-live-map-proxy` becomes `available` when a live-map API URL is configured and remains `unavailable` otherwise; do not expose upstream URLs or tokens in runtime config.
7. Update the parity manifest to list implemented proxy contracts, explicitly defer WebSocket/Turnstile/debug proxying with rationale, and attach the new unit test refs.
8. Add an opt-in Compose sidecar service using the upstream live-map image/build reference if available from the cloned repo documentation, attach a private `/data` volume, avoid publishing the sidecar port by default, and wire the web service to `http://live-map:8080/api/nodes` for snapshot compatibility when the `live-map` profile is selected.
9. Update `.env.example` with clear instructions for external upstream vs local sidecar usage, token handling, and optional endpoint availability.
10. Add Vitest coverage for client behavior and route-adjacent helpers using mocked `fetch`, including credential redaction in thrown upstream errors and response bodies too large for the configured guard.
11. Run verification, stage only Step 3 files, request Forge review, fix any required findings, then commit the approved Step 3 change.

## Interfaces and Data Contracts
- `proxyLiveMapEndpoint(endpointId, options)` returns a structured result suitable for `ApiResponse<unknown>` without leaking upstream base URL, bearer token, query token, request headers, or raw thrown error text.
- `GET /api/live-map/status` returns browser-safe endpoint metadata: configured state, endpoint IDs, labels, `available|unavailable|deferred` status, and rationale messages.
- `GET /api/live-map/snapshot` proxies upstream `/snapshot` and returns the raw upstream payload as `data` on success.
- `GET /api/live-map/stats` proxies upstream `/stats` and returns raw upstream stats payload as `data` on success.
- `GET /api/live-map/nodes?updated_since=&mode=&format=` proxies upstream `/api/nodes` with only those whitelisted query parameters.
- `GET /api/live-map/peers/[deviceId]?limit=` proxies upstream `/peers/{device_id}` with an encoded device ID and bounded positive integer limit.
- `GET /api/live-map/los?lat1=&lon1=&lat2=&lon2=&profile=&h1=&h2=` proxies upstream `/los` with finite numeric coordinate and height validation.
- `GET /api/live-map/los/elevations?locations=lat,lon|lat,lon` proxies upstream `/los/elevations` with bounded count and length validation.
- `GET /api/live-map/coverage` proxies upstream `/coverage` and returns unsupported/upstream error states through redacted `ApiResponse` errors.
- `GET /api/live-map/weather/radar/country-bounds?lat=&lon=` proxies upstream weather radar bounds with finite coordinate validation.
- `/ws` is not proxied in this step unless implementation proves a safe Next.js runtime pattern that keeps upstream credentials server-side; default plan is to mark it deferred and rely on polling/proxy HTTP contracts for Step 4 UI.
- Debug and Turnstile routes are not proxied because they either expose dev-only internals or mint upstream browser auth tokens outside this site’s auth model.

## Verification Plan
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Automated: `npm run test:unit`
- Automated: `npm run build`
- Automated: `docker compose config`
- Manual/API: with no `MESHCORE_LIVE_MAP_API_URL`, request `/api/live-map/status` and one proxied endpoint and confirm safe unavailable responses.
- Manual/API: if a local upstream sidecar can be started without external publishing, request representative proxied routes and confirm browser responses contain no configured token or credentialed upstream URL.
- Regression: existing `/api/map/snapshot`, `/api/map/runtime`, `/api/map/nodes`, and `/api/map/stats` behavior must remain compatible with Step 2 tests.
- Regression: `JSON.stringify(getMapPublicRuntimeConfig())` must not include `MESHCORE_LIVE_MAP_API_TOKEN`, upstream userinfo, or the raw upstream host unless intentionally public and already present through tile config.

## Stop Conditions
- Pause before adding a direct browser WebSocket connection to the upstream service if it would require exposing `MESHCORE_LIVE_MAP_API_TOKEN` or minting upstream auth tokens in this app.
- Pause before introducing new production-published ports, reverse-proxy requirements, or deployment changes beyond an opt-in local/ops Compose profile.
- Pause before adding a raw MQTT packet decoder or Node/Python side runtime inside the Next container; the plan requires the upstream service to remain the decoder/runtime.
- Pause before adding persistent site-owned storage, database dependencies, or background worker processes.
- Pause if upstream route payloads require UI-specific transformations that belong in Step 4 rather than this server-contract step.

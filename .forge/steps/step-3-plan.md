# Step 3 Execution Plan: Map-derived data contracts and runtime MQTT adapter

## Goal
Introduce stable map-derived TypeScript contracts, runtime map/MQTT configuration, normalization helpers, sample snapshot data, `/api/map/nodes`, `/api/map/stats`, and client hooks that future map/homepage/tools work can consume without depending on Turso public stats.

## Current Code Observations
- `src/lib/constants.ts` already defines runtime env variable names and `/api/map/*` route constants from Step 1.
- `src/lib/types.ts` still owns legacy Turso/bot contracts (`Node`, `NodeWithStats`, `CommunityStats`, `NetworkHealth`) and the shared `ApiResponse<T>` wrapper.
- Legacy routes `src/app/api/nodes/route.ts`, `src/app/api/stats/route.ts`, and health routes still serve current UI consumers and must remain in place for later migration/removal steps.
- `src/hooks/useStats.ts` fetches `/api/stats` and optionally `/api/health`; it should not be rewritten in this step because `StatsSection` still uses legacy stats.
- `src/hooks/index.ts` currently exports only `useStats`, so new map hooks need explicit exports.
- TypeScript uses strict settings and `@/*` path aliases through `tsconfig.json`.

## Files to Change
- `.forge/steps/step-3-plan.md` — record this execution plan.
- `src/lib/map/types.ts` — add map contracts for nodes, links, routes, stats, snapshots, connection status, and source/config metadata.
- `src/lib/map/config.ts` — add server-side runtime map/MQTT config parsing with safe build-time defaults.
- `src/lib/map/normalize.ts` — add normalizers for legacy node shapes and live-map-like payloads into `MapNode`/`MapStats` contracts.
- `src/lib/map/sample-data.ts` — add deterministic Colorado MeshCore sample snapshot data.
- `src/lib/map/store.ts` — add snapshot provider/store that returns sample or empty runtime snapshots without requiring MQTT credentials.
- `src/lib/map/index.ts` — export map contracts and helpers.
- `src/app/api/map/nodes/route.ts` — return typed map nodes via the shared `ApiResponse<T>` shape.
- `src/app/api/map/stats/route.ts` — return typed map stats via the shared `ApiResponse<T>` shape.
- `src/hooks/useMapSnapshot.ts` — add client polling hook for `/api/map/nodes` and `/api/map/stats`.
- `src/hooks/index.ts` — export the new map hook.
- `src/lib/types.ts` — re-export map types for compatibility with the existing central type import pattern.

## Ordered Implementation Checklist
1. Create `src/lib/map/types.ts` with framework-neutral map contracts and exact-coordinate fields.
2. Create `src/lib/map/config.ts` that reads env vars from `RUNTIME_ENV`, validates simple boolean/string options, and never exposes MQTT credentials to client code.
3. Create `src/lib/map/normalize.ts` with timestamp, coordinate, node role, duplicate-ID, stale/online, and stats aggregation helpers.
4. Create `src/lib/map/sample-data.ts` with a small deterministic `MapSnapshot` covering online, stale, repeater, route/link, battery, firmware/model, and coordinate cases.
5. Create `src/lib/map/store.ts` to choose sample versus empty snapshot behavior based on runtime config and expose `getMapSnapshot`, `getMapNodes`, and `getMapStats`.
6. Add map module exports and re-export map types from `src/lib/types.ts` without deleting any legacy Turso types.
7. Add `/api/map/nodes` and `/api/map/stats` route handlers with live-data cache headers and structured error responses.
8. Add `useMapSnapshot`/`useMapStats` client hook behavior with refresh interval, loading, error, and last-updated state.
9. Update `src/hooks/index.ts` to export the new hook and types.
10. Run automated verification and fix any TypeScript/lint/build issues.
11. Start the dev server and curl `/api/map/nodes` and `/api/map/stats` to confirm missing MQTT env vars produce sample or empty responses rather than crashes.

## Interfaces and Data Contracts
- `MapNode` includes stable `id`, `publicKey`, display name, role/type, coordinates, `lastHeardAt`, freshness status, optional model/firmware/battery/radio fields, route/neighbors, and metadata.
- `MapStats` includes map-derived totals: total nodes, online nodes, visible nodes, repeater count, stale count, located count, link count, route count, average battery when known, and `lastUpdated`.
- `MapSnapshot` contains `nodes`, `links`, `routes`, `stats`, `connection`, and `source`.
- `GET /api/map/nodes` returns `ApiResponse<MapNode[]>`.
- `GET /api/map/stats` returns `ApiResponse<MapStats>`.
- MQTT env vars are read only in server modules through `process.env`; no hook/client component imports server config.

## Verification Plan
- Automated: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Manual API: run the dev server, then `curl -s http://localhost:3000/api/map/stats` and `curl -s http://localhost:3000/api/map/nodes`.
- Regression: legacy `/api/stats`, `/api/nodes`, `useStats`, and existing components remain untouched except shared type re-exports.

## Stop Conditions
- If actual MQTT ingestion requires a long-lived process incompatible with Next route/runtime constraints, do not invent a sidecar in this step; keep the snapshot provider staged and leave full ingestion for the map/Docker architecture steps.
- If map routes need persistent history storage to satisfy a contract, pause for plan update instead of adding a database migration.
- If TypeScript changes require migrating legacy UI consumers, stop and keep migration for Step 4/5/6 unless only a compile fix is needed.

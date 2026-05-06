# Step 8 Execution Plan: Docker-primary runtime

## Goal
Make the Colorado MeshCore site build and run as a Docker-primary Next.js standalone application, with Compose configuration and environment examples for local and production-like runtime configuration.

## Current Code Observations
- The repo uses `next.config.js`, not `next.config.ts`, and it currently has no `output: 'standalone'` or runtime headers.
- `package.json` already targets Node `>=24 <26` and has `dev`, `build`, `start`, `lint`, and `typecheck` scripts.
- `.gitignore` ignores `.env*`, so committing `.env.example` requires an explicit allow rule.
- `src/lib/constants.ts` centralizes runtime env names through `RUNTIME_ENV`, and `src/lib/map/config.ts` reads map tile, MQTT, history, and sample-data settings with safe defaults.
- `/api/map/nodes` and `/api/map/stats` set short `Cache-Control` headers and are the only supported live-data API routes after Step 7.
- `netlify.toml` still contains Netlify-specific build/plugin/header config plus a stale `[functions]` block pointing at the deleted `netlify/functions` directory.
- `public/_headers` still describes Netlify headers; Docker/Next standalone needs equivalent runtime headers outside Netlify.
- `README.md` has current Node-based setup but no Docker or Compose instructions and still lists `next.config.ts` in the project tree.
- `CONTRIBUTING.md` still references Denver MeshCore, Node 20, old clone paths, and the older Discord invite.

## Files to Change
- `next.config.js` — enable standalone output and add Next-served security/cache headers for Docker runtime.
- `Dockerfile` — add multi-stage Node 24 standalone image build and non-root runtime.
- `.dockerignore` — exclude local/build/secret artifacts from the Docker context.
- `.env.example` — document runtime environment variables used by the app and Compose.
- `.gitignore` — allow `.env.example` while continuing to ignore local env files.
- `compose.yaml` — add a web service with build/image, env substitution, port mapping, restart policy, and health check.
- `netlify.toml` — mark Netlify as legacy/secondary and remove stale deleted-functions configuration.
- `public/_headers` — document that Docker/Next headers live in `next.config.js` and keep legacy Netlify header intent aligned.
- `README.md` — add Docker usage and fix the project tree entry.
- `CONTRIBUTING.md` — update stale brand, Node version, clone path, verification command, and Discord link.

## Ordered Implementation Checklist
1. Update `next.config.js` with `output: 'standalone'`, disabled powered-by header, and security/cache headers equivalent to the Netlify header intent.
2. Add a multi-stage Node 24 `Dockerfile` that runs `npm ci`, builds Next standalone output, copies `.next/standalone`, `.next/static`, and `public`, then runs `node server.js` as a non-root user.
3. Add `.dockerignore` to keep `.git`, `.forge`, `.claude`, `node_modules`, `.next`, local env files, logs, and coverage out of the image context.
4. Add `.env.example` and adjust `.gitignore` so the example is committed but real `.env*` files stay ignored.
5. Add `compose.yaml` using `.env` variable substitution, default sample data, port `3000:3000`, and a Node-based health check against `/api/map/stats`.
6. Update Netlify-specific files to reflect legacy/secondary status and remove the deleted functions directory reference.
7. Update README and CONTRIBUTING only for Docker/runtime setup accuracy and stale Node/brand references.
8. Run `npm run lint`, `npm run typecheck`, and `npm run build` and confirm `.next/standalone/server.js` exists.
9. Run Docker/Compose verification: `docker build -t colorado-meshcore-site:forge .`, `docker compose config`, and a container smoke test if Docker is available.
10. If Docker runs locally, validate `/`, `/map`, `/tools`, and `/api/map/stats` from the container.
11. Stage specific Step 8 files, request Forge review, save `.forge/reviews/claude-step-8.json`, and commit if approved.

## Interfaces and Data Contracts
- Docker image runs `node server.js` from Next standalone output.
- Container listens on `PORT=3000` and `HOSTNAME=0.0.0.0` by default.
- Runtime configuration is provided through environment variables; secrets are not copied into or baked into the image.
- Compose supports `.env` substitution and defaults to sample map data when MQTT is not configured.
- Supported live-data endpoints remain `GET /api/map/nodes` and `GET /api/map/stats`.
- Removed Step 7 legacy routes remain 404; no redirects or compatibility shims are added.

## Verification Plan
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Automated: `npm run build`
- Automated: `test -f .next/standalone/server.js`
- Docker: `docker build -t colorado-meshcore-site:forge .`
- Docker: `docker compose config`
- Docker/manual: run the image or Compose service and curl `/`, `/map`, `/tools`, and `/api/map/stats` if Docker is available.
- Grep: `grep -R "next.config.ts\|Node.js 20\|Denver MeshCore\|netlify/functions\|@netlify/functions\|TURSO_" -n README.md CONTRIBUTING.md next.config.js netlify.toml public/_headers Dockerfile compose.yaml .env.example package.json || true`

## Stop Conditions
- If `npm run build` does not emit `.next/standalone/server.js`, stop and fix the Next standalone configuration before Docker work.
- If Docker is unavailable or the daemon is not running, do not fake success; record the blocker and still run non-Docker verification.
- If container startup fails because required runtime files are missing from standalone output, fix Docker copy paths rather than switching to `npm start` in the image.
- If preserving Netlify behavior requires broader deployment changes, defer that to Step 10 or ask before removing Netlify support entirely.

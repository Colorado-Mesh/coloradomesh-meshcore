# Forge Project

## Description
Redesign the entire Denver MeshCore site using `/Users/cjvana/Downloads/meshcore` as strong inspiration while changing branding to Colorado Mesh. The new site URL will be `meshcore.coloradomesh.org` and should use Colorado Mesh logos from `https://github.com/Colorado-Mesh/icons`. Make the webpage Docker-primary, able to run in a Docker container, and add CD for Docker on GitHub releases. Replace the current map and network health metrics with functionality from `https://github.com/yellowcooln/meshcore-mqtt-live-map/`. Research how to integrate `https://github.com/Colorado-Mesh/meshcore-utilities-site` as a submodule or alternative, and replace a lot of the existing tools with those utilities where appropriate.

## Constraints
- Site redesign should be inspired by `/Users/cjvana/Downloads/meshcore`, not a direct clone.
- Branding must change to Colorado Mesh.
- Use Colorado Mesh logos from `https://github.com/Colorado-Mesh/icons`.
- New public URL: `meshcore.coloradomesh.org`.
- Docker should be the primary deployment target.
- External repo integration approach was researched before deciding implementation direction.
- Live map and utilities should be ported into the main site experience rather than launched as separate subdomains/services first.
- Exact public node locations are acceptable for the live map.
- Docker Compose should support runtime environment-variable configuration.
- Removed legacy pages should be hard-removed rather than preserved as redirects or archives.

## Context
- Greenfield/Brownfield: Brownfield existing site redesign and integration project.
- Platform: Web app/site, Docker container, GitHub Releases CD.
- Deliverable type: hybrid
- Date: 2026-05-05

## Initial Q&A
1. Deliverable type: Hybrid — code changes plus significant architecture, deployment, and integration documentation.
2. Redesign approach: Strong inspiration from `/Users/cjvana/Downloads/meshcore`, with Colorado Mesh branding.
3. Deployment target: Docker primary.
4. External repo integration approach: Research first.

## Follow-up Q&A
1. Live map routing: Port into site, not subdomain/path proxy as a separate app.
2. Utilities launch approach: Port utilities into the site.
3. GPL/live-map strategy: Fork and brand the live map while preserving license compliance.
4. Logo assets: Authorized to redistribute Colorado Mesh logo assets from `Colorado-Mesh/icons` in this site and Docker images.
5. Public map privacy: Show all node locations exactly.
6. MQTT configuration: Use runtime environment configuration for broker URL, topics, and credentials; do not commit secrets.
7. Existing content: Preserve core docs while rebranding from Denver MeshCore to Colorado MeshCore.
8. First release topology: Publish a main Docker image and include Docker Compose examples/options for environment variables.
9. Utilities priority: Port all feasible tools from `meshcore-utilities-site` and replace overlapping current tools.
10. Network metrics replacement: Use map-derived stats.
11. Runtime baseline: Use Node 24 LTS/current for Docker and CI unless compatibility testing finds a blocker.
12. Docker release CD: Publish to GHCR with semver tags and `latest` on GitHub releases.
13. Branding: Fully rename visible Denver MeshCore branding to Colorado MeshCore.
14. Browser serial utilities: Include all feasible Web Serial/USB utilities with support/fallback behavior.
15. Removed URLs: Hard remove old map, observer, and replaced tool routes without redirects.
16. Primary homepage audience: Balanced between newcomers, operators, and maintainers.

## Refined Project Understanding
The build should produce a Docker-primary Colorado MeshCore Next.js site at `meshcore.coloradomesh.org`. The existing site should be fully rebranded from Denver MeshCore to Colorado MeshCore while preserving useful technical docs and blog content. The visual redesign should draw strong inspiration from the local MeshCore prototype but must use Colorado Mesh assets and should not copy prototype code blindly.

Unlike the research default recommendation of sidecar services, the chosen product direction is deeper integration: fork/brand the GPL live-map project, port live-map functionality into the main site experience, port all feasible utilities from the Colorado Mesh utilities site, and replace legacy map/observer metrics with live-map-derived stats. MQTT and deployment configuration should be runtime-driven through Docker environment variables and Compose examples.

## Decisions Made
- Main app remains the implementation target for map and tools integration.
- External live-map code may be forked/branded with GPL compliance rather than avoided.
- Colorado Mesh icon assets are approved for redistribution in this repo and published images.
- Public map shows exact locations for all nodes.
- Runtime configuration is required for MQTT and deployment settings.
- Node 24 is the desired Docker/CI runtime baseline.
- Docker/GHCR release CD is required.
- Old map/observer/replaced tool routes should be removed, not redirected.

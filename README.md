# Colorado MeshCore

Colorado MeshCore is the public website for Colorado Mesh's MeshCore community. It provides project information, getting-started guides, a live network map, and utilities for configuring repeaters, companion nodes, prefixes, and serial USB access.

## Features

- **Live network map** — Map and summary views backed by the Docker-primary map runtime.
- **MeshCore tools** — Repeater naming, companion naming, PrefixMatrix, and serial USB helpers.
- **Guides and use cases** — Community onboarding, repeater setup, emergency communication, and related MeshCore content.
- **Colorado Mesh branding** — Site copy and assets aligned with the Colorado MeshCore network.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Web app | Next.js 16, React 19 | App Router pages and API routes |
| Styling | Tailwind CSS 4 | Utility-first styling |
| Maps | Leaflet, react-leaflet | Interactive network visualization |
| Content | MDX | Blog and guide content |
| Runtime | Node.js 24, Docker | Development and production server |

## Quick Start

### Prerequisites

- Node.js 24 or later, matching the `package.json` engine range
- npm

### Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verify

```bash
npm run lint
npm run typecheck
npm run build
```

## Docker Runtime

Build and run the standalone Docker image:

```bash
docker build -t colorado-meshcore-site:local .
docker run --rm -p 3000:3000 --env-file .env.example colorado-meshcore-site:local
```

Or run with Compose:

```bash
cp .env.example .env
docker compose up --build
```

The container listens on port `3000`, defaults to the public Colorado Mesh analyzer node API, and shows no fake nodes by default. Set `MESHCORE_LIVE_MAP_API_URL` to override the live feed with another compatible `/api/nodes` endpoint. Direct MQTT remains available for JSON-compatible map payloads, and the optional Compose `live-map` profile can run a private sidecar against the Colorado Mesh MQTT broker when subscriber credentials are available. Runtime settings are provided through environment variables; secrets should stay in `.env` or the deployment environment, not in the image.

## Runtime Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for metadata and canonical links. |
| `NEXT_PUBLIC_MAP_TILE_URL` | No | Leaflet tile URL template. |
| `MESHCORE_MAP_SAMPLE_DATA` | No | Use bundled sample nodes only for intentional demos; defaults to `false`. |
| `MESHCORE_LIVE_MAP_API_URL` | No | Preferred live source; defaults to `https://analyzer.meshcore.coloradomesh.org/api/nodes`. |
| `MESHCORE_LIVE_MAP_API_TOKEN` | No | Optional server-side token for protected live-map API instances. |
| `MESHCORE_LIVE_MAP_API_REFRESH_SECONDS` | No | Minimum refresh interval for polling the live-map API; defaults to `30`. |
| `LIVE_MAP_MQTT_HOST` | No | Compose sidecar MQTT host; defaults to `mqtt.meshcore.coloradomesh.org`. |
| `LIVE_MAP_MQTT_PORT` | No | Compose sidecar MQTT port; defaults to `1883`. |
| `LIVE_MAP_MQTT_TRANSPORT` | No | Compose sidecar MQTT transport; defaults to `websockets`. |
| `LIVE_MAP_MQTT_WS_PATH` | No | Compose sidecar MQTT WebSocket path; defaults to `/ws`. |
| `LIVE_MAP_MQTT_TLS` | No | Compose sidecar MQTT TLS flag; defaults to `true`. |
| `LIVE_MAP_MQTT_USERNAME` | Yes for sidecar live data | Read-only subscriber username for the Colorado Mesh MQTT broker. |
| `LIVE_MAP_MQTT_PASSWORD` | Yes for sidecar live data | Read-only subscriber password/token for the Colorado Mesh MQTT broker. |
| `MESHCORE_MQTT_URL` | No | Optional MQTT broker URL for JSON-compatible map payloads. |
| `MESHCORE_MQTT_USERNAME` | No | Optional MQTT username. |
| `MESHCORE_MQTT_PASSWORD` | No | Optional MQTT password. |
| `MESHCORE_MQTT_TOPIC` | No | MQTT topic filter; defaults to `meshcore/#`. |
| `MESHCORE_MQTT_CLIENT_ID` | No | MQTT client ID. |
| `MESHCORE_MAP_HISTORY_ENABLED` | No | Reserved flag for future map history support. |

## API Overview

The supported public live-data endpoints are:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/map/nodes` | GET | Current map node snapshot |
| `/api/map/stats` | GET | Current map-derived network summary |

Legacy observer, health, stats, node-list, cleanup, and Discord webhook APIs have been removed. Removed routes intentionally return 404 instead of redirecting.

## Project Structure

```text
coloradomesh-meshcore/
├── content/                    # MDX blog and guide content
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/map/            # Supported live map API routes
│   │   ├── map/                # Interactive map page
│   │   ├── tools/              # MeshCore utility pages
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Shared constants, map contracts, and utilities
├── compose.yaml                # Local Docker Compose service
├── Dockerfile                  # Production standalone image
├── next.config.js
└── package.json
```

## Community

- **Discord**: [discord.gg/Tuuv9hGPnX](https://discord.gg/Tuuv9hGPnX)
- **MeshCore**: [meshcore.io](https://meshcore.io)
- **LetsMesh**: [letsmesh.net](https://letsmesh.net)

## Contributing

Contributions are welcome. Please run linting, type checking, and the production build before opening a pull request.

## License

This project is part of the Colorado MeshCore community initiative.

## Acknowledgments

Colorado Mesh acknowledges that this site and the majority of its content was originally developed by @cj-vana as part of DenverMC before merging with Colorado Mesh. His efforts to document and promote MeshCore in the Denver area were instrumental in the origins of the statewide MeshCore network.

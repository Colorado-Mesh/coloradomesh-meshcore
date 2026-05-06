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

The container listens on port `3000` and defaults to sample map data when MQTT settings are not configured. Runtime settings are provided through environment variables; secrets should stay in `.env` or the deployment environment, not in the image.

## Runtime Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for metadata and canonical links. |
| `NEXT_PUBLIC_MAP_TILE_URL` | No | Leaflet tile URL template. |
| `MESHCORE_MAP_SAMPLE_DATA` | No | Use bundled sample data when MQTT is not configured. |
| `MESHCORE_MQTT_URL` | No | Optional MQTT broker URL for live map ingestion. |
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
denvermc-org/
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

- **Discord**: [discord.gg/QpaW8FTTCE](https://discord.gg/QpaW8FTTCE)
- **MeshCore**: [meshcore.co.uk](https://meshcore.co.uk)
- **LetsMesh**: [letsmesh.net](https://letsmesh.net)

## Contributing

Contributions are welcome. Please run linting, type checking, and the production build before opening a pull request.

## License

This project is part of the Colorado MeshCore community initiative.

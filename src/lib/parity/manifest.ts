export type ParityDomain =
  | 'utilities'
  | 'repeater-config'
  | 'serial-usb'
  | 'prefix-matrix'
  | 'live-map-api'
  | 'live-map-ui'
  | 'docker'
  | 'ci';

export type ParityStatus = 'implemented' | 'partial' | 'planned' | 'deferred' | 'out-of-scope';

export interface ParitySourceRef {
  label: string;
  url?: string;
  path?: string;
}

export interface ParityCoverageRef {
  type: 'unit' | 'e2e' | 'manual' | 'ci' | 'review';
  ref: string;
}

export interface ParityItem {
  id: string;
  domain: ParityDomain;
  title: string;
  upstream: ParitySourceRef[];
  local: string[];
  status: ParityStatus;
  coverage: ParityCoverageRef[];
  notes: string;
}

export const PARITY_MANIFEST: ParityItem[] = [
  {
    id: 'utilities-repeater-settings-json',
    domain: 'repeater-config',
    title: 'Repeater settings JSON download parity',
    upstream: [
      {
        label: 'meshcore-utilities-site repeater route',
        url: 'https://github.com/Colorado-Mesh/meshcore-utilities-site',
        path: 'backend/api/routes/repeater_name_tool/index.py',
      },
      {
        label: 'recommended settings fixture',
        path: 'src/lib/parity/fixtures/utilities/recommended_settings.json',
      },
    ],
    local: ['src/components/NamingWizard.tsx'],
    status: 'planned',
    coverage: [],
    notes: 'Generate deterministic MeshCore repeater settings JSON from validated naming inputs.',
  },
  {
    id: 'utilities-companion-settings-json',
    domain: 'utilities',
    title: 'Companion settings JSON download parity',
    upstream: [
      {
        label: 'meshcore-utilities-site companion route',
        url: 'https://github.com/Colorado-Mesh/meshcore-utilities-site',
        path: 'backend/api/routes/companion_name_tool/index.py',
      },
    ],
    local: ['src/components/CompanionNamer.tsx'],
    status: 'planned',
    coverage: [],
    notes: 'Generate deterministic companion settings JSON while preserving the 23-character MeshCore name limit.',
  },
  {
    id: 'prefix-matrix-4-character-planning',
    domain: 'prefix-matrix',
    title: 'Four-character PrefixMatrix planning with reserved/collision logic',
    upstream: [
      {
        label: 'meshcore-utilities-site prefix matrix',
        url: 'https://github.com/Colorado-Mesh/meshcore-utilities-site',
        path: 'static/js/prefix_matrix.js',
      },
    ],
    local: ['src/components/PrefixMatrix.tsx'],
    status: 'planned',
    coverage: [],
    notes: 'Move from first-byte occupancy to full 4-character public-key prefix analysis.',
  },
  {
    id: 'serial-usb-settings-json-apply',
    domain: 'serial-usb',
    title: 'Guarded serial application of generated settings JSON',
    upstream: [
      {
        label: 'default serial command profile',
        path: 'src/lib/parity/fixtures/utilities/default_serial_commands.json',
      },
      {
        label: 'serial command schema',
        path: 'src/lib/parity/fixtures/utilities/serial_commands.schema.json',
      },
    ],
    local: ['src/components/tools/SerialUsbTool.tsx', 'src/lib/tools/serial-commands.ts'],
    status: 'planned',
    coverage: [],
    notes: 'Add preview and explicit confirmations before settings-derived commands are sent to hardware.',
  },
  {
    id: 'live-map-service-api-consumer',
    domain: 'live-map-api',
    title: 'Server-side meshcore-mqtt-live-map API consumer',
    upstream: [
      {
        label: 'meshcore-mqtt-live-map API',
        url: 'https://github.com/yellowcooln/meshcore-mqtt-live-map',
        path: 'backend/app.py',
      },
    ],
    local: ['src/lib/map/store.ts', 'src/app/api/map/nodes/route.ts', 'src/app/api/map/stats/route.ts'],
    status: 'partial',
    coverage: [],
    notes: 'Current site consumes /api/nodes-style payloads; planned work adds canonical snapshot, bearer auth, and advanced proxy routes.',
  },
  {
    id: 'live-map-full-in-site-ui',
    domain: 'live-map-ui',
    title: 'Full in-site live-map UI parity',
    upstream: [
      {
        label: 'meshcore-mqtt-live-map browser app',
        url: 'https://github.com/yellowcooln/meshcore-mqtt-live-map',
        path: 'backend/static/app.js',
      },
    ],
    local: ['src/app/map/page.tsx', 'src/components/NetworkMap.tsx', 'src/components/map/*'],
    status: 'planned',
    coverage: [],
    notes: 'Visual/frontend parity must be delegated to Opus UI and backed by server-side contracts.',
  },
  {
    id: 'docker-live-map-sidecar-topology',
    domain: 'docker',
    title: 'Docker topology for Next site plus live-map sidecar service',
    upstream: [
      {
        label: 'meshcore-mqtt-live-map compose examples',
        url: 'https://github.com/yellowcooln/meshcore-mqtt-live-map',
        path: 'docker-compose.yaml',
      },
    ],
    local: ['Dockerfile', 'compose.yaml', '.env.example'],
    status: 'partial',
    coverage: [{ type: 'ci', ref: '.github/workflows/ci.yml docker-build' }],
    notes: 'Current Docker build exists; planned work adds opt-in sidecar profile and runtime smoke.',
  },
  {
    id: 'ci-pr-quality-gates',
    domain: 'ci',
    title: 'PR CI quality gates for parity, accessibility, Lighthouse, build, and Docker smoke',
    upstream: [],
    local: ['.github/workflows/ci.yml', 'package.json'],
    status: 'planned',
    coverage: [],
    notes: 'Target roughly 10 minutes with blocking axe and Lighthouse per user decision.',
  },
  {
    id: 'contacts-export',
    domain: 'utilities',
    title: 'Contacts export endpoint',
    upstream: [
      {
        label: 'meshcore-utilities-site contacts export',
        url: 'https://github.com/Colorado-Mesh/meshcore-utilities-site',
        path: 'backend/api/services/contacts.py',
      },
    ],
    local: [],
    status: 'out-of-scope',
    coverage: [{ type: 'review', ref: '.forge/PROJECT.md Follow-up Q&A #9' }],
    notes: 'User explicitly chose to leave public contacts export out for this pass.',
  },
];

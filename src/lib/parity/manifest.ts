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
    local: [
      'src/components/NamingWizard.tsx',
      'src/lib/meshcore-data/settings.ts',
      'src/lib/meshcore-data/regions.ts',
      'src/lib/meshcore-data/node-types.ts',
      'src/lib/meshcore-tools/naming.ts',
      'src/lib/meshcore-tools/config-export.ts',
    ],
    status: 'implemented',
    coverage: [
      { type: 'unit', ref: 'src/lib/meshcore-tools/__tests__/config-export.test.ts' },
    ],
    notes: 'Generates deterministic MeshCore repeater settings JSON from validated naming inputs, canonical radio defaults, region list, selected node type, and safe filenames without private keys.',
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
    local: [
      'src/components/CompanionNamer.tsx',
      'src/lib/meshcore-data/settings.ts',
      'src/lib/meshcore-tools/naming.ts',
      'src/lib/meshcore-tools/config-export.ts',
    ],
    status: 'implemented',
    coverage: [
      { type: 'unit', ref: 'src/lib/meshcore-tools/__tests__/config-export.test.ts' },
    ],
    notes: 'Generates deterministic companion settings JSON from validated emoji/handle/suffix inputs while preserving the 23-character MeshCore name limit and safe filenames without private keys.',
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
    local: [
      'src/lib/meshcore-tools/prefixes.ts',
      'src/components/PrefixMatrix.tsx',
      'src/components/NamingWizard.tsx',
      'src/app/tools/prefix-matrix/page.tsx',
    ],
    status: 'implemented',
    coverage: [
      { type: 'unit', ref: 'src/lib/meshcore-tools/__tests__/prefixes.test.ts' },
      { type: 'e2e', ref: 'tests/e2e/smoke.spec.ts (/tools/prefix-matrix)' },
    ],
    notes: 'PrefixMatrix and NamingWizard share `buildPrefixAnalysis` over the canonical `/api/map/snapshot`, render a primary 16×16 first-byte grid plus a 4-character subgrid, surface reserved/duplicate/repeater-collision states, and offer a deterministic Suggest Free Prefix. The reserved-prefix list is intentionally small and typed locally; expand only with a documented upstream source.',
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
    local: [
      'src/components/tools/SerialUsbTool.tsx',
      'src/lib/tools/serial-commands.ts',
      'src/lib/meshcore-tools/serial-settings.ts',
    ],
    status: 'implemented',
    coverage: [
      { type: 'unit', ref: 'src/lib/meshcore-tools/__tests__/serial-settings.test.ts' },
      { type: 'e2e', ref: 'tests/e2e/smoke.spec.ts (/tools/serial-usb)' },
    ],
    notes: 'Settings JSON can be pasted or uploaded for an explicit command preview and confirmation-gated apply flow. Only locally documented name/radio write commands are auto-applied; node type, role, region, owner info, companion metadata, and other unverified keys remain visible as unsupported manual-review fields.',
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
    local: [
      'src/lib/map/store.ts',
      'src/lib/live-map/client.ts',
      'src/app/api/map/snapshot/route.ts',
      'src/app/api/map/runtime/route.ts',
      'src/app/api/map/nodes/route.ts',
      'src/app/api/map/stats/route.ts',
      'src/app/api/live-map/*/route.ts',
    ],
    status: 'implemented',
    coverage: [
      { type: 'unit', ref: 'src/lib/map/__tests__/store.test.ts' },
      { type: 'unit', ref: 'src/lib/live-map/__tests__/client.test.ts' },
    ],
    notes: 'Current site exposes canonical snapshot/runtime contracts plus server-side advanced HTTP proxy routes with bearer-auth upstream fetches; WebSocket, debug, and Turnstile upstream routes are intentionally deferred.',
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
    coverage: [
      { type: 'ci', ref: '.github/workflows/ci.yml docker-build' },
      { type: 'manual', ref: 'docker compose --profile live-map config' },
    ],
    notes: 'Current Docker build exists and Compose now includes an opt-in live-map sidecar profile; Step 8 adds blocking Docker runtime smoke.',
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

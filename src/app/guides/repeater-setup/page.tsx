import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { HeroPanel } from "@/components/brand";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { BASE_URL, COMMUNITY_NAME } from "@/lib/constants";
import {
  COLORADO_MESH_RADIO_COMMANDS,
  COLORADO_MESH_RADIO_SETTINGS,
  formatRadioBandwidthHz,
  formatRadioFrequencyKHz,
} from "@/lib/meshcore-data/settings";

const radioFreqDisplay = formatRadioFrequencyKHz(COLORADO_MESH_RADIO_SETTINGS.frequency);
const radioBwDisplay = formatRadioBandwidthHz(COLORADO_MESH_RADIO_SETTINGS.bandwidth);
const radioSfDisplay = `SF${COLORADO_MESH_RADIO_SETTINGS.spreadingFactor}`;
const radioCrDisplay = `CR${COLORADO_MESH_RADIO_SETTINGS.codingRate}`;
const radioTxDisplay = `${COLORADO_MESH_RADIO_SETTINGS.txPower} dBm`;
const coloradoRadioApplyCommands = COLORADO_MESH_RADIO_COMMANDS.join("\n");
const coloradoDefaultsSummary = `${radioFreqDisplay} · ${radioBwDisplay} BW · ${radioSfDisplay} · ${radioCrDisplay} · ${radioTxDisplay}`;

export const metadata: Metadata = {
  title: "Repeater Setup Guide",
  description: "Set up and tune a MeshCore repeater node for the Colorado MeshCore network. Includes TX/RX delay profiles optimized for Denver metro and Front Range elevations.",
  keywords: ["MeshCore", "repeater", "setup", "Colorado", "Denver", "Front Range", "mesh network", "LoRa", "txdelay", "rxdelay", "agc", "antenna", "solar"],
  alternates: {
    canonical: '/guides/repeater-setup',
  },
  openGraph: {
    title: "Repeater Setup Guide | Colorado MeshCore",
    description: "Set up and tune a MeshCore repeater node with TX/RX delay profiles optimized for the Front Range.",
    url: `${BASE_URL}/guides/repeater-setup`,
  },
};

const delayProfiles = [
  {
    name: "HILLTOP",
    elevation: "Highest",
    neighbors: "20+",
    examples: "Lookout Mtn, Flagstaff Summit, Green Mtn",
    when: "Peak or tower with clear line of sight across the metro. Backbone infrastructure.",
    commands: `set txdelay 2
set direct.txdelay 2
set rxdelay 3`,
    color: "text-mountain-500 bg-mountain-500/10 border-mountain-500/30",
  },
  {
    name: "FOOTHILLS",
    elevation: "Mid",
    neighbors: "10-20",
    examples: "Morrison ridgeline, Golden, Red Rocks area",
    when: "Bridges hilltop nodes to suburban coverage.",
    commands: `set txdelay 1.5
set direct.txdelay 1
set rxdelay 3`,
    color: "text-forest-500 bg-forest-500/10 border-forest-500/30",
  },
  {
    name: "SUBURBAN",
    elevation: "Average",
    neighbors: "5-10",
    examples: "Denver/Aurora/Lakewood rooftop",
    when: "Typical rooftop install serving your neighborhood.",
    commands: `set txdelay 0.8
set direct.txdelay 0.4
set rxdelay 3`,
    color: "text-mesh bg-mesh/10 border-mesh/30",
  },
  {
    name: "LOCAL",
    elevation: "Low",
    neighbors: "1-3",
    examples: "Indoor, ground-level, low roof",
    when: "Only sees a few neighbors. Serves immediate area.",
    commands: `set txdelay 0.3
set direct.txdelay 0.1
set rxdelay 3`,
    color: "text-sunset-500 bg-sunset-500/10 border-sunset-500/30",
  },
  {
    name: "MOBILE",
    elevation: "Variable",
    neighbors: "Variable",
    examples: "Vehicle, hiking, bike",
    when: "Moving through the mesh. Always defers to fixed infrastructure.",
    commands: `set txdelay 3
set direct.txdelay 2.5
set rxdelay 3`,
    color: "text-sunset-700 bg-sunset-700/10 border-sunset-700/30",
  },
];

const commonSettings = [
  {
    setting: "path.hash.mode",
    value: "1",
    description: "Use 2-byte path hashes (required for current Front Range flood routing)",
  },
  {
    setting: "advert.interval",
    value: "240",
    description: "Local advert every 4 hours (neighbors only)",
  },
  {
    setting: "flood.advert.interval",
    value: "24",
    description: "Network-wide advert every 24 hours",
  },
  {
    setting: "agc.reset.interval",
    value: "500",
    description: "Reset radio AGC every ~8 min to prevent deafness from RF interference",
  },
  {
    setting: "guest.password",
    value: "(blank)",
    description: "Lets community members query repeater status",
  },
];

const firstRunChecklist = [
  {
    label: "1. Confirm firmware and role",
    detail:
      "Repeater firmware sets the role automatically. You should see role “Repeater” — no need to change it.",
    commands: `ver
board
get role`,
    expect: 'role = Repeater',
  },
  {
    label: "2. Verify the Front Range radio preset",
    detail: `Read the radio back. It should match the Colorado defaults: ${coloradoDefaultsSummary}.`,
    commands: `get radio
get freq
get tx`,
    expect: `freq ${COLORADO_MESH_RADIO_SETTINGS.frequency} · bw ${COLORADO_MESH_RADIO_SETTINGS.bandwidth} sf ${COLORADO_MESH_RADIO_SETTINGS.spreadingFactor} cr ${COLORADO_MESH_RADIO_SETTINGS.codingRate} · tx ${COLORADO_MESH_RADIO_SETTINGS.txPower}`,
  },
  {
    label: "3. Apply Front Range defaults (only if the read-back didn't match)",
    detail: (
      <>
        This site and the serial preflight write the split form generated from the shared settings —{" "}
        <code className="font-mono text-mesh">set freq 910525</code>,{" "}
        <code className="font-mono text-mesh">set radio bw 62500 sf 7 cr 8</code>,{" "}
        <code className="font-mono text-mesh">set tx 22</code>. The MeshCore CLI docs also describe a tuple form,{" "}
        <code className="font-mono text-mesh">set radio 910.525,62.5,7,8</code>, if you are following the raw CLI reference. Skip the block if step 2 already showed the right values.
      </>
    ),
    commands: coloradoRadioApplyCommands,
  },
  {
    label: "4. Enable 2-byte path hashes",
    detail:
      "Current Colorado MeshCore flood routing expects path.hash.mode 1. Older firmware defaulted to mode 0 (1-byte) and will look like packet loss.",
    commands: `set path.hash.mode 1
get path.hash.mode`,
    expect: 'path.hash.mode = 1',
  },
  {
    label: "5. Sync the clock",
    detail:
      "Repeaters boot with an old date until time is set. Pick the path that matches your build:",
    commands: `# GPS-capable firmware + hardware:
gps on
gps sync

# Otherwise — companion app or web serial, after every reboot:
clock sync`,
    expect: "clock returns the current UTC time",
  },
  {
    label: "6. Reboot and re-check",
    detail:
      "Reboot, reconnect serial, then re-run `clock` and `get role` to confirm the settings persisted and the time is correct.",
    commands: `reboot
clock
get role`,
  },
];

const settingsReference = [
  {
    setting: "path.hash.mode",
    default: "0",
    range: "0-3",
    controls: "Path-hash byte width on flood routes",
    rule: "Set to 1 for 2-byte hashes on Colorado MeshCore. 3 is reserved — do not use.",
  },
  {
    setting: "txdelay",
    default: "0.5",
    range: "0-3.0",
    controls: "Wait before retransmitting floods",
    rule: "Higher = defer to other nodes",
  },
  {
    setting: "direct.txdelay",
    default: "0.2",
    range: "0-3.0",
    controls: "Wait before retransmitting direct packets",
    rule: "Usually lower than txdelay",
  },
  {
    setting: "rxdelay",
    default: "0",
    range: "0-20.0",
    controls: "SNR-based flood processing priority (direct packets unaffected)",
    rule: "Higher = prefer strongest signal",
  },
  {
    setting: "agc.reset.interval",
    default: "0",
    range: "0-1020",
    controls: "Periodic AGC reset to prevent radio deafness (seconds)",
    rule: "Non-zero = auto-recover from RF interference",
  },
];

const serialSettings = [
  { setting: "Baud rate", value: "115200" },
  { setting: "Data bits", value: "8" },
  { setting: "Stop bits", value: "1" },
  { setting: "Parity", value: "none" },
  { setting: "Flow control", value: "none" },
  { setting: "Line ending", value: "CRLF" },
];

const serialCommandGroups = [
  {
    title: "Identify and time-sync",
    purpose: "Confirm firmware, board, and clock, then sync time after every reboot or power cycle.",
    commands: `ver
board
clock
clock sync`,
  },
  {
    title: "Confirm radio and identity",
    purpose: "Verify the node name, repeater role, radio preset, frequency, transmit power, airtime factor, path-hash mode, and public key.",
    commands: `get name
get role
get radio
get freq
get tx
get af
get repeat
get path.hash.mode
get public.key`,
  },
  {
    title: "Check location and adverts",
    purpose: "Make sure map coordinates, local adverts, flood adverts, flood limits, and read-only access are set correctly.",
    commands: `get lat
get lon
get advert.interval
get flood.advert.interval
get flood.max
get allow.read.only`,
  },
  {
    title: "Audit owner and delay tuning",
    purpose: "Confirm maintenance contact info, access control, and the TX/RX delay profile selected for the site.",
    commands: `get owner.info
get acl
get rxdelay
get txdelay
get direct.txdelay`,
  },
  {
    title: "Observe health and neighbors",
    purpose: "Inspect runtime counters and discover nearby nodes before leaving an install online.",
    commands: `stats-core
stats-radio
stats-packets
discover.neighbors
neighbor`,
  },
];

const optionalSerialChecks = [
  {
    title: "Bridge parameters",
    commands: `get bridge.enabled
get bridge.delay
get bridge.source
get bridge.baud`,
  },
  {
    title: "GPS state",
    commands: `gps on
gps sync
gps off`,
  },
  {
    title: "Power saving",
    commands: `powersaving on
powersaving off`,
  },
];

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Guides', url: `${BASE_URL}/guides` },
  { name: 'Repeater Setup', url: `${BASE_URL}/guides/repeater-setup` },
]);

export default function RepeaterSetupPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · Deep dive`}
          eyebrowTone="sunset"
          title={
            <>
              Repeater
              <span className="block text-mesh">setup guide</span>
            </>
          }
          description={`Set up and tune a repeater node for the ${COMMUNITY_NAME} network — TX/RX delay profiles, AGC tuning, and serial preflight.`}
          actions={
            <>
              <a href="#first-run" className="btn-primary">
                First-run checklist
              </a>
              <a href="#profiles" className="btn-secondary">
                Delay profiles
              </a>
              <a href="#serial-preflight" className="btn-outline">
                Serial preflight
              </a>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Repeater Setup' }]} />
            </div>
          }
        />

        {/* Getting Your Repeater Running */}
        <section id="getting-running" className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-3">
              Getting your repeater running.
            </h2>
            <p className="text-foreground-muted mb-8 max-w-2xl">
              If you flashed the device with Repeater firmware from the web flasher, the
              repeater role is already applied. For most operators, getting online is about{" "}
              <span className="text-foreground">verifying</span> the radio preset and{" "}
              <span className="text-foreground">syncing the clock</span> — not changing the role.
            </p>

            <div className="panel p-6 sm:p-8">
              <ol className="space-y-4 list-none">
                {[
                  {
                    title: "Flash Repeater firmware via the web flasher",
                    body: "This bakes in the repeater role. You should not need to set it manually.",
                  },
                  {
                    title: "Mount high with line of sight + a real external antenna",
                    body: "Elevation and antenna quality matter more than transmit power.",
                  },
                  {
                    title: "Power from a stable supply",
                    body: "Wall adapter, POE, or solar with battery backup. Avoid bus-powered USB hubs.",
                  },
                  {
                    title: "Verify and tune via USB / Web Serial",
                    body: "Walk the first-run checklist below, then pick a delay profile and set common settings.",
                  },
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-foreground-muted">
                    <span className="text-forest-500 mt-0.5 font-bold">{index + 1}.</span>
                    <div>
                      <div className="text-foreground font-medium">{step.title}</div>
                      <div className="text-sm mt-0.5">{step.body}</div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {/* Clock sync warning */}
                <div className="p-4 bg-sunset-500/10 border border-sunset-500/30 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-1">Sync the clock every power cycle</h3>
                  <p className="text-foreground-muted text-sm">
                    Repeaters boot with an old date. Without a correct clock, relayed
                    message timestamps are wrong.
                  </p>
                  <ul className="text-foreground-muted text-sm mt-2 space-y-1">
                    <li>
                      <span className="text-foreground">GPS-capable firmware + hardware:</span>{" "}
                      <code className="font-mono text-mesh">gps on</code> then{" "}
                      <code className="font-mono text-mesh">gps sync</code> pulls time from
                      the GPS fix.
                    </li>
                    <li>
                      <span className="text-foreground">Otherwise:</span> connect with the
                      companion app or the Web Serial console and run{" "}
                      <code className="font-mono text-mesh">clock sync</code> after every
                      reboot or power cycle.
                    </li>
                  </ul>
                </div>

                {/* Equals-sign caution */}
                <div className="p-4 bg-sunset-700/10 border border-sunset-700/40 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-1">Don&apos;t type an equals sign</h3>
                  <p className="text-foreground-muted text-sm">
                    The CLI uses a space, not <code className="font-mono text-mesh">=</code>.
                    Typing{" "}
                    <code className="font-mono text-foreground-dim">set path.hash.mode = 1</code>{" "}
                    can silently fail or store a garbage value — the node looks configured
                    but isn&apos;t. Always use{" "}
                    <code className="font-mono text-mesh">set path.hash.mode 1</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* First-Run CLI Checklist */}
        <section id="first-run" className="px-4 sm:px-6 lg:px-8 py-16 bg-background-secondary">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              First-run CLI checklist
            </h2>
            <p className="text-foreground-muted text-center mb-3 max-w-3xl mx-auto">
              The minimum sequence a brand-new operator should run after flashing
              Repeater firmware. Use the{" "}
              <Link href="/tools/serial-usb" className="text-mesh hover:text-mesh-light underline underline-offset-2">
                Web Serial console
              </Link>{" "}
              — same default profile as the utility site.
            </p>
            <p className="text-foreground-muted text-center mb-10 max-w-3xl mx-auto text-sm">
              Colorado defaults: <span className="font-mono text-mesh">{coloradoDefaultsSummary}</span>
            </p>

            <div className="space-y-4">
              {firstRunChecklist.map((item) => (
                <div key={item.label} className="card-mesh p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{item.label}</h3>
                      <p className="text-sm text-foreground-muted">{item.detail}</p>
                      {item.expect ? (
                        <p className="text-xs text-foreground-muted mt-2">
                          <span className="font-medium text-foreground">Expect:</span>{" "}
                          <span className="font-mono text-mesh">{item.expect}</span>
                        </p>
                      ) : null}
                    </div>
                    <div className="md:w-80 flex-shrink-0">
                      <div className="bg-night-900 rounded-lg p-4 font-mono text-sm">
                        <div className="text-foreground-muted text-xs mb-2">Commands</div>
                        <pre className="text-forest-400 whitespace-pre-wrap">{item.commands}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-foreground-muted mt-8 text-center">
              After this, choose a{" "}
              <a href="#profiles" className="text-mesh hover:text-mesh-light underline underline-offset-2">
                delay profile
              </a>{" "}
              for your site, apply the{" "}
              <a href="#common" className="text-mesh hover:text-mesh-light underline underline-offset-2">
                common settings
              </a>
              , and run the{" "}
              <a href="#serial-preflight" className="text-mesh hover:text-mesh-light underline underline-offset-2">
                full serial preflight
              </a>{" "}
              before leaving the install online.
            </p>
          </div>
        </section>

        {/* Repeater Configuration Profiles */}
        <section id="profiles" className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Repeater Configuration Profiles
            </h2>
            <p className="text-foreground-muted text-center mb-4 max-w-3xl mx-auto">
              Higher elevation nodes wait longer before retransmitting, letting local nodes handle nearby traffic first. The network self-organizes without manual routing.
            </p>
            <p className="text-foreground-muted text-center mb-12 max-w-3xl mx-auto text-sm">
              Choose the profile that best matches your repeater&apos;s location and elevation.
            </p>

            {/* Profile Selection Table (desktop) */}
            <div className="hidden lg:block card-mesh overflow-hidden mb-12">
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Profile</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Elevation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Neighbors</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Example Locations</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">When to Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {delayProfiles.map((profile) => (
                    <tr key={profile.name} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${profile.color}`}>
                          {profile.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">{profile.elevation}</td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">{profile.neighbors}</td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">{profile.examples}</td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">{profile.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Profile Cards with CLI Commands */}
            <div className="space-y-6">
              {delayProfiles.map((profile) => (
                <div key={profile.name} className={`card-mesh p-6 border-l-4 ${profile.color}`}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${profile.color}`}>
                          {profile.name}
                        </span>
                        <span className="text-sm text-foreground-muted">{profile.elevation} elevation</span>
                      </div>
                      <p className="text-foreground-muted text-sm mb-1">{profile.when}</p>
                      <p className="text-foreground-muted text-xs">
                        <span className="font-medium">Examples:</span> {profile.examples}
                      </p>
                      <p className="text-foreground-muted text-xs mt-1">
                        <span className="font-medium">Typical neighbors:</span> {profile.neighbors}
                      </p>
                    </div>
                    <div className="md:w-72 flex-shrink-0">
                      <div className="bg-night-900 rounded-lg p-4 font-mono text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-foreground-muted text-xs">CLI Commands</span>
                        </div>
                        <pre className="text-forest-400 whitespace-pre">{profile.commands}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Common Settings */}
        <section id="common" className="px-6 py-16 bg-background-secondary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Common Settings (Colorado MeshCore Repeaters)
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Apply these after the first-run checklist, regardless of your repeater&apos;s
              delay profile. Use spaces, never <code className="font-mono text-mesh">=</code>.
            </p>

            {/* CLI block */}
            <div className="card-mesh overflow-hidden mb-8">
              <div className="bg-night-900 p-6 font-mono text-sm">
                <div className="text-foreground-muted text-xs mb-3">CLI Commands</div>
                <pre className="text-forest-400 whitespace-pre">{`set path.hash.mode 1
set advert.interval 240
set flood.advert.interval 24
set agc.reset.interval 500
set guest.password`}</pre>
              </div>
            </div>

            {/* Reference table */}
            <div className="card-mesh overflow-hidden">
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Setting</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Value</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">What it does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {commonSettings.map((row) => (
                    <tr key={row.setting} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-sm text-mesh">{row.setting}</td>
                      <td className="px-6 py-3 font-mono text-sm text-foreground-muted">{row.value}</td>
                      <td className="px-6 py-3 text-sm text-foreground-muted">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Serial Preflight */}
        <section id="serial-preflight" className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              USB Serial Preflight
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-3xl mx-auto">
              The first-run checklist is the minimum to get a node online. This preflight is
              the deeper audit — run it before and after a field install to verify everything
              persisted and the node is healthy. Uses the same default command profile as the
              Colorado Mesh utility site.
            </p>

            <div className="card-mesh overflow-hidden mb-8">
              <div className="p-4 border-b border-card-border">
                <h3 className="font-semibold text-foreground">Serial connection settings</h3>
              </div>
              <table className="w-full">
                <tbody className="divide-y divide-card-border">
                  {serialSettings.map((row) => (
                    <tr key={row.setting} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-6 py-3 text-sm text-foreground-muted">{row.setting}</td>
                      <td className="px-6 py-3 font-mono text-sm text-mesh">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {serialCommandGroups.map((group) => (
                <div key={group.title} className="card-mesh p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{group.title}</h3>
                  <p className="text-sm text-foreground-muted mb-4">{group.purpose}</p>
                  <div className="bg-night-900 rounded-lg p-4 font-mono text-sm">
                    <div className="text-foreground-muted text-xs mb-2">Commands</div>
                    <pre className="text-forest-400 whitespace-pre-wrap">{group.commands}</pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-mesh p-6 md:p-8 mt-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">Optional site-specific checks</h3>
              <p className="text-foreground-muted text-sm mb-6">
                Only run these when the hardware or install actually uses bridge mode, GPS, or power-saving behavior.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {optionalSerialChecks.map((check) => (
                  <div key={check.title} className="bg-night-900 rounded-lg p-4 font-mono text-sm">
                    <div className="text-foreground-muted text-xs mb-2">{check.title}</div>
                    <pre className="text-forest-400 whitespace-pre-wrap">{check.commands}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Understanding the Settings */}
        <section id="understanding" className="px-6 py-16 bg-background-secondary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Understanding the Settings
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Technical reference for TX/RX delay configuration.
            </p>

            {/* txdelay explanation */}
            <div className="card-mesh p-6 md:p-8 mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                txdelay / direct.txdelay
              </h3>
              <ul className="space-y-3 text-foreground-muted">
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Controls how long a repeater waits before retransmitting a received packet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>
                    Formula: <code className="bg-night-800/50 px-2 py-0.5 rounded text-sm font-mono text-mesh">unit = estimated_airtime x txdelay</code>, then <code className="bg-night-800/50 px-2 py-0.5 rounded text-sm font-mono text-mesh">delay = random(0..5) x unit</code>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Higher values create a wider random window, meaning more deference to other nodes that may retransmit first.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span><code className="bg-night-800/50 px-2 py-0.5 rounded text-sm font-mono text-mesh">direct.txdelay</code> is the same mechanism but for routed point-to-point messages (usually set lower because direct messages benefit from faster delivery).</span>
                </li>
              </ul>
            </div>

            {/* rxdelay explanation */}
            <div className="card-mesh p-6 md:p-8 mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                rxdelay — SNR-Based Path Selection
              </h3>
              <ul className="space-y-3 text-foreground-muted">
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Only affects <strong className="text-foreground">flood packets</strong> — direct (point-to-point) packets are always processed immediately. Delays processing of floods based on signal quality (SNR).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Strong signal = processed immediately. Weak signal = delayed and likely dropped as a duplicate.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Effect: the mesh naturally prefers the strongest, cleanest paths without any manual routing configuration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>All Denver repeaters use <code className="bg-night-800/50 px-2 py-0.5 rounded text-sm font-mono text-mesh">rxdelay 3</code>.</span>
                </li>
              </ul>
            </div>

            {/* agc.reset.interval explanation */}
            <div className="card-mesh p-6 md:p-8 mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                agc.reset.interval — Radio Deafness Prevention
              </h3>
              <ul className="space-y-3 text-foreground-muted">
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Periodically resets the LoRa radio&apos;s Automatic Gain Control (AGC) to prevent &quot;deafness&quot; caused by strong out-of-band RF interference.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Without this, the SX1262 AGC can lock up, clamping the noise floor at -120 dBm and making the repeater unable to hear weaker signals until rebooted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>AGC is also reset automatically after every transmission — this setting only matters during long idle/receive periods.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Especially important for hilltop repeaters near broadcast towers or cell sites. Denver repeaters use <code className="bg-night-800/50 px-2 py-0.5 rounded text-sm font-mono text-mesh">agc.reset.interval 500</code> (~8 minutes).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mesh mt-0.5">•</span>
                  <span>Values are stored in 4-second increments (e.g., 60 is rounded to 60). Range: 4–1020 seconds. Set to 0 to disable.</span>
                </li>
              </ul>
            </div>

            {/* Quick Reference Table */}
            <div className="card-mesh overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h3 className="font-semibold text-foreground">Quick Reference</h3>
              </div>
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Setting</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Default</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Range</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Controls</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Rule of Thumb</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {settingsReference.map((row) => (
                    <tr key={row.setting} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-mesh">{row.setting}</td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{row.default}</td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{row.range}</td>
                      <td className="px-4 py-3 text-sm text-foreground-muted">{row.controls}</td>
                      <td className="px-4 py-3 text-sm text-foreground-muted">{row.rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Owner Info */}
        <section className="px-6 py-16 bg-background-secondary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Setting Owner Info
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Help the community identify and maintain repeaters by setting owner information.
            </p>

            <div className="card-mesh p-6 md:p-8">
              <p className="text-foreground-muted mb-4">
                Consider including the following details in your repeater&apos;s owner info:
              </p>
              <ul className="space-y-2 text-foreground-muted">
                <li className="flex items-start gap-2">
                  <span className="text-forest-500 mt-0.5">•</span>
                  <span><strong className="text-foreground">Callsign or handle</strong> — your ham callsign or Discord username</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest-500 mt-0.5">•</span>
                  <span><strong className="text-foreground">Antenna specs</strong> — type, gain, height above ground</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest-500 mt-0.5">•</span>
                  <span><strong className="text-foreground">Power source</strong> — mains, solar, battery backup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest-500 mt-0.5">•</span>
                  <span><strong className="text-foreground">Install type</strong> — rooftop, tower, indoor, portable</span>
                </li>
              </ul>
              <div className="mt-6 bg-night-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-foreground-muted text-xs mb-2">Example</div>
                <pre className="text-forest-400 whitespace-pre">{`set owner KE0ABC / 6dBi omni @30ft / Solar+Batt / Rooftop`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Take it to the tools
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              The reference is in your head — now apply it. These operator tools share the same live network data as the map.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/tools/repeater-name" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Repeater name wizard</h3>
                <p className="mt-1 text-sm text-foreground-muted">Compose a standards-aligned repeater name with conflict checks.</p>
              </Link>
              <Link href="/tools/prefix-matrix" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Planning Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Public-key prefix matrix</h3>
                <p className="mt-1 text-sm text-foreground-muted">Find a free first-byte prefix before generating a new key pair.</p>
              </Link>
              <Link href="/tools/serial-usb" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Field Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Serial USB console</h3>
                <p className="mt-1 text-sm text-foreground-muted">Run the preflight commands and apply settings over USB.</p>
              </Link>
              <Link href="/map" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Live Coverage</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Live Map</h3>
                <p className="mt-1 text-sm text-foreground-muted">Confirm your repeater is online and visible to neighbors.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16 bg-mountain-gradient text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Help With Your Repeater?</h2>
            <p className="text-mountain-100 mb-8 text-lg">
              Join our Discord community to get advice on placement, antenna selection, and configuration.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://discord.gg/Tuuv9hGPnX"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent"
              >
                Join Our Discord
              </a>
              <Link href="/guides/naming-standard" className="btn-outline border-white text-white hover:bg-white hover:text-mountain-700">
                Name Your Repeater
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

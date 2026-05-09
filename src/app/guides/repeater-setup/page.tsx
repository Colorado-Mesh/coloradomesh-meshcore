import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { BASE_URL } from "@/lib/constants";

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

const settingsReference = [
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
    purpose: "Verify the node name, repeater role, radio preset, frequency, transmit power, airtime factor, and public key.",
    commands: `get name
get role
get radio
get freq
get tx
get af
get repeat
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
get guest.password
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
get bridge.baud
get bridge.secret`,
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
      <div className="min-h-screen bg-mesh">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Repeater Setup' }]} />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Repeater <span className="text-mesh">Setup Guide</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground-muted mb-8">
              Set up and tune a repeater node for the Colorado MeshCore network
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#getting-running" className="btn-primary">
                Getting Started
              </a>
              <a href="#profiles" className="btn-outline">
                TX/RX Delay Profiles
              </a>
              <a href="#serial-preflight" className="btn-outline">
                Serial Preflight
              </a>
              <a href="#understanding" className="btn-outline">
                Technical Reference
              </a>
            </div>
          </div>
        </section>

        {/* Getting Your Repeater Running */}
        <section id="getting-running" className="px-6 py-16 bg-background-secondary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Getting Your Repeater Running
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Follow these steps to get a basic repeater node online.
            </p>

            <div className="card-mesh p-6 md:p-8">
              <ul className="space-y-4">
                {[
                  "Flash with Repeater firmware from the web flasher",
                  "Place at high elevation with good line of sight",
                  "Use a quality external antenna for better range",
                  "Ensure stable power supply (wall adapter or solar preferred)",
                  "Configure via USB using the web config tool",
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-foreground-muted">
                    <span className="text-forest-500 mt-0.5 font-bold">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              {/* Clock sync warning */}
              <div className="mt-6 p-4 bg-sunset-500/10 border border-sunset-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-sunset-500 text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Clock Sync Required</h4>
                    <p className="text-foreground-muted text-sm">
                      Repeaters default to an old date on reboot. You must sync the clock after every power cycle by connecting with the companion app or web config tool. Without a correct clock, timestamps on relayed messages will be wrong.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
              Apply these settings regardless of your repeater&apos;s profile.
            </p>

            {/* CLI block */}
            <div className="card-mesh overflow-hidden mb-8">
              <div className="bg-night-900 p-6 font-mono text-sm">
                <div className="text-foreground-muted text-xs mb-3">CLI Commands</div>
                <pre className="text-forest-400 whitespace-pre">{`set advert.interval 240
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
              The Web Serial console uses the same default command profile as the Colorado Mesh utility site. Use it before and after field installs to verify the repeater is configured and healthy.
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
              <Link href="/tools/repeater-name" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Repeater name wizard</h3>
                <p className="mt-1 text-sm text-foreground-muted">Compose a standards-aligned repeater name with conflict checks.</p>
              </Link>
              <Link href="/tools/prefix-matrix" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Planning Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Public-key prefix matrix</h3>
                <p className="mt-1 text-sm text-foreground-muted">Find a free first-byte prefix before generating a new key pair.</p>
              </Link>
              <Link href="/tools/serial-usb" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Field Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Serial USB console</h3>
                <p className="mt-1 text-sm text-foreground-muted">Run the preflight commands and apply settings over USB.</p>
              </Link>
              <Link href="/map" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
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

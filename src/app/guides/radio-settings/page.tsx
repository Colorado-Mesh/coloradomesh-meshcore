import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { BASE_URL } from "@/lib/constants";
import {
  COLORADO_MESH_RADIO_COMMANDS,
  COLORADO_MESH_RADIO_SETTINGS,
  formatRadioBandwidthHz,
  formatRadioFrequencyKHz,
} from "@/lib/meshcore-data/settings";

export const metadata: Metadata = {
  title: "Radio Settings & Channels",
  description: "Colorado MeshCore radio settings, frequency configuration, and channel list for the Front Range mesh network.",
  keywords: ["MeshCore", "radio settings", "LoRa", "frequency", "channels", "Colorado", "Denver", "Front Range", "mesh network", "910.525 MHz"],
  alternates: {
    canonical: '/guides/radio-settings',
  },
  openGraph: {
    title: "Radio Settings & Channels | Colorado MeshCore",
    description: "Colorado MeshCore radio settings, frequency configuration, and channel list.",
    url: `${BASE_URL}/guides/radio-settings`,
  },
};

const radioSettings = [
  {
    setting: "Frequency",
    value: formatRadioFrequencyKHz(COLORADO_MESH_RADIO_SETTINGS.frequency),
  },
  {
    setting: "Bandwidth",
    value: formatRadioBandwidthHz(COLORADO_MESH_RADIO_SETTINGS.bandwidth),
  },
  {
    setting: "Spreading Factor",
    value: String(COLORADO_MESH_RADIO_SETTINGS.spreadingFactor),
  },
  {
    setting: "Coding Rate",
    value: String(COLORADO_MESH_RADIO_SETTINGS.codingRate),
  },
  {
    setting: "TX Power",
    value: `${COLORADO_MESH_RADIO_SETTINGS.txPower} dBm`,
  },
];

const radioCommands = COLORADO_MESH_RADIO_COMMANDS.join("\n");

const channels = [
  { topic: "#denver", key: "b24355a0d22ed2bf393ec530d75810b4" },
  { topic: "#frontrange", key: "3adcf6aa656eb14fe6eb785b2c903b36" },
  { topic: "#bot", key: "eb50a1bcb3e4e5d7bf69a57c9dada211" },
  { topic: "#emergency", key: "e1ad578d25108e344808f30dfdaaf926" },
  { topic: "#hamradio", key: "83c8b01997654265938da8765cbc7db9" },
  { topic: "#testing", key: "cde5e82cf515647dcb547a79a4f065d1" },
];

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Guides', url: `${BASE_URL}/guides` },
  { name: 'Radio Settings & Channels', url: `${BASE_URL}/guides/radio-settings` },
]);

export default function RadioSettingsPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen bg-mesh">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Radio Settings & Channels' }]} />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Radio Settings & <span className="text-mesh">Channels</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground-muted mb-8">
              Frequencies, presets, and channel list for the Denver/Front Range area
            </p>
          </div>
        </section>

        {/* Radio Settings */}
        <section className="px-6 py-16 bg-background-secondary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Radio Settings
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Use these settings to connect to other nodes in our area. These settings can be found in the MeshCore app listed as <span className="text-mesh font-semibold">USA/Canada (Recommended)</span>.
            </p>

            <div className="card-mesh overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Setting</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {radioSettings.map((row) => (
                    <tr key={row.setting} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-6 py-4 text-foreground-muted">{row.setting}</td>
                      <td className="px-6 py-4 font-mono text-mesh">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-mesh overflow-hidden mb-8">
              <div className="bg-night-900 p-6 font-mono text-sm">
                <div className="text-foreground-muted text-xs mb-3">Repeater CLI commands</div>
                <pre className="text-forest-400 whitespace-pre-wrap">{radioCommands}</pre>
              </div>
            </div>

            <p className="text-sm text-foreground-muted text-center">
              These are the canonical Colorado Mesh recommended settings used by the utility-site configuration generator. More information about MeshCore radio configuration can be found in the{" "}
              <a href="https://meshcore.co.uk/" target="_blank" rel="noopener noreferrer" className="text-mesh hover:text-mesh-light">
                MeshCore documentation
              </a>.
            </p>
          </div>
        </section>

        {/* Channels */}
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Channels
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Join these channels to communicate with other Colorado MeshCore members.
            </p>

            <div className="card-mesh overflow-hidden">
              <div className="p-6 border-b border-card-border">
                <p className="text-foreground-muted text-sm">
                  Hashtag topic keys are automatically calculated by the system. The keys are included to help users on devices that cannot type the # (hash) symbol or lack the key calculation functionality.
                </p>
              </div>
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Topic</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {channels.map((channel) => (
                    <tr key={channel.topic} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-6 py-3 font-semibold text-mountain-500">{channel.topic}</td>
                      <td className="px-6 py-3 font-mono text-xs text-foreground-muted break-all">{channel.key}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <Link href="/guides/repeater-setup" className="btn-primary inline-flex items-center gap-2">
                Repeater Setup Guide
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-background-secondary">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Apply the settings
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              You have the reference. Use the operator tools and live map to push the settings to a node and confirm it joined the mesh.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/guides/repeater-setup" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Deep Dive</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Repeater setup</h3>
                <p className="mt-1 text-sm text-foreground-muted">TX/RX delay profiles and serial preflight for repeater operators.</p>
              </Link>
              <Link href="/tools/serial-usb" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Field Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Serial USB console</h3>
                <p className="mt-1 text-sm text-foreground-muted">Push the radio commands above to a node directly from the browser.</p>
              </Link>
              <Link href="/map" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Live Coverage</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Live Map</h3>
                <p className="mt-1 text-sm text-foreground-muted">Confirm your node is broadcasting on the Front Range preset.</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

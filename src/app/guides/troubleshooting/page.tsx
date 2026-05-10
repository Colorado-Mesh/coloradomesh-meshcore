import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { HeroPanel, SectionEyebrow } from "@/components/brand";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { generateFAQSchema, startPageFAQData } from "@/lib/schemas/faq";
import { ANALYZER_URL, BASE_URL, COMMUNITY_NAME, DISCORD_INVITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Troubleshooting & Resources",
  description: "Common MeshCore troubleshooting issues and solutions, plus helpful resources and community links for the Colorado MeshCore network.",
  keywords: ["MeshCore", "troubleshooting", "help", "Colorado", "Denver", "Front Range", "mesh network", "FAQ", "resources", "support"],
  alternates: {
    canonical: '/guides/troubleshooting',
  },
  openGraph: {
    title: "Troubleshooting & Resources | Colorado MeshCore",
    description: "Common issues and solutions for the Colorado MeshCore network.",
    url: `${BASE_URL}/guides/troubleshooting`,
  },
};

const troubleshootingItems = [
  {
    issue: "Device not detected during flashing",
    solutions: [
      "Try a different USB cable (use data cable, not charge-only)",
      "Install CH340 or CP210x drivers for your device",
      "Hold BOOT button while connecting USB",
      "Try a different USB port (USB 2.0 often works better)",
    ],
  },
  {
    issue: "No other nodes visible",
    solutions: [
      "Make sure you configured the preset for USA/Canada in the app",
      "Verify antenna is properly connected before powering on",
      "Move to a location with better line of sight",
      "Nodes don't auto-discover - you need to add contacts or join channels",
      "Check our Discord for current network status",
    ],
  },
  {
    issue: "Cannot connect via Bluetooth",
    solutions: [
      "Make sure you flashed the Companion BLE firmware",
      "Enable Bluetooth on your phone and grant permissions",
      "Try restarting both devices",
      "Forget the device in Bluetooth settings and re-pair",
    ],
  },
  {
    issue: "GPS not working",
    solutions: [
      "Not all devices have GPS - check your hardware specs",
      "Move outdoors with clear sky view",
      "Wait up to 5 minutes for initial GPS lock",
      "GPS may not work well indoors or near buildings",
    ],
  },
  {
    issue: "Poor range/connection quality",
    solutions: [
      "Use a quality external antenna if your device supports it",
      "Elevate your device (higher is always better for LoRa)",
      "Avoid indoor locations with metal structures",
      "Line of sight is critical for LoRa communications",
    ],
  },
];

const resources = [
  {
    name: `${COMMUNITY_NAME} analyzer`,
    url: ANALYZER_URL,
    description: "Per-node telemetry, link quality, and routing for the Colorado Mesh.",
  },
  {
    name: "MeshCore official website",
    url: "https://meshcore.io/",
    description: "Official MeshCore project website with downloads and guides.",
  },
  {
    name: "MeshCore web flasher",
    url: "https://flasher.meshcore.io/",
    description: "Flash MeshCore firmware directly from your browser.",
  },
  {
    name: "MeshCore GitHub",
    url: "https://github.com/meshcore-dev/MeshCore",
    description: "Official MeshCore firmware source code and documentation.",
  },
  {
    name: "LetsMesh analyzer",
    url: "https://analyzer.letsmesh.net/",
    description: "Global mesh visualization and per-node statistics.",
  },
  {
    name: "DEN-DENVR-RUBY-OB-4d0c analyzer",
    url: "https://analyzer.letsmesh.net/node/4D0CC1003DBF678DF420907F9ACD77BD71D9E4C34300F72660F6BA6A2656A868",
    description: "View the DEN-DENVR-RUBY-OB-4d0c analyzer node on LetsMesh.",
  },
  {
    name: "Meadowood analyzer",
    url: "https://analyzer.letsmesh.net/node/7BC042F4C47C3539BBEF6C2FA520A9553B0C44E8EFEF2A3D90A39BE2FE7C7F4B",
    description: "View the Meadowood analyzer node on LetsMesh.",
  },
  {
    name: `${COMMUNITY_NAME} Discord`,
    url: DISCORD_INVITE_URL,
    description: "Community chat, support, and coordination.",
  },
];

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Guides', url: `${BASE_URL}/guides` },
  { name: 'Troubleshooting', url: `${BASE_URL}/guides/troubleshooting` },
]);

const faqData = generateFAQSchema(startPageFAQData);

export default function TroubleshootingPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <JsonLd data={faqData} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains={false}
          eyebrow={`${COMMUNITY_NAME} · Support`}
          eyebrowTone="sunset"
          title={
            <>
              Troubleshooting &amp;
              <span className="block text-mesh">resources</span>
            </>
          }
          description="Common issues and solutions, plus links to deeper telemetry and the operator chat."
          actions={
            <>
              <Link href="/tools/serial-usb" className="btn-primary">
                Open serial console
              </Link>
              <a
                href={ANALYZER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Network analyzer
              </a>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Discord
              </a>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Troubleshooting' }]} />
            </div>
          }
        />

        {/* Common Issues */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-4xl">
            <SectionEyebrow tone="sunset" className="mb-3">
              Common issues
            </SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Quick fixes from the field.
            </h2>
            <p className="mt-3 text-foreground-muted max-w-2xl mb-8">
              Running into something tricky? Click any item to expand step-by-step solutions.
            </p>

            <div className="space-y-4">
              {troubleshootingItems.map((item, index) => (
                <details key={index} className="panel overflow-hidden group">
                  <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-card-elevated transition-colors">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-3">
                      <span aria-hidden className="text-2xl text-sunset-500 leading-none">◊</span>
                      {item.issue}
                    </h3>
                    <span aria-hidden className="text-foreground-dim transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-card-border">
                    <ul className="space-y-2">
                      {item.solutions.map((solution, sIndex) => (
                        <li key={sIndex} className="text-foreground-muted flex items-start gap-2">
                          <span aria-hidden className="text-mesh mt-1">◊</span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-10 panel-elevated p-6 sm:p-7 text-center">
              <p className="text-foreground-muted mb-4">
                Still stuck? Operators are happy to help in #support.
              </p>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Get help on Discord
              </a>
            </div>
          </div>
        </section>

        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <SectionEyebrow tone="mesh" className="mb-3">
              Support tools
            </SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              When the FAQ doesn&apos;t unblock you.
            </h2>
            <p className="mt-3 text-foreground-muted max-w-2xl mb-10">
              Start with serial diagnostics, watch the live map, drill into the analyzer, then
              ask in Discord.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/tools/serial-usb"
                className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
              >
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">
                  Field tool
                </div>
                <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                  Serial USB console
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Talk to the node, dump version and stats, and check the radio over USB.
                </p>
              </Link>
              <Link
                href="/map"
                className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
              >
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">
                  Live coverage
                </div>
                <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                  Live Map
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Confirm your node is broadcasting and being seen by neighbors.
                </p>
              </Link>
              <a
                href={ANALYZER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
              >
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">
                  Telemetry
                </div>
                <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                  Network analyzer
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Per-node link quality, neighbors, and routing on the {COMMUNITY_NAME} analyzer.
                </p>
              </a>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
              >
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">
                  Community
                </div>
                <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                  Discord chat
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Ask in #support — operators are happy to help diagnose tricky issues.
                </p>
              </a>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <SectionEyebrow tone="sky" className="mb-3">
              Resources
            </SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              External documentation &amp; analyzers.
            </h2>
            <p className="mt-3 text-foreground-muted max-w-2xl mb-10">
              Helpful links to support your mesh networking journey — start with the {COMMUNITY_NAME} analyzer for live telemetry.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource) => (
                <a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="panel p-5 flex items-start gap-4 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
                >
                  <span aria-hidden className="text-3xl text-mesh leading-none mt-0.5">
                    ◊
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                      {resource.name}
                      <span aria-hidden className="ml-1 text-xs text-foreground-dim">↗</span>
                    </h3>
                    <p className="mt-1 text-sm text-foreground-muted leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

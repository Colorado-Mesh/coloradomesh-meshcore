import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { generateFAQSchema, startPageFAQData } from "@/lib/schemas/faq";
import { BASE_URL, DISCORD_INVITE_URL } from "@/lib/constants";

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
    name: "MeshCore Official Website",
    url: "https://meshcore.co.uk/",
    description: "Official MeshCore project website with downloads and guides",
  },
  {
    name: "MeshCore Web Flasher",
    url: "https://flasher.meshcore.co.uk/",
    description: "Flash MeshCore firmware directly from your browser",
  },
  {
    name: "MeshCore GitHub",
    url: "https://github.com/meshcore-dev/MeshCore",
    description: "Official MeshCore firmware source code and documentation",
  },
  {
    name: "LetsMesh Analyzer",
    url: "https://analyzer.letsmesh.net/",
    description: "Real-time network visualization and node statistics",
  },
  {
    name: "DEN-DENVR-RUBY-OB-4d0c Analyzer",
    url: "https://analyzer.letsmesh.net/node/4D0CC1003DBF678DF420907F9ACD77BD71D9E4C34300F72660F6BA6A2656A868",
    description: "View the DEN-DENVR-RUBY-OB-4d0c analyzer node on LetsMesh",
  },
  {
    name: "Meadowood Analyzer",
    url: "https://analyzer.letsmesh.net/node/7BC042F4C47C3539BBEF6C2FA520A9553B0C44E8EFEF2A3D90A39BE2FE7C7F4B",
    description: "View the Meadowood analyzer node on LetsMesh",
  },
  {
    name: "Colorado MeshCore Discord",
    url: "https://discord.gg/Tuuv9hGPnX",
    description: "Community chat, support, and coordination",
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
      <div className="min-h-screen bg-mesh">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Troubleshooting' }]} />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Troubleshooting & <span className="text-mesh">Resources</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground-muted mb-8">
              Common issues and solutions, plus helpful links
            </p>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="px-6 py-16 bg-background-secondary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Common Issues
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Running into issues? Here are solutions to common problems.
            </p>

            <div className="space-y-6">
              {troubleshootingItems.map((item, index) => (
                <details key={index} className="card-mesh overflow-hidden group">
                  <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-snow-100 dark:hover:bg-night-800 transition-colors">
                    <h3 className="text-lg font-semibold text-sunset-700 flex items-center gap-3">
                      <span className="text-xl">⚠️</span>
                      {item.issue}
                    </h3>
                    <svg
                      className="w-5 h-5 text-foreground-muted transform transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-card-border">
                    <ul className="space-y-2">
                      {item.solutions.map((solution, sIndex) => (
                        <li key={sIndex} className="text-foreground-muted flex items-start gap-2">
                          <span className="text-forest-500 mt-1">✓</span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-foreground-muted mb-4">
                Still having trouble? Our community is here to help!
              </p>
              <a
                href="https://discord.gg/Tuuv9hGPnX"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                Get Help on Discord
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Support tools
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              When the FAQ does not unblock you, these places will. Start with serial diagnostics, watch the live map, then ask in Discord.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/tools/serial-usb" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Field Tool</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Serial USB console</h3>
                <p className="mt-1 text-sm text-foreground-muted">Talk to the node, dump version and stats, and check the radio over USB.</p>
              </Link>
              <Link href="/map" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Live Coverage</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Live Map</h3>
                <p className="mt-1 text-sm text-foreground-muted">Confirm whether your node is broadcasting and being seen by neighbors.</p>
              </Link>
              <Link href="/tools" className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all">
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Operator Tools</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Tools hub</h3>
                <p className="mt-1 text-sm text-foreground-muted">Naming, prefix planning, and field utilities — all the operator entry points.</p>
              </Link>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="card-mesh p-5 group hover:ring-2 hover:ring-mesh transition-all"
              >
                <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Community</div>
                <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Discord chat</h3>
                <p className="mt-1 text-sm text-foreground-muted">Ask in #support — operators are happy to help diagnose tricky issues.</p>
              </a>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Resources
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Helpful links and documentation to support your mesh networking journey.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource) => (
                <a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-mesh p-5 flex items-start gap-4 hover:ring-2 hover:ring-mesh transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-mountain-100 dark:bg-night-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-mountain-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{resource.name}</h3>
                    <p className="text-sm text-foreground-muted">{resource.description}</p>
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

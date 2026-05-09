import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { generateHowToSchema, meshCoreSetupHowTo } from "@/lib/schemas/howto";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Getting Started with MeshCore",
  description: "Learn how to join the Colorado MeshCore network. Hardware requirements, firmware setup guide, configuration instructions, and community resources.",
  keywords: ["MeshCore", "mesh network", "getting started", "Colorado", "Denver", "Front Range", "LoRa", "ESP32", "firmware", "setup guide", "tutorial"],
  alternates: {
    canonical: '/guides/getting-started',
  },
  openGraph: {
    title: "Getting Started with MeshCore | Colorado MeshCore",
    description: "Learn how to join the Colorado MeshCore network with our step-by-step setup guide.",
    url: `${BASE_URL}/guides/getting-started`,
  },
};

const recommendedDevices = [
  {
    name: "Seeed Studio T1000-E",
    description: "Credit card sized, waterproof, long-life battery, high-performance antenna. Perfect for mobile use.",
    specs: "nRF52840, SX1262 LoRa, GPS, Waterproof, Built-in Battery",
    link: "https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html",
    recommended: true,
  },
  {
    name: "RAK WisBlock 4631",
    description: "Modular system for custom builds. Excellent for repeaters and solar setups. Low power consumption.",
    specs: "nRF52840, SX1262 LoRa, Modular design, Low power",
    link: "https://store.rakwireless.com/products/rak4631-lpwan-node",
    recommended: true,
  },
  {
    name: "Heltec WiFi LoRa 32 V4",
    description: "Latest Heltec with improved power output and built-in antennas. Budget-friendly option.",
    specs: "ESP32-S3, SX1262 LoRa, 28dBm output, Protected OLED, USB-C",
    link: "https://heltec.org/project/wifi-lora-32-v4/",
    recommended: false,
  },
  {
    name: "LilyGO T-Deck+",
    description: "Standalone device with keyboard and screen. No smartphone needed.",
    specs: "ESP32-S3, SX1262 LoRa, 2.8\" LCD, Physical Keyboard, GPS",
    link: "https://www.lilygo.cc/products/t-deck",
    recommended: false,
  },
];

const setupSteps = [
  {
    number: 1,
    title: "Flash MeshCore Firmware",
    description: "Flash the MeshCore firmware onto your device using the official web flasher. No software installation needed.",
    tips: [
      "Use Chrome or Edge browser (WebSerial required)",
      "Connect your device via USB before starting",
      "Select your exact device model and frequency (915MHz for USA)",
      "Some devices require holding BOOT button while connecting",
    ],
    link: {
      text: "MeshCore Web Flasher",
      url: "https://flasher.meshcore.co.uk/",
    },
  },
  {
    number: 2,
    title: "Configure Your Node",
    description: "Set up your node using the MeshCore Companion app (iOS/Android) or the web config tool.",
    tips: [
      "Download the MeshCore app from App Store or Google Play",
      "Connect to your node via Bluetooth",
      "Set a unique, memorable node name",
      "Use the web config tool for advanced settings",
    ],
    link: {
      text: "MeshCore Apps",
      url: "https://meshcore.co.uk/apps.html",
    },
  },
  {
    number: 3,
    title: "Join the Community",
    description: "Connect with other Colorado MeshCore operators on Discord to get help, share experiences, and coordinate network improvements.",
    tips: [
      "Introduce yourself in the #introductions channel",
      "Ask questions in #support if you need help",
      "Share your node location to help map coverage",
    ],
    link: {
      text: "Join Discord",
      url: "https://discord.gg/Tuuv9hGPnX",
    },
  },
];

const configTips = [
  {
    title: "Frequency & Region",
    items: [
      "Select 915MHz firmware for USA operation",
      "MeshCore handles frequency configuration automatically",
      "Ensure antenna is connected before powering on",
      "Use the correct antenna for your frequency band",
    ],
  },
  {
    title: "Device Roles",
    items: [
      "Companion: Pairs with smartphone app via Bluetooth",
      "Repeater: Extends network coverage (no smartphone needed)",
      "Room Server: Creates chat rooms for group messaging",
      "Choose role based on your use case",
    ],
  },
  {
    title: "Denver Area Tips",
    items: [
      "Higher elevation = better range (line of sight)",
      "TX Power: Use maximum for best coverage",
      "Enable GPS for positioning on the network map",
      "Join the Colorado MeshCore Discord for local help",
    ],
  },
];

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Guides', url: `${BASE_URL}/guides` },
  { name: 'Getting Started', url: `${BASE_URL}/guides/getting-started` },
]);

const howToData = generateHowToSchema(
  meshCoreSetupHowTo.name,
  meshCoreSetupHowTo.description,
  meshCoreSetupHowTo.steps,
  {
    totalTime: meshCoreSetupHowTo.totalTime,
    estimatedCost: meshCoreSetupHowTo.estimatedCost,
    supply: meshCoreSetupHowTo.supply,
    tool: meshCoreSetupHowTo.tool,
  }
);

export default function GettingStartedPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <JsonLd data={howToData} />
      <div className="min-h-screen bg-mesh">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Getting Started' }]} />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Get Started with <span className="text-mesh">MeshCore</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground-muted mb-8">
              Join the Colorado MeshCore network and connect with the community
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#hardware" className="btn-primary">
                View Hardware
              </a>
              <a href="#setup" className="btn-outline">
                Setup Guide
              </a>
            </div>
          </div>
        </section>

        {/* Hardware Requirements */}
        <section id="hardware" className="px-6 py-16 bg-background-secondary">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Hardware Requirements
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              MeshCore runs on LoRa devices with ESP32 or nRF52 chips. Here are our recommended options.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedDevices.map((device) => (
                <div
                  key={device.name}
                  className={`card-mesh p-6 ${device.recommended ? 'ring-2 ring-mesh' : ''}`}
                >
                  {device.recommended && (
                    <span className="inline-block px-3 py-1 text-xs font-bold bg-mesh text-white rounded-full mb-3">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-xl font-semibold text-foreground mb-2">{device.name}</h3>
                  <p className="text-foreground-muted mb-3">{device.description}</p>
                  <p className="text-sm text-mountain-500 mb-4 font-mono">{device.specs}</p>
                  <a
                    href={device.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light transition-colors inline-flex items-center gap-1"
                  >
                    View Product
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>

            {/* Store Links */}
            <div className="mt-12 card-mesh p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 text-center">Where to Buy</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <a href="https://www.seeedstudio.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-mountain-500/10 hover:bg-mountain-500/20 text-mountain-500 rounded-lg transition-colors font-medium">
                  Seeed Studio
                </a>
                <a href="https://store.rakwireless.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-forest-500/10 hover:bg-forest-500/20 text-forest-500 rounded-lg transition-colors font-medium">
                  RAK Wireless Store
                </a>
                <a href="https://store.rokland.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-mountain-500/10 hover:bg-mountain-500/20 text-mountain-500 rounded-lg transition-colors font-medium">
                  Rokland
                </a>
                <a href="https://muzi.works/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-sunset-500/10 hover:bg-sunset-500/20 text-sunset-500 rounded-lg transition-colors font-medium">
                  Muzi Works
                </a>
                <a href="https://www.etsy.com/shop/PeakMesh" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-mesh/10 hover:bg-mesh/20 text-mesh rounded-lg transition-colors font-medium">
                  PeakMesh
                </a>
              </div>
              <p className="text-center text-foreground-muted mt-4 text-sm">
                Need help choosing? Ask in our{" "}
                <a
                  href="https://discord.gg/Tuuv9hGPnX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mesh hover:text-mesh-light"
                >
                  Discord community
                </a>
                !
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-Step Setup Guide */}
        <section id="setup" className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Step-by-Step Setup Guide
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Follow these steps to get your node up and running on the Colorado MeshCore network.
            </p>

            <div className="space-y-8">
              {setupSteps.map((step) => (
                <div key={step.number} className="card-mesh p-6 md:p-8">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-mountain-500 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-foreground-muted mb-4">{step.description}</p>

                      <ul className="space-y-2 mb-4">
                        {step.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-foreground-muted">
                            <span className="text-forest-500 mt-1">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>

                      {step.link && (
                        <a
                          href={step.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-accent inline-flex items-center gap-2"
                        >
                          {step.link.text}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Configuration Tips */}
        <section id="config" className="px-6 py-16 bg-background-secondary">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Configuration Tips
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Recommended settings for optimal performance in the Denver/Front Range area.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {configTips.map((section) => (
                <div key={section.title} className="card-mesh p-6">
                  <h3 className="text-xl font-semibold text-mountain-500 mb-4">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.items.map((item, index) => (
                      <li key={index} className="text-foreground-muted text-sm flex items-start gap-2">
                        <span className="text-mesh mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
              Next Steps
            </h2>
            <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
              Now that your node is running, keep learning with the related guides — then act in the operator tools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Link href="/guides/radio-settings" className="card-mesh p-6 hover:ring-2 hover:ring-mesh transition-all group text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-mesh/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-mesh" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-mesh transition-colors">Radio Settings</h3>
                <p className="text-sm text-foreground-muted">View frequencies and channels</p>
              </Link>

              <Link href="/guides/repeater-setup" className="card-mesh p-6 hover:ring-2 hover:ring-mesh transition-all group text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-forest-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-forest-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-mesh transition-colors">Repeater Setup</h3>
                <p className="text-sm text-foreground-muted">Set up a repeater node</p>
              </Link>

              <Link href="/guides/naming-standard" className="card-mesh p-6 hover:ring-2 hover:ring-mesh transition-all group text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-sunset-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-sunset-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-mesh transition-colors">Naming Standard</h3>
                <p className="text-sm text-foreground-muted">Name your node properly</p>
              </Link>
            </div>

            <div className="card-mesh p-6 md:p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Apply it in the operator tools</h3>
              <p className="text-foreground-muted text-sm mb-6">
                Once your node is online, switch from learning to doing. These tools share the same live network data as the map.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Link href="/map" className="panel p-4 group hover:-translate-y-0.5 transition-all focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Live Map</div>
                  <div className="font-semibold text-foreground group-hover:text-mesh transition-colors">See your node</div>
                  <p className="mt-1 text-xs text-foreground-muted">Confirm freshness and coverage on the live network map.</p>
                </Link>
                <Link href="/tools/companion-name" className="panel p-4 group hover:-translate-y-0.5 transition-all focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                  <div className="font-semibold text-foreground group-hover:text-mesh transition-colors">Companion name</div>
                  <p className="mt-1 text-xs text-foreground-muted">Build a personal MeshCore identity within the 23-char limit.</p>
                </Link>
                <Link href="/tools/repeater-name" className="panel p-4 group hover:-translate-y-0.5 transition-all focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                  <div className="font-semibold text-foreground group-hover:text-mesh transition-colors">Repeater name</div>
                  <p className="mt-1 text-xs text-foreground-muted">Compose a standards-aligned repeater identifier.</p>
                </Link>
                <Link href="/tools/prefix-matrix" className="panel p-4 group hover:-translate-y-0.5 transition-all focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Planning Tool</div>
                  <div className="font-semibold text-foreground group-hover:text-mesh transition-colors">Prefix matrix</div>
                  <p className="mt-1 text-xs text-foreground-muted">Pick a free public-key prefix before generating keys.</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="px-6 py-16 bg-mountain-gradient text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join the Network?</h2>
            <p className="text-mountain-100 mb-8 text-lg">
              Get your hardware, flash the firmware, and become part of Colorado&apos;s growing mesh network community.
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
              <Link href="/map" className="btn-outline border-white text-white hover:bg-white hover:text-mountain-700">
                View Live Map
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

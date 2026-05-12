import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { HeroPanel, SectionEyebrow } from "@/components/brand";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { generateHowToSchema, meshCoreSetupHowTo } from "@/lib/schemas/howto";
import { BASE_URL, COMMUNITY_NAME, DISCORD_INVITE_URL } from "@/lib/constants";

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
      url: "https://flasher.meshcore.io/",
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
      url: "https://meshcore.io/downloads.html",
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
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · Onboarding`}
          eyebrowTone="mesh"
          title={
            <>
              Get started with
              <span className="block text-mesh">MeshCore</span>
            </>
          }
          description={`Join the ${COMMUNITY_NAME} network — pick a radio, flash MeshCore, send your first message, and meet the operators behind the mesh.`}
          actions={
            <>
              <a href="#hardware" className="btn-primary">
                View hardware
              </a>
              <a href="#setup" className="btn-secondary">
                Setup guide
              </a>
              <a href="#config" className="btn-outline">
                Config tips
              </a>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Getting Started' }]} />
            </div>
          }
        />

        {/* Hardware Requirements */}
        <section id="hardware" className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-6xl">
            <SectionEyebrow tone="mesh" className="mb-3">
              Hardware requirements
            </SectionEyebrow>
            <p className="mb-8 text-foreground-muted max-w-2xl">
              MeshCore runs on LoRa devices with ESP32 or nRF52 chips. Here are our recommended
              options.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recommendedDevices.map((device) => (
                <div
                  key={device.name}
                  className={`panel p-6 ${device.recommended ? 'ring-1 ring-mesh/60' : ''}`}
                >
                  {device.recommended && (
                    <span className="inline-flex items-center gap-2 mono text-[0.65rem] uppercase tracking-[0.18em] text-mesh mb-3">
                      ◊ Recommended
                    </span>
                  )}
                  <p className="text-xl font-semibold text-foreground tracking-tight mb-2">{device.name}</p>
                  <p className="text-foreground-muted mb-3">{device.description}</p>
                  <p className="text-sm text-mountain-300 mb-4 font-mono">{device.specs}</p>
                  <a
                    href={device.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light transition-colors inline-flex items-center gap-1"
                  >
                    View product
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              ))}
            </div>

            {/* Store Links */}
            <div className="mt-10 panel-elevated p-6 sm:p-7">
              <p className="text-xl font-semibold text-foreground tracking-tight mb-4 text-center">
                Where to buy
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="https://www.seeedstudio.com/" target="_blank" rel="noopener noreferrer" className="tag-mono hover:border-mesh/50 hover:text-mesh transition-colors">
                  Seeed Studio
                </a>
                <a href="https://store.rakwireless.com/" target="_blank" rel="noopener noreferrer" className="tag-mono hover:border-mesh/50 hover:text-mesh transition-colors">
                  RAK Wireless
                </a>
                <a href="https://store.rokland.com/" target="_blank" rel="noopener noreferrer" className="tag-mono hover:border-mesh/50 hover:text-mesh transition-colors">
                  Rokland
                </a>
                <a href="https://muzi.works/" target="_blank" rel="noopener noreferrer" className="tag-mono hover:border-mesh/50 hover:text-mesh transition-colors">
                  Muzi Works
                </a>
                <a href="https://www.etsy.com/shop/PeakMesh" target="_blank" rel="noopener noreferrer" className="tag-mono hover:border-mesh/50 hover:text-mesh transition-colors">
                  PeakMesh
                </a>
              </div>
              <p className="text-center text-foreground-muted mt-5 text-sm">
                Need help choosing? Ask in the{" "}
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  {COMMUNITY_NAME} Discord
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-Step Setup Guide */}
        <section id="setup" className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionEyebrow tone="sky" className="mb-3">
              Setup guide
            </SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Three steps to first message.
            </h2>
            <p className="mt-3 text-foreground-muted max-w-2xl">
              Follow these steps to get your node up and running on the {COMMUNITY_NAME} network.
            </p>

            <div className="mt-10 space-y-4">
              {setupSteps.map((step) => (
                <div key={step.number} className="panel p-6 sm:p-7">
                  <div className="flex items-start gap-5">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-mesh/15 border border-mesh/40 flex items-center justify-center font-mono font-semibold text-mesh"
                      aria-hidden
                    >
                      {step.number.toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-foreground tracking-tight">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-foreground-muted">{step.description}</p>

                      <ul className="mt-4 space-y-2">
                        {step.tips.map((tip) => (
                          <li
                            key={tip}
                            className="flex items-start gap-2 text-sm text-foreground-muted"
                          >
                            <span aria-hidden className="text-mesh mt-0.5">◊</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>

                      {step.link && (
                        <a
                          href={step.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-accent mt-5"
                        >
                          {step.link.text}
                          <span aria-hidden>↗</span>
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
        <section id="config" className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionEyebrow tone="sunset" className="mb-3">
              Configuration tips
            </SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Front Range defaults that work.
            </h2>
            <p className="mt-3 text-foreground-muted max-w-2xl">
              Recommended settings for optimal performance across Denver and the Front Range.
            </p>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              {configTips.map((section) => (
                <div key={section.title} className="panel p-6 h-full">
                  <h3 className="text-lg font-semibold text-mesh tracking-tight mb-4">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="text-foreground-muted text-sm flex items-start gap-2"
                      >
                        <span aria-hidden className="text-mesh mt-0.5">◊</span>
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
        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <SectionEyebrow tone="mesh" className="mb-3">
              Next steps
            </SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Keep learning, then act.
            </h2>
            <p className="mt-3 text-foreground-muted max-w-2xl mb-10">
              Now that your node is running, keep learning with the related guides — then jump to
              the operator tools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              <Link
                href="/guides/radio-settings"
                className="panel p-6 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
              >
                <span aria-hidden className="text-3xl text-mesh leading-none mb-3 block">◇</span>
                <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                  Radio settings
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">View frequencies and channels.</p>
              </Link>

              <Link
                href="/guides/repeater-setup"
                className="panel p-6 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
              >
                <span aria-hidden className="text-3xl text-forest-300 leading-none mb-3 block">◉</span>
                <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                  Repeater setup
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">Set up a repeater node.</p>
              </Link>

              <Link
                href="/guides/naming-standard"
                className="panel p-6 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
              >
                <span aria-hidden className="text-3xl text-sunset-500 leading-none mb-3 block">◊</span>
                <h3 className="font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                  Naming standard
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">Name your node properly.</p>
              </Link>
            </div>

            <div className="panel-elevated p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Apply it in the operator tools</h3>
              <p className="text-foreground-muted text-sm mb-6">
                Once your node is online, switch from learning to doing. These tools share the same live network data as the map.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/map" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Live Map</div>
                  <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">See your node</h3>
                  <p className="mt-1 text-sm text-foreground-muted">Confirm freshness and coverage on the live network map.</p>
                </Link>
                <Link href="/tools/companion-name" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                  <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Companion name</h3>
                  <p className="mt-1 text-sm text-foreground-muted">Build a personal MeshCore identity within the 23-char limit.</p>
                </Link>
                <Link href="/tools/repeater-name" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                  <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Repeater name</h3>
                  <p className="mt-1 text-sm text-foreground-muted">Compose a standards-aligned repeater identifier.</p>
                </Link>
                <Link href="/tools/prefix-matrix" className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Planning Tool</div>
                  <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Prefix matrix</h3>
                  <p className="mt-1 text-sm text-foreground-muted">Pick a free public-key prefix before generating keys.</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-night-stars py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <SectionEyebrow tone="mesh" className="justify-center">
              Ready to join the network?
            </SectionEyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-snow-100 tracking-tight">
              Flash, name, deploy.
            </h2>
            <p className="mt-4 text-lg text-mountain-100 leading-relaxed">
              Get your hardware, flash the firmware, and become part of Colorado&apos;s growing mesh
              community.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Join Discord
              </a>
              <Link href="/map" className="btn-secondary">
                Live map
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

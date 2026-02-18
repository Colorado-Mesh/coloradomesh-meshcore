import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { generateFAQSchema, startPageFAQData } from "@/lib/schemas/faq";
import { generateHowToSchema, meshCoreSetupHowTo } from "@/lib/schemas/howto";

export const metadata: Metadata = {
  title: "Get Started with MeshCore",
  description: "Learn how to join the Denver mesh network. Hardware requirements, firmware setup guide, configuration instructions, and community resources.",
  keywords: ["MeshCore", "mesh network", "getting started", "Denver", "LoRa", "ESP32", "firmware", "setup guide", "tutorial", "naming standard", "node naming"],
  alternates: {
    canonical: '/start',
  },
  openGraph: {
    title: "Get Started with MeshCore | Denver MeshCore",
    description: "Learn how to join the Denver mesh network with our step-by-step setup guide.",
    url: "https://denvermc.com/start",
  },
};

// Hardware device data - from meshcore.co.uk/get.html
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

// Setup steps data
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
    description: "Connect with other Denver MeshCore members on Discord to get help, share experiences, and coordinate network improvements.",
    tips: [
      "Introduce yourself in the #introductions channel",
      "Ask questions in #support if you need help",
      "Share your node location to help map coverage",
    ],
    link: {
      text: "Join Discord",
      url: "https://discord.gg/QpaW8FTTCE",
    },
  },
];

// Radio settings for Denver area
const radioSettings = [
  { setting: "Frequency", value: "910.525 MHz" },
  { setting: "Bandwidth", value: "62.5 kHz" },
  { setting: "Spreading Factor", value: "7" },
  { setting: "Coding Rate", value: "5" },
];

// Channel hashtags for Denver mesh
const channels = [
  { topic: "#denver", key: "b24355a0d22ed2bf393ec530d75810b4" },
  { topic: "#frontrange", key: "3adcf6aa656eb14fe6eb785b2c903b36" },
  { topic: "#bot", key: "eb50a1bcb3e4e5d7bf69a57c9dada211" },
  { topic: "#emergency", key: "e1ad578d25108e344808f30dfdaaf926" },
  { topic: "#hamradio", key: "83c8b01997654265938da8765cbc7db9" },
  { topic: "#testing", key: "cde5e82cf515647dcb547a79a4f065d1" },
];

// Configuration recommendations
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
      "Join the Denver MeshCore Discord for local help",
    ],
  },
];

// Advanced topics
const advancedTopics = [
  {
    title: "Running a Repeater Node",
    icon: "📡",
    description: "Set up a dedicated repeater to extend network coverage.",
    details: [
      "Flash with Repeater firmware from the web flasher",
      "Place at high elevation with good line of sight",
      "Use a quality external antenna for better range",
      "Ensure stable power supply (wall adapter or solar preferred)",
      "Configure via USB using the web config tool",
    ],
  },
  {
    title: "Solar-Powered Nodes",
    icon: "☀️",
    description: "Build a self-sustaining node powered by solar energy.",
    details: [
      "Use a 6W+ solar panel for reliable charging",
      "Include a charge controller (TP4056 or similar)",
      "Use 18650 batteries (3000mAh+ recommended)",
      "Weatherproof enclosure (IP65+ rating)",
      "Position panel facing south for optimal charging",
    ],
  },
  {
    title: "Room Server Setup",
    icon: "💬",
    description: "Create chat rooms for group messaging on the mesh.",
    details: [
      "Flash with Room Server firmware",
      "Configure room names and settings via USB",
      "Supports multiple concurrent chat rooms",
      "Users can join rooms through the companion app",
      "Great for community or event coordination",
    ],
  },
];

// Troubleshooting items
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

// Resource links
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
    name: "\u{1F47B}CO-DENVER-RUBYHL-OB Analyzer",
    url: "https://analyzer.letsmesh.net/node/4D0CC1003DBF678DF420907F9ACD77BD71D9E4C34300F72660F6BA6A2656A868",
    description: "View the \u{1F47B}CO-DENVER-RUBYHL-OB analyzer node on LetsMesh",
  },
  {
    name: "Meadowood Analyzer",
    url: "https://analyzer.letsmesh.net/node/7BC042F4C47C3539BBEF6C2FA520A9553B0C44E8EFEF2A3D90A39BE2FE7C7F4B",
    description: "View the Meadowood analyzer node on LetsMesh",
  },
  {
    name: "Denver MeshCore Discord",
    url: "https://discord.gg/QpaW8FTTCE",
    description: "Community chat, support, and coordination",
  },
];

// Naming Standard v2.0 data
const infraNodeTypes = [
  { code: "RC", description: "Core Repeater — Backbone. Mountain/tower. Battery backup." },
  { code: "RD", description: "Distribution Rpt — Bridges core to edge. Suburban elevated." },
  { code: "RE", description: "Edge Repeater — Rooftop/residential. Mains power OK." },
  { code: "RM", description: "Mobile Repeater — Vehicle or temporary." },
  { code: "TS", description: "Room Server — Fixed location." },
  { code: "TM", description: "Mobile Room — Location changes." },
  { code: "TR", description: "Room + Repeat — Room server w/ repeat on." },
];

const infraExamples = [
  { name: "DEN-DNVR-CHSPK-RC-9F2E", description: "Core repeater, Cheesman Park" },
  { name: "DEN-DNVR-SLOAN-RE-9F2E", description: "Edge repeater, Sloan\u2019s Lake" },
  { name: "DEN-LKWD-GRNMT-RD-9F2E", description: "Dist repeater, Green Mountain" },
  { name: "DEN-REDROCKS-RC-9F2E", description: "Core repeater, Red Rocks (no city)" },
  { name: "COS-PIKESPEAK-RC-9F2E", description: "Core repeater, Pikes Peak (no city)" },
  { name: "DEN-DNVR-RINO-TS-9F2E", description: "Room server, RiNo" },
];

const regionCodes = [
  { airport: "San Luis Valley Regional Airport", code: "ALS", city: "Alamosa" },
  { airport: "Aspen/Pitkin County Airport", code: "ASE", city: "Aspen" },
  { airport: "Cortez Municipal Airport", code: "CEZ", city: "Cortez" },
  { airport: "City of Colorado Springs Municipal Airport", code: "COS", city: "Colorado Springs" },
  { airport: "Denver International Airport", code: "DEN", city: "Denver" },
  { airport: "Durango\u2013La Plata County Airport", code: "DRO", city: "Durango" },
  { airport: "Eagle County Regional Airport", code: "EGE", city: "Eagle/Vail" },
  { airport: "Northern Colorado Regional Airport", code: "FNL", city: "Fort Collins/Loveland" },
  { airport: "Grand Junction Regional Airport", code: "GJT", city: "Grand Junction" },
  { airport: "Gunnison\u2013Crested Butte Regional Airport", code: "GUC", city: "Gunnison" },
  { airport: "Yampa Valley Airport", code: "HDH", city: "Hayden" },
  { airport: "Montrose Regional Airport", code: "MTJ", city: "Montrose" },
  { airport: "Pueblo Memorial Airport", code: "PUB", city: "Pueblo" },
  { airport: "Telluride Regional Airport", code: "TEX", city: "Telluride" },
];

const cityCodes = [
  "DENVR", "AURRA", "LKWD", "ARVDA", "WSTMR", "THRTN", "CENTL", "BROOM",
  "LTTN", "ENGL", "CMRCE", "GLDN", "BOULR", "PARKR", "CSTLR", "HGHLN",
  "CSPRG", "LSVL", "LFYTE", "LVLND",
];

const landmarkExamples = [
  { code: "CHSPK", name: "Cheesman Park" },
  { code: "SLOAN", name: "Sloan\u2019s Lake" },
  { code: "WSHPK", name: "Washington Park" },
  { code: "RINO", name: "RiNo Arts District" },
  { code: "LODO", name: "Lower Downtown" },
  { code: "CPHIL", name: "Cap Hill" },
  { code: "UNION", name: "Union Station" },
  { code: "CLFAX", name: "Colfax Avenue" },
  { code: "RDRKS", name: "Red Rocks" },
  { code: "16ST", name: "16th Street Mall" },
  { code: "DIA", name: "Denver Intl Airport" },
  { code: "SR+25", name: "Speer + I-25" },
];

const landmarkSpecialChars = [
  { char: "+", usage: "Intersections or \"and\" (e.g. SR+25)" },
  { char: ".", usage: "Separator/space replacement (e.g. 16.ST)" },
  { char: "_", usage: "Separator/space replacement (e.g. 16_ST)" },
  { char: "|", usage: "Separate multiple items (e.g. 16TH|STAPLE)" },
];

const companionExamples = [
  { name: "\u{1F47B} M3SHGH\u00D8ST 01", description: "Primary carry node" },
  { name: "\u{1F47B} M3SHGH\u00D8ST 02", description: "Home base node" },
  { name: "\u{1F47B} M3SHGH\u00D8ST 03", description: "Vehicle node" },
  { name: "\u{1F43F}\uFE0F SQRLNUT 01", description: "Primary companion" },
  { name: "\u{1F525} BURNR F4", description: "Companion (key prefix suffix)" },
  { name: "\u{1F3D4}\uFE0F PKBAGGER 01", description: "Primary companion" },
];

const companionDoNots = [
  "Use your real name",
  "Put hardware in the name",
  "Use different emojis per device \u2014 one emoji per person",
  "Take someone else\u2019s emoji",
  "Go over 23 characters",
];

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://denvermc.com' },
  { name: 'Get Started', url: 'https://denvermc.com/start' },
]);

const faqData = generateFAQSchema(startPageFAQData);
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

export default function StartPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <JsonLd data={faqData} />
      <JsonLd data={howToData} />
      <div className="min-h-screen bg-mesh">
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Get Started' }]} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Get Started with <span className="text-mesh">MeshCore</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground-muted mb-8">
            Join the Denver mesh network and connect with the community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#hardware" className="btn-primary">
              View Hardware
            </a>
            <a href="#setup" className="btn-outline">
              Setup Guide
            </a>
            <a href="#naming" className="btn-outline">
              Naming Standard
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

          {/* Device Grid */}
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
              <a
                href="https://www.seeedstudio.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-mountain-500/10 hover:bg-mountain-500/20 text-mountain-500 rounded-lg transition-colors font-medium"
              >
                Seeed Studio
              </a>
              <a
                href="https://store.rakwireless.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-forest-500/10 hover:bg-forest-500/20 text-forest-500 rounded-lg transition-colors font-medium"
              >
                RAK Wireless Store
              </a>
              <a
                href="https://store.rokland.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-mountain-500/10 hover:bg-mountain-500/20 text-mountain-500 rounded-lg transition-colors font-medium"
              >
                Rokland
              </a>
              <a
                href="https://muzi.works/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-sunset-500/10 hover:bg-sunset-500/20 text-sunset-500 rounded-lg transition-colors font-medium"
              >
                Muzi Works
              </a>
              <a
                href="https://www.etsy.com/shop/PeakMesh"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-mesh/10 hover:bg-mesh/20 text-mesh rounded-lg transition-colors font-medium"
              >
                PeakMesh
              </a>
            </div>
            <p className="text-center text-foreground-muted mt-4 text-sm">
              Need help choosing? Ask in our{" "}
              <a href="https://discord.gg/QpaW8FTTCE" className="text-mesh hover:text-mesh-light">
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
            Follow these steps to get your node up and running on the Denver mesh network.
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

      {/* Radio Settings */}
      <section id="radio" className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
            Radio Settings
          </h2>
          <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
            Use these settings to connect to other nodes in our area. These settings can be found in the MeshCore app listed as <span className="text-mesh font-semibold">USA/Canada (Recommended)</span>.
          </p>

          {/* Settings Table */}
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

          <p className="text-sm text-foreground-muted text-center mb-12">
            More information about these settings can be found in the{" "}
            <a href="https://meshcore.co.uk/" target="_blank" rel="noopener noreferrer" className="text-mesh hover:text-mesh-light">
              MeshCore documentation
            </a>.
          </p>

          {/* Repeaters Section */}
          <div className="card-mesh p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📡</span>
              <h3 className="text-xl font-semibold text-foreground">Repeaters</h3>
            </div>
            <p className="text-foreground-muted mb-4">
              MeshCore works well with neighborhood repeaters. Increase the range and reliability of the Denver mesh by setting up your own repeater.
            </p>
            <a
              href="#advanced"
              className="text-mesh hover:text-mesh-light inline-flex items-center gap-2"
            >
              View Repeater Setup Guide
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Channels Section */}
          <div className="card-mesh overflow-hidden">
            <div className="p-6 border-b border-card-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">💬</span>
                <h3 className="text-xl font-semibold text-foreground">Channels</h3>
              </div>
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
        </div>
      </section>

      {/* Naming Standard */}
      <section id="naming" className="px-6 py-16 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
            Naming Standard <span className="text-base font-normal text-foreground-muted">v2.0</span>
          </h2>
          <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
            All MeshCore node names are limited to <span className="text-mesh font-semibold">23 characters</span> — this is a hard limit in the firmware. Follow the conventions below so the network stays organized and readable. Names should always be expressed in all uppercase letters, with hyphens as block separators.
          </p>

          {/* Part 1: Infrastructure Nodes */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="text-3xl">📡</span>
              Part 1: Infrastructure Nodes
            </h3>

            {/* Format Card */}
            <div className="card-mesh p-6 mb-8">
              <p className="font-mono text-lg text-mesh mb-4 text-center">
                [REGION]-[CITY]-[LANDMARK]-[TYPE]-[PUBKEY]
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground-muted">
                <div><span className="font-semibold text-foreground">REGION</span> — 3-char IATA airport code</div>
                <div><span className="font-semibold text-foreground">CITY</span> — Up to 5 chars</div>
                <div><span className="font-semibold text-foreground">LANDMARK</span> — Up to 5 chars (park, intersection, etc.)</div>
                <div><span className="font-semibold text-foreground">TYPE</span> — Node type code (2 chars)</div>
                <div><span className="font-semibold text-foreground">PUBKEY</span> — First 4 chars of public key</div>
              </div>
              <p className="text-sm text-foreground-muted mt-4">
                If the landmark is prominent enough on its own (e.g., Red Rocks), CITY can be dropped and LANDMARK gets up to 11 characters.
              </p>
            </div>

            {/* Infrastructure Examples Table */}
            <div className="card-mesh overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {infraExamples.map((ex) => (
                    <tr key={ex.name} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-mesh text-sm">{ex.name}</td>
                      <td className="px-6 py-3 text-foreground-muted text-sm">{ex.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Region Codes Table */}
            <h4 className="text-lg font-semibold text-foreground mb-3">Region Codes (IATA)</h4>
            <div className="card-mesh overflow-hidden mb-8">
              <div className="p-4 border-b border-card-border">
                <p className="text-sm text-foreground-muted">
                  The REGION block uses the 3-character IATA code of the nearest major airport. Not sure which airport is closest? Check{" "}
                  <a href="https://www.travelmath.com/nearest-airport/" target="_blank" rel="noopener noreferrer" className="text-mesh hover:text-mesh-light">
                    travelmath.com
                  </a>.
                </p>
              </div>
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">City</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground hidden md:table-cell">Airport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {regionCodes.map((r) => (
                    <tr key={r.code} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-4 py-2 font-mono font-semibold text-mountain-500">{r.code}</td>
                      <td className="px-4 py-2 text-foreground-muted text-sm">{r.city}</td>
                      <td className="px-4 py-2 text-foreground-muted text-sm hidden md:table-cell">{r.airport}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Node Type Codes Table */}
            <h4 className="text-lg font-semibold text-foreground mb-3">Node Type Codes</h4>
            <div className="card-mesh overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {infraNodeTypes.map((type) => (
                    <tr key={type.code} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono font-semibold text-mountain-500">{type.code}</td>
                      <td className="px-6 py-3 text-foreground-muted text-sm">{type.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* City Codes Grid */}
            <h4 className="text-lg font-semibold text-foreground mb-3">City Codes</h4>
            <div className="card-mesh p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {cityCodes.map((code) => (
                  <span key={code} className="font-mono text-sm text-mesh bg-night-800/30 px-3 py-1.5 rounded text-center">
                    {code}
                  </span>
                ))}
              </div>
              <p className="text-sm text-foreground-muted mt-4">
                Cities should contain between 1 and 5 alphabetic characters only. Don&apos;t see your city? Propose a code in{" "}
                <a href="https://discord.gg/QpaW8FTTCE" className="text-mesh hover:text-mesh-light">
                  our Discord
                </a>.
              </p>
            </div>

            {/* Landmark Examples Grid */}
            <h4 className="text-lg font-semibold text-foreground mb-3">Landmark Examples</h4>
            <div className="card-mesh p-6 mb-8">
              <p className="text-sm text-foreground-muted mb-4">
                Landmarks should contain between 1 and 5 characters (up to 11 if no city). Alphanumeric characters and a limited set of special characters are allowed.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                {landmarkExamples.map((lm) => (
                  <div key={lm.code} className="text-sm">
                    <span className="font-mono text-mesh">{lm.code}</span>
                    <span className="text-foreground-muted"> {lm.name}</span>
                  </div>
                ))}
              </div>
              <h5 className="text-sm font-semibold text-foreground mb-2">Allowed Special Characters</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {landmarkSpecialChars.map((sc) => (
                  <div key={sc.char} className="text-sm flex items-start gap-2">
                    <span className="font-mono text-mountain-500 font-semibold w-6 text-center">{sc.char}</span>
                    <span className="text-foreground-muted">{sc.usage}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-foreground-muted mt-3">
                Hyphens (-) are reserved for block separation. Spaces, ampersands (&amp;), slashes, and other special characters are not allowed.
              </p>
            </div>

            {/* Public Key Prefix Card */}
            <div className="card-mesh p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🔑</span>
                <h4 className="text-lg font-semibold text-foreground">Public Key Prefix</h4>
              </div>
              <p className="text-foreground-muted text-sm mb-4">
                Every node on the local mesh should have a unique 4-character code derived from the first 4 characters of the node&apos;s public key. This is used for identification and route tracing — avoid using the same prefix on multiple nodes.
              </p>
              <p className="text-foreground-muted text-sm mb-4">
                <strong className="text-foreground">Note:</strong> MeshCore currently uses the first 2 characters of the public key as the prefix (limited to 256 unique prefixes). Work is underway to expand this to 4 characters (65,536 unique prefixes). We are adopting 4 characters as the standard now for future-proofing.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://analyzer.letsmesh.net/nodes/prefix-utilization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mesh hover:text-mesh-light inline-flex items-center gap-1 text-sm"
                >
                  Check Prefix Utilization
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href="https://gessaman.com/mc-keygen/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mesh hover:text-mesh-light inline-flex items-center gap-1 text-sm"
                >
                  Key Generator
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Other Settings Card */}
            <div className="card-mesh p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">&#9881;&#65039;</span>
                <h4 className="text-lg font-semibold text-foreground">Other Settings</h4>
              </div>
              <div className="space-y-4 text-sm text-foreground-muted">
                <div>
                  <h5 className="font-semibold text-foreground mb-1">Ownership</h5>
                  <p>
                    Do not put emojis in repeater names — they eat 2+ bytes and don&apos;t render properly on all firmware. Instead, set the ownership field to <span className="font-mono text-mesh">@yourdiscordname</span> (requires firmware 1.12.0+). This info is visible to all mesh users.
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-foreground mb-1">Region Setting</h5>
                  <p>
                    Set your repeater&apos;s region setting to match its IATA airport code (e.g., <span className="font-mono text-mesh">DEN</span> for Denver area repeaters).
                  </p>
                </div>
              </div>
            </div>

            {/* Changes from v1.1 Card */}
            <div className="card-mesh overflow-hidden">
              <div className="p-6 bg-mountain-500/10 border-b border-card-border">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-3">
                  <span className="text-xl">&#128196;</span>
                  Changes from v1.1
                </h4>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-sm text-foreground-muted">
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span><span className="font-mono">CO-</span> state prefix replaced with IATA airport code (<span className="font-mono text-mesh">DEN</span>, <span className="font-mono text-mesh">COS</span>, <span className="font-mono text-mesh">FNL</span>, etc.)</span></li>
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span>Counter (##) replaced with 4-char public key prefix</span></li>
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span>Room Server type <span className="font-mono">T</span> changed to <span className="font-mono text-mesh">TS</span> (all types now 2 chars)</span></li>
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span>Emojis removed from repeater names</span></li>
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span>Ownership tracked via ownership field (@discord), not emoji</span></li>
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span>City field reduced from 7 to 5 characters</span></li>
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span>Landmark field reduced from 7 to 5 characters</span></li>
                  <li className="flex items-start gap-2"><span className="text-mountain-500 mt-0.5">&#8594;</span><span>IATA code also used for repeater region settings</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Part 2: Companion Nodes */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="text-3xl">📱</span>
              Part 2: Companion Nodes
            </h3>

            {/* Format Card */}
            <div className="card-mesh p-6 mb-8">
              <p className="font-mono text-lg text-mesh mb-4 text-center">
                [EMOJI] [HANDLE] [##]
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-foreground-muted">
                <div><span className="font-semibold text-foreground">EMOJI</span> — Your personal emoji (one per person)</div>
                <div><span className="font-semibold text-foreground">HANDLE</span> — Your unique handle/callsign</div>
                <div><span className="font-semibold text-foreground">##</span> — Number by purpose, not hardware</div>
              </div>
              <p className="text-sm text-foreground-muted mt-4">
                Number by purpose (01 = primary carry, 02 = home base, 03 = vehicle), not by hardware model. If you upgrade your radio, the name stays the same.
              </p>
            </div>

            {/* Companion Examples Table */}
            <div className="card-mesh overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-night-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {companionExamples.map((ex) => (
                    <tr key={ex.name} className="hover:bg-night-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-mesh text-sm">{ex.name}</td>
                      <td className="px-6 py-3 text-foreground-muted text-sm">{ex.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Do Not Rules */}
            <div className="card-mesh overflow-hidden mb-8">
              <div className="p-6 bg-sunset-500/10 border-b border-card-border">
                <h4 className="text-lg font-semibold text-sunset-700 flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  Do Not
                </h4>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {companionDoNots.map((rule, index) => (
                    <li key={index} className="text-foreground-muted flex items-start gap-2">
                      <span className="text-sunset-500 mt-1">✕</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Community Tracking Card */}
            <div className="card-mesh p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📋</span>
                <h4 className="text-lg font-semibold text-foreground">Community Tracking</h4>
              </div>
              <p className="text-foreground-muted text-sm">
                Before deploying a new node, check the shared community list to avoid duplicate names and emoji conflicts. Post your new node in{" "}
                <a href="https://discord.gg/QpaW8FTTCE" className="text-mesh hover:text-mesh-light">
                  our Discord
                </a>{" "}
                so others can update their records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Topics */}
      <section id="advanced" className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
            Advanced Topics
          </h2>
          <p className="text-foreground-muted text-center mb-12 max-w-2xl mx-auto">
            Ready to take your mesh networking to the next level? Explore these advanced configurations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advancedTopics.map((topic, idx) => (
              <div
                key={topic.title}
                className={`card-mesh p-6 ${idx === advancedTopics.length - 1 && advancedTopics.length % 2 === 1 ? 'md:col-span-2 md:max-w-xl md:mx-auto' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{topic.icon}</span>
                  <h3 className="text-xl font-semibold text-foreground">{topic.title}</h3>
                </div>
                <p className="text-foreground-muted mb-4">{topic.description}</p>
                <ul className="space-y-2 mb-4">
                  {topic.details.map((detail, index) => (
                    <li key={index} className="text-foreground-muted text-sm flex items-start gap-2">
                      <span className="text-forest-500 mt-0.5">→</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting" className="px-6 py-16 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
            Troubleshooting
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
              href="https://discord.gg/QpaW8FTTCE"
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

      {/* Resources */}
      <section id="resources" className="px-6 py-16">
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

      {/* Call to Action */}
      <section className="px-6 py-16 bg-mountain-gradient text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join the Network?</h2>
          <p className="text-mountain-100 mb-8 text-lg">
            Get your hardware, flash the firmware, and become part of Colorado&apos;s growing mesh network community.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://discord.gg/QpaW8FTTCE"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent"
            >
              Join Our Discord
            </a>
            <Link href="/observer" className="btn-outline border-white text-white hover:bg-white hover:text-mountain-700">
              View Network Status
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { HeroPanel, SectionEyebrow, ToolCard } from "@/components/brand";
import { BASE_URL, COMMUNITY_NAME, SITE_NAME } from "@/lib/constants";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";

const PAGE_TITLE = "Guides";
const PAGE_DESCRIPTION = `Teaching and reference content for ${SITE_NAME}. Read the guides to learn the network, then jump to the operator tools when you are ready to act.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "MeshCore",
    "guides",
    "Colorado",
    "Denver",
    "Front Range",
    "mesh network",
    "LoRa",
    "setup",
    "repeater",
    "troubleshooting",
  ],
  alternates: {
    canonical: '/guides',
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description:
      "Guides for getting started, radio settings, repeater setup, naming standards, and troubleshooting on the Colorado MeshCore mesh network.",
    url: `${BASE_URL}/guides`,
  },
};

interface GuideEntry {
  title: string;
  tag: string;
  description: string;
  href: string;
  tone: 'mesh' | 'sky' | 'sunset' | 'forest';
  glyph: string;
}

const guides: readonly GuideEntry[] = [
  {
    title: "Getting started",
    tag: "ONBOARDING",
    description:
      "Learn how to choose hardware, flash MeshCore firmware, and pair your first node. Read this before opening the operator tools.",
    href: "/guides/getting-started",
    tone: 'mesh',
    glyph: '◈',
  },
  {
    title: "Radio settings & channels",
    tag: "REFERENCE",
    description:
      "Front Range radio preset, channel keys, and the canonical CLI commands every Colorado MeshCore node should match.",
    href: "/guides/radio-settings",
    tone: 'sky',
    glyph: '◇',
  },
  {
    title: "Repeater setup",
    tag: "DEEP DIVE",
    description:
      "TX/RX delay profiles, common settings, and a USB serial preflight for tuning a repeater before it goes online.",
    href: "/guides/repeater-setup",
    tone: 'forest',
    glyph: '◉',
  },
  {
    title: "Naming standard",
    tag: "STANDARD",
    description:
      "How Colorado MeshCore names repeaters, room servers, and companion nodes — the standard the naming tools follow.",
    href: "/guides/naming-standard",
    tone: 'sunset',
    glyph: '◊',
  },
  {
    title: "Troubleshooting",
    tag: "SUPPORT",
    description:
      "Common flashing, BLE, GPS, and range issues with concrete fixes and links to the field-support tools.",
    href: "/guides/troubleshooting",
    tone: 'sunset',
    glyph: '◌',
  },
] as const;

interface ToolHandoff {
  href: string;
  tag: string;
  title: string;
  description: string;
  tone: 'mesh' | 'sky' | 'sunset' | 'forest';
  glyph: string;
}

const toolHandoffs: readonly ToolHandoff[] = [
  {
    href: '/tools/repeater-name',
    tag: 'NAMING TOOL',
    title: 'Repeater name wizard',
    description:
      'Apply the naming standard with live conflict checks against the network map.',
    tone: 'mesh',
    glyph: '◈',
  },
  {
    href: '/tools/companion-name',
    tag: 'NAMING TOOL',
    title: 'Companion name builder',
    description:
      'Compose a companion identity that fits MeshCore’s 23-character limit.',
    tone: 'sky',
    glyph: '◇',
  },
  {
    href: '/tools/prefix-matrix',
    tag: 'PLANNING TOOL',
    title: 'Public-key prefix matrix',
    description:
      'Pick a free first-byte prefix before generating a new key pair.',
    tone: 'sunset',
    glyph: '◊',
  },
  {
    href: '/tools/serial-usb',
    tag: 'FIELD TOOL',
    title: 'Serial USB console',
    description:
      'Run preflight commands and apply settings over USB straight from the browser.',
    tone: 'forest',
    glyph: '◉',
  },
] as const;

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Guides', url: `${BASE_URL}/guides` },
]);

export default function GuidesPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains={false}
          eyebrow="Learning & Reference"
          title={
            <>
              {COMMUNITY_NAME}
              <span className="block text-mesh">guides</span>
            </>
          }
          description={PAGE_DESCRIPTION}
          actions={
            <>
              <Link href="/guides/getting-started" className="btn-primary">
                Start with onboarding
              </Link>
              <Link href="/guides/repeater-setup" className="btn-secondary">
                Repeater setup
              </Link>
              <Link href="/tools" className="btn-outline">
                Tools
              </Link>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides' }]} />
            </div>
          }
        />

        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="mesh" className="mb-3">
              Read the guides
            </SectionEyebrow>
            <p className="mb-6 text-sm text-foreground-muted max-w-2xl">
              Teaching and reference pages — onboarding, radio configuration, repeater tuning,
              naming, and troubleshooting. Use them to build the mental model the tools assume.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <ToolCard
                  key={guide.href}
                  tone={guide.tone}
                  glyph={guide.glyph}
                  tag={guide.tag}
                  title={guide.title}
                  description={guide.description}
                  href={guide.href}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="panel-elevated p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                  <SectionEyebrow tone="sunset">Ready to act?</SectionEyebrow>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                    Hand off to the operator tools.
                  </h2>
                  <p className="mt-2 text-sm text-foreground-muted max-w-2xl">
                    Once the guide makes sense, switch to{' '}
                    <Link
                      href="/tools"
                      className="text-mesh hover:text-mesh-light underline underline-offset-2"
                    >
                      /tools
                    </Link>{' '}
                    to apply it. Each tool consumes the same live network data as the{' '}
                    <Link
                      href="/map"
                      className="text-mesh hover:text-mesh-light underline underline-offset-2"
                    >
                      Live Map
                    </Link>
                    .
                  </p>
                </div>
                <Link
                  href="/tools"
                  className="text-sm mono uppercase tracking-[0.18em] text-mesh hover:text-mesh-light"
                >
                  view all tools →
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {toolHandoffs.map((tool) => (
                  <ToolCard
                    key={tool.href}
                    tone={tool.tone}
                    glyph={tool.glyph}
                    tag={tool.tag}
                    title={tool.title}
                    description={tool.description}
                    href={tool.href}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

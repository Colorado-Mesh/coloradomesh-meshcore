import type { Metadata } from 'next';
import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { HeroPanel, SectionEyebrow, ToolCard } from '@/components/brand';
import {
  ANALYZER_URL,
  BASE_URL,
  COMMUNITY_NAME,
  DISCORD_INVITE_URL,
  SITE_NAME,
} from '@/lib/constants';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';

const PAGE_TITLE = 'Operator Tools';
const PAGE_DESCRIPTION = `Naming, prefix planning, and field utilities for ${SITE_NAME} operators. Plan names, find a free public-key prefix, and talk to a node over USB serial directly from the browser.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/tools',
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/tools`,
    siteName: SITE_NAME,
  },
  twitter: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: PAGE_TITLE, url: `${BASE_URL}/tools` },
]);

const guideHandoffs = [
  {
    href: '/guides/naming-standard',
    label: 'Naming standard',
    description: 'Reference guide behind the repeater and companion name builders.',
  },
  {
    href: '/guides/repeater-setup',
    label: 'Repeater setup',
    description: 'Profiles, TX/RX delays, and serial preflight before deploying a repeater.',
  },
  {
    href: '/guides/radio-settings',
    label: 'Radio settings',
    description: 'Frequencies, presets, and channels used by every Front Range node.',
  },
] as const;

export default function ToolsPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />

      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains={false}
          eyebrow="Operator Console"
          title={
            <>
              {COMMUNITY_NAME}
              <span className="block text-mesh">operator tools</span>
            </>
          }
          description={PAGE_DESCRIPTION}
          actions={
            <>
              <Link href="/tools/repeater-name" className="btn-primary">
                Name a repeater
              </Link>
              <Link href="/tools/prefix-matrix" className="btn-secondary">
                Check a prefix
              </Link>
              <Link href="/tools/serial-usb" className="btn-outline">
                Serial console
              </Link>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs
                items={[{ label: 'Home', href: '/' }, { label: PAGE_TITLE }]}
              />
            </div>
          }
        />

        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="mesh" className="mb-3">
              Naming &amp; Identity
            </SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Name your nodes.
            </h2>
            <p className="mt-3 mb-6 text-sm text-foreground-muted max-w-2xl">
              Compose standards-aligned identifiers for repeaters and companion devices that fit
              MeshCore&apos;s 23-character limit and the {COMMUNITY_NAME} naming convention.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <ToolCard
                tone="mesh"
                glyph="◈"
                tag="REPEATER NAMING"
                title="Repeater name wizard"
                description="Build a standards-aligned repeater name from region, city, landmark, and node type. Includes live conflict checks against the live network map."
                href="/tools/repeater-name"
                headingLevel="h3"
              />
              <ToolCard
                tone="sky"
                glyph="◇"
                tag="COMPANION NAMING"
                title="Companion name builder"
                description="Compose your personal companion identity with emoji, handle, and an identification suffix. Stays under the 23-character MeshCore limit."
                href="/tools/companion-name"
                headingLevel="h3"
              />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="sunset" className="mb-3">
              Network Planning
            </SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Plan keys and coverage.
            </h2>
            <p className="mt-3 mb-6 text-sm text-foreground-muted max-w-2xl">
              Coordinate keys and coverage before you flash a new node. Inspect occupied address
              space and pair planning with the{' '}
              <Link
                href="/map"
                className="text-mesh hover:text-mesh-light underline underline-offset-2"
              >
                Live Map
              </Link>
              .
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ToolCard
                tone="sunset"
                glyph="◊"
                tag="PREFIX PLANNING"
                title="Public-key prefix matrix"
                description={`Visualize the 256-cell first-byte prefix space across ${COMMUNITY_NAME}. Find free prefixes before generating a new key.`}
                href="/tools/prefix-matrix"
                headingLevel="h3"
              />
              <ToolCard
                tone="sky"
                glyph="◎"
                tag="LIVE COVERAGE"
                title="Live Map"
                description="See current node freshness, coverage, and conflicts before you generate keys or pick a site. Prefix planning consumes the same snapshot."
                href="/map"
                headingLevel="h3"
              />
              <ToolCard
                tone="mesh"
                glyph="◉"
                tag="EXTERNAL · TELEMETRY"
                title="Network analyzer"
                description={`External dashboard for per-node link quality, neighbors, and routing across ${COMMUNITY_NAME} — useful for deeper operator telemetry.`}
                href={ANALYZER_URL}
                external
                headingLevel="h3"
              />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="sky" className="mb-3">
              Field &amp; USB Operations
            </SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Bench and field tools.
            </h2>
            <p className="mt-3 mb-6 text-sm text-foreground-muted max-w-2xl">
              Browser-side serial tooling for bench installs and field service. Pairs with the{' '}
              <Link
                href="/guides/repeater-setup"
                className="text-mesh hover:text-mesh-light underline underline-offset-2"
              >
                repeater setup guide
              </Link>{' '}
              for the standard preflight command set.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <ToolCard
                tone="forest"
                glyph="◉"
                tag="USB SERIAL"
                title="Serial USB console"
                description="Talk to a connected MeshCore node over USB directly from the browser. Manual send, canned commands, and a live terminal log."
                href="/tools/serial-usb"
                headingLevel="h3"
              />
              <ToolCard
                tone="forest"
                glyph="◌"
                tag="FIELD SUPPORT"
                title="Troubleshooting reference"
                description="Common flashing, BLE, GPS, and range issues operators see in the field — and how to recover before reaching for Discord."
                href="/guides/troubleshooting"
                headingLevel="h3"
              />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="mesh" className="mb-3">
              Need the reference?
            </SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Hand off to the guides.
            </h2>
            <p className="mt-3 mb-6 text-sm text-foreground-muted max-w-2xl">
              Tools do — guides teach. Jump to the matching reference page when you want the
              theory or the manual workflow behind any tool.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {guideHandoffs.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="panel p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring"
                >
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">
                    Guide
                  </div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                    {guide.label}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {guide.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-mesh group-hover:text-mesh-light">
                    Read guide
                    <span aria-hidden>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="panel p-6 sm:p-8 text-sm text-foreground-muted leading-relaxed">
              <SectionEyebrow tone="sky" className="mb-3">
                Coming from somewhere else?
              </SectionEyebrow>
              <p>
                These tools live inside the {SITE_NAME} site so they share the
                same live data as the{' '}
                <Link
                  href="/map"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  network map
                </Link>
                . Suggest more utilities or report issues in the{' '}
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
      </div>
    </>
  );
}

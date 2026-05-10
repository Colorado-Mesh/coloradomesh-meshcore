import type { Metadata } from 'next';
import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { NetworkMapWrapper } from '@/components';
import { HeroPanel, NetworkPanel, SectionEyebrow, ToolCard } from '@/components';
import {
  ANALYZER_URL,
  BASE_URL,
  COMMUNITY_NAME,
  DISCORD_INVITE_URL,
  SITE_NAME,
} from '@/lib/constants';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import { generateWebApplicationSchema } from '@/lib/schemas/webapp';

const PAGE_TITLE = 'Network Map';
const PAGE_DESCRIPTION = `Live operations map of ${SITE_NAME} nodes, repeaters, and gateways across Colorado. Track coverage, freshness, and node health from one ${COMMUNITY_NAME} console.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'mesh network',
    'map',
    'Colorado',
    'Colorado Mesh',
    'Colorado MeshCore',
    'MeshCore',
    'LoRa',
    'node locations',
    'coverage',
    'Front Range',
  ],
  alternates: {
    canonical: '/map',
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/map`,
    siteName: SITE_NAME,
  },
  twitter: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: PAGE_TITLE, url: `${BASE_URL}/map` },
]);

const LIVE_MAP_UPSTREAM_URL = 'https://github.com/yellowcooln/meshcore-mqtt-live-map';
const COLORADO_MESH_SOURCE_URL = 'https://github.com/Colorado-Mesh/coloradomesh-meshcore';
const GPL_LICENSE_URL = 'https://www.gnu.org/licenses/gpl-3.0.html';

const webAppData = generateWebApplicationSchema({
  name: `${SITE_NAME} Network Map`,
  description: PAGE_DESCRIPTION,
  url: `${BASE_URL}/map`,
  license: GPL_LICENSE_URL,
  isBasedOn: {
    name: 'meshcore-mqtt-live-map',
    url: LIVE_MAP_UPSTREAM_URL,
    license: GPL_LICENSE_URL,
  },
});

export default function MapPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <JsonLd data={webAppData} />

      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow="Live Operations · Map"
          title={
            <>
              {COMMUNITY_NAME}
              <span className="block text-mesh">network map</span>
            </>
          }
          description={`Operator-grade view of ${SITE_NAME} repeaters, gateways, and field nodes across the Front Range and beyond. Markers reflect each node's last-heard status and exact reported coordinates.`}
          actions={
            <>
              <Link href="/start" className="btn-primary">
                Get Started
              </Link>
              <Link href="/guides/getting-started" className="btn-secondary">
                Getting started guide
              </Link>
              <Link href="/tools" className="btn-secondary">
                Operator tools
              </Link>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Join Discord
              </a>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <Breadcrumbs
                  items={[{ label: 'Home', href: '/' }, { label: PAGE_TITLE }]}
                />
                <span className="text-foreground-dim mono uppercase tracking-[0.18em]">
                  /api/map/snapshot · /api/map/runtime · /api/live-map/*
                </span>
              </div>
            </div>
          }
        />

        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-7xl">
            <NetworkMapWrapper
              className="shadow-xl"
              height={620}
            />

            <p className="mt-3 text-xs text-foreground-dim mono uppercase tracking-[0.18em]">
              ◊ Markers render at exact reported coordinates · Operators publishing
              to {COMMUNITY_NAME} accept that their location is shared publicly.
            </p>

            <aside
              className="mt-4 panel px-5 py-4 text-xs text-foreground-muted"
              aria-label="Live map source attribution"
            >
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                <span className="tag-mono shrink-0">GPL · Source</span>
                <p className="leading-relaxed">
                  This live-map experience derives from{' '}
                  <a
                    href={LIVE_MAP_UPSTREAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light underline underline-offset-2"
                  >
                    yellowcooln/meshcore-mqtt-live-map
                  </a>
                  , licensed under the{' '}
                  <a
                    href={GPL_LICENSE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light underline underline-offset-2"
                  >
                    GNU GPL v3.0
                  </a>
                  . {COMMUNITY_NAME} fork and changes are published at{' '}
                  <a
                    href={COLORADO_MESH_SOURCE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light underline underline-offset-2"
                  >
                    Colorado-Mesh/coloradomesh-meshcore
                  </a>{' '}
                  to satisfy GPL source-availability obligations.
                </p>
              </div>
            </aside>

            <aside
              className="mt-3 panel-mesh px-5 py-4 text-xs text-foreground-muted"
              aria-label="Network analyzer"
            >
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                <span className="tag-mono shrink-0">Analyzer</span>
                <p className="leading-relaxed">
                  Drill into routing, link quality, and per-node telemetry on
                  the {COMMUNITY_NAME} analyzer at{' '}
                  <a
                    href={ANALYZER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light underline underline-offset-2"
                  >
                    analyzer.meshcore.coloradomesh.org
                  </a>
                  . Use it when you need deeper per-node link quality,
                  neighbors, and routing detail.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-2">
            <NetworkPanel
              eyebrow="Read the markers"
              title="Roles & status colors"
              headingLevel="h2"
            >
              <div className="space-y-4 text-sm text-foreground-muted">
                <p>
                  Marker color encodes the node&rsquo;s role &mdash; gateways, repeaters,
                  routers, room servers, companions, and field nodes &mdash; while the ring
                  and pulse encode liveness. Online nodes pulse, stale nodes ring amber,
                  offline nodes fade out.
                </p>
                <p>
                  Click a marker for the full readout: name, role, public-key prefix,
                  last-heard timestamp, firmware/model, battery, radio config and signal,
                  plus route or neighbors when {SITE_NAME} reports them.
                </p>
                <p className="text-xs text-foreground-dim">
                  Coverage rings, route streaming, and historical playback are tracked on
                  the {COMMUNITY_NAME} roadmap.
                </p>
              </div>
            </NetworkPanel>

            <NetworkPanel
              eyebrow="Add your node"
              title="Put your radio on the map"
              headingLevel="h2"
            >
              <div className="space-y-4 text-sm text-foreground-muted">
                <p>
                  Want your repeater, gateway, or companion on the {SITE_NAME} map?
                  Bring it online with the standard {COMMUNITY_NAME} configuration and
                  it will appear here once it is heard on the network.
                </p>
                <ul className="list-disc pl-5 space-y-1 marker:text-mesh">
                  <li>
                    Walk through the{' '}
                    <Link
                      href="/guides/getting-started"
                      className="text-mesh hover:text-mesh-light underline underline-offset-2"
                    >
                      Getting Started guide
                    </Link>{' '}
                    for first-radio setup.
                  </li>
                  <li>
                    Use{' '}
                    <Link
                      href="/start"
                      className="text-mesh hover:text-mesh-light underline underline-offset-2"
                    >
                      Get Started
                    </Link>{' '}
                    if you already own MeshCore-capable hardware.
                  </li>
                  <li>
                    Coordinate placement and power with operators on{' '}
                    <a
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mesh hover:text-mesh-light underline underline-offset-2"
                    >
                      Discord
                    </a>
                    .
                  </li>
                </ul>
              </div>
            </NetworkPanel>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="sky" className="mb-4">
              Operator next steps
            </SectionEyebrow>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <ToolCard
                tone="mesh"
                glyph="◈"
                tag="GUIDES"
                title="Getting Started"
                description="Pick a radio, flash MeshCore, name your node, and join the Front Range mesh."
                href="/guides/getting-started"
                headingLevel="h2"
              />
              <ToolCard
                tone="sky"
                glyph="◎"
                tag="ANALYZER"
                title="Network analyzer"
                description="Drill into per-node telemetry, link quality, and routing on the Colorado Mesh analyzer."
                href={ANALYZER_URL}
                external
                headingLevel="h2"
              />
              <ToolCard
                tone="sunset"
                glyph="◇"
                tag="OPERATORS"
                title="Operator tools"
                description="Naming wizard, prefix matrix, and other operator utilities for the Colorado mesh."
                href="/tools"
                headingLevel="h2"
              />
              <ToolCard
                tone="forest"
                glyph="◆"
                tag="COMMUNITY"
                title="Join Discord"
                description="Coordinate placements, troubleshoot links, and meet other Colorado MeshCore operators."
                href={DISCORD_INVITE_URL}
                external
                headingLevel="h2"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

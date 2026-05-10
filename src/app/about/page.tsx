import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { HeroPanel, NetworkPanel, SectionEyebrow, ToolCard } from '@/components/brand';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import {
  ANALYZER_URL,
  BASE_URL,
  COMMUNITY_NAME,
  DISCORD_INVITE_URL,
  GITHUB_ORG_URL,
  LETSMESH_URL,
  MESHCORE_DOCS_URL,
  SITE_NAME,
} from '@/lib/constants';

const PAGE_TITLE = 'About';
const PAGE_DESCRIPTION = `Learn about MeshCore technology and the ${SITE_NAME} community. MeshCore is an open-source mesh networking firmware using LoRa radios for decentralized, off-grid communication across Colorado's Front Range and beyond.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: `${PAGE_TITLE} ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/about`,
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'About', url: `${BASE_URL}/about` },
]);

const radioStats = [
  { value: '10+ mi', label: 'Range per node', tone: 'text-mesh' },
  { value: '915 MHz', label: 'LoRa frequency', tone: 'text-mountain-300' },
  { value: 'Low Power', label: 'Solar compatible', tone: 'text-forest-300' },
  { value: 'Open', label: 'Open source', tone: 'text-sunset-500' },
] as const;

const meshFundamentals = [
  {
    glyph: '◇',
    tone: 'mesh' as const,
    title: 'Direct communication',
    description:
      'Nodes talk peer-to-peer over LoRa radio. No internet, cell tower, or carrier required.',
  },
  {
    glyph: '◉',
    tone: 'sky' as const,
    title: 'Dedicated repeaters',
    description:
      'Solar-friendly repeaters on rooftops and ridgelines relay messages efficiently across the metro.',
  },
  {
    glyph: '◊',
    tone: 'sunset' as const,
    title: 'Resilient by design',
    description:
      'No single point of failure. The mesh routes around drops automatically as nodes come and go.',
  },
] as const;

const involvement = [
  {
    glyph: '◈',
    tone: 'mesh' as const,
    tag: 'COMMUNITY',
    title: 'Join the Discord',
    description:
      'Coordinate with operators, ask first-radio questions, and stay current on network changes.',
    href: DISCORD_INVITE_URL,
    external: true,
  },
  {
    glyph: '◉',
    tone: 'forest' as const,
    tag: 'OPERATE',
    title: 'Set up a node',
    description:
      'Add your own companion or repeater to the mesh — every new node strengthens coverage.',
    href: '/start',
    external: false,
  },
  {
    glyph: '◊',
    tone: 'sunset' as const,
    tag: 'CONTRIBUTE',
    title: 'Build the platform',
    description:
      'Site, infrastructure, and tooling are all open source. PRs and field reports welcome.',
    href: GITHUB_ORG_URL,
    external: true,
  },
  {
    glyph: '◇',
    tone: 'sky' as const,
    tag: 'TEACH',
    title: 'Help newcomers',
    description:
      'Share what you have learned, mentor a first-time operator, or write up a setup story.',
    href: DISCORD_INVITE_URL,
    external: true,
  },
] as const;

const valuePillars = [
  {
    eyebrow: 'Mission',
    eyebrowTone: 'mesh' as const,
    title: 'Build the resilient mesh',
    body: 'Maintain a community-owned LoRa mesh that provides free, open communication infrastructure for everyone on the Front Range.',
  },
  {
    eyebrow: 'Values',
    eyebrowTone: 'sky' as const,
    title: 'Open by default',
    body: 'Open source, community-driven, accessible to all. Communication infrastructure should be a public good — never a paywall.',
  },
  {
    eyebrow: 'Goal',
    eyebrowTone: 'sunset' as const,
    title: 'Plains to peaks',
    body: 'Seamless coverage from the Denver metro into the high country, so a hiker on a 14er and a neighbor in a basement can always reach the network.',
  },
] as const;

const externalResources = [
  {
    glyph: '◎',
    tone: 'sky' as const,
    tag: 'LIVE TELEMETRY',
    title: 'Network analyzer',
    description: `Drill into per-node link quality, neighbors, and routing on the ${COMMUNITY_NAME} analyzer.`,
    href: ANALYZER_URL,
    external: true,
  },
  {
    glyph: '◊',
    tone: 'mesh' as const,
    tag: 'COVERAGE',
    title: 'Live network map',
    description: 'Real-time map of operator-run nodes across Colorado with live position and link data.',
    href: '/map',
    external: false,
  },
  {
    glyph: '◇',
    tone: 'sunset' as const,
    tag: 'GLOBAL',
    title: 'LetsMesh',
    description: 'The worldwide MeshCore community map and analyzer platform.',
    href: LETSMESH_URL,
    external: true,
  },
  {
    glyph: '◉',
    tone: 'forest' as const,
    tag: 'DOCS',
    title: 'MeshCore docs',
    description: 'Official MeshCore project documentation, firmware downloads, and reference material.',
    href: MESHCORE_DOCS_URL,
    external: true,
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · About`}
          eyebrowTone="mesh"
          title={
            <>
              About
              <span className="block text-mesh">{COMMUNITY_NAME}</span>
            </>
          }
          description={`${SITE_NAME} is a volunteer-run effort to keep a decentralized LoRa mesh online across Colorado. We deploy infrastructure, document setup paths, and share the same live data operators rely on in the field.`}
          actions={
            <>
              <Link href="/start" className="btn-primary">
                Get on the mesh
              </Link>
              <Link href="/map" className="btn-secondary">
                Live Map
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
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
            </div>
          }
        />

        {/* What is MeshCore */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
            <NetworkPanel
              eyebrow="What is MeshCore?"
              eyebrowTone="mesh"
              title="Open LoRa mesh, no internet required"
              tone="elevated"
              padding="lg"
              headingLevel="h2"
            >
              <div className="space-y-4 text-foreground-muted leading-relaxed">
                <p>
                  MeshCore is an open-source mesh networking firmware with dedicated infrastructure
                  roles. Unlike simple flood-routing protocols, MeshCore uses repeaters and room
                  servers to intelligently route messages across the network.
                </p>
                <p>
                  Using LoRa (Long Range) radio technology, nodes communicate over many miles —
                  even in challenging terrain like Colorado&apos;s mountains. Strategically placed
                  repeaters extend coverage while companion devices connect to your phone over
                  Bluetooth.
                </p>
                <p>
                  Whether you&apos;re hiking the backcountry, preparing for emergencies, or
                  curious about decentralized infrastructure, MeshCore provides a resilient
                  communication backbone owned by its community.
                </p>
              </div>
            </NetworkPanel>

            <div className="grid grid-cols-2 gap-4">
              {radioStats.map((stat) => (
                <div key={stat.label} className="panel p-5 text-center">
                  <div className={`text-2xl sm:text-3xl font-semibold mono tracking-tight mb-1 ${stat.tone}`}>
                    {stat.value}
                  </div>
                  <div className="metric-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How mesh networking works */}
        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="sky" className="justify-center">
                How it works
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Three ideas behind the mesh.
              </h2>
              <p className="mt-3 text-foreground-muted max-w-2xl mx-auto">
                MeshCore separates roles so each node only does what it&apos;s good at — companions stay
                quiet, repeaters route, and the mesh stays resilient.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {meshFundamentals.map((item) => (
                <NetworkPanel
                  key={item.title}
                  title={item.title}
                  headingLevel="h3"
                  padding="md"
                  className="h-full"
                >
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="text-3xl text-mesh leading-none">
                      {item.glyph}
                    </span>
                    <p className="text-sm text-foreground-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </NetworkPanel>
              ))}
            </div>
          </div>
        </section>

        {/* Mission / Values / Goal */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="mesh" className="justify-center">
                The {COMMUNITY_NAME} community
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                A grassroots Front Range network.
              </h2>
              <p className="mt-3 text-foreground-muted max-w-3xl mx-auto leading-relaxed">
                {COMMUNITY_NAME} is a grassroots community of radio enthusiasts, technology
                advocates, and emergency-preparedness minded operators building a resilient
                communication network across Colorado — from Fort Collins to Colorado Springs and
                into the high country.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {valuePillars.map((pillar) => (
                <NetworkPanel
                  key={pillar.title}
                  eyebrow={pillar.eyebrow}
                  eyebrowTone={pillar.eyebrowTone}
                  title={pillar.title}
                  padding="md"
                  className="h-full"
                  headingLevel="h3"
                >
                  <p className="text-sm text-foreground-muted leading-relaxed">
                    {pillar.body}
                  </p>
                </NetworkPanel>
              ))}
            </div>
          </div>
        </section>

        {/* Get involved */}
        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
              <div>
                <SectionEyebrow tone="sunset">Get involved</SectionEyebrow>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                  Four ways into the project.
                </h2>
                <p className="mt-3 text-foreground-muted max-w-2xl">
                  Operators, builders, teachers, and lurkers welcome. Pick a doorway and meet the
                  community on the other side.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {involvement.map((item) => (
                <ToolCard
                  key={item.title}
                  tone={item.tone}
                  glyph={item.glyph}
                  tag={item.tag}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                  external={item.external}
                  headingLevel="h3"
                />
              ))}
            </div>

            <div className="mt-10 panel p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="tag-mono">100% open source</span>
                <span className="tag-mono">Community owned</span>
                <span className="tag-mono">Contributors welcome</span>
              </div>
              <p className="text-sm text-foreground-muted max-w-md">
                No corporations, no subscriptions, no data harvesting — just neighbors building
                the mesh together.
              </p>
            </div>
          </div>
        </section>

        {/* Resources & links */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
              <div>
                <SectionEyebrow tone="sky">Resources &amp; links</SectionEyebrow>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                  Telemetry, docs, and the wider community.
                </h2>
                <p className="mt-3 text-foreground-muted max-w-2xl">
                  Live operator tooling lives on this site; deeper telemetry and global community
                  resources live alongside.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {externalResources.map((item) => (
                <ToolCard
                  key={item.title}
                  tone={item.tone}
                  glyph={item.glyph}
                  tag={item.tag}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                  external={item.external}
                  headingLevel="h3"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-night-stars py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <SectionEyebrow tone="mesh" className="justify-center">
              Ready to join?
            </SectionEyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-snow-100 tracking-tight">
              Operate the network with us.
            </h2>
            <p className="mt-4 text-lg text-mountain-100 leading-relaxed">
              Whether you&apos;re a radio enthusiast, a developer, or someone who simply believes
              in community-owned infrastructure — there&apos;s a place for you in {COMMUNITY_NAME}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/start" className="btn-primary">
                Get Started
              </Link>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Join Discord
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

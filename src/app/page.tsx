import Link from 'next/link';
import { StatsSection } from '@/components';
import JsonLd from '@/components/JsonLd';
import { HeroPanel, NetworkPanel, SectionEyebrow, ToolCard } from '@/components/brand';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import {
  BASE_URL,
  COMMUNITY_NAME,
  DISCORD_INVITE_URL,
  GITHUB_ORG_URL,
  MESHCORE_DOCS_URL,
  SITE_NAME,
} from '@/lib/constants';

const breadcrumbData = generateBreadcrumbSchema([{ name: 'Home', url: BASE_URL }]);

const featureCards = [
  {
    title: 'Off-grid by design',
    description:
      "Reach across the Front Range when cell and Wi-Fi go dark. LoRa-based MeshCore needs no carrier, tower, or subscription.",
    glyph: '◊',
    color: 'text-sunset-500',
    bg: 'bg-sunset-500/10',
  },
  {
    title: 'Operator-built network',
    description:
      'Hilltop repeaters, room servers, and companion devices are run by volunteers across Denver, Boulder, and the high country.',
    glyph: '◈',
    color: 'text-mesh',
    bg: 'bg-mesh/10',
  },
  {
    title: 'Open source backbone',
    description:
      'No vendor lock-in. Firmware, tooling, and this site are open source so anyone can audit, fork, or contribute.',
    glyph: '◇',
    color: 'text-mountain-500',
    bg: 'bg-mountain-500/10',
  },
  {
    title: 'Mountain coverage focus',
    description:
      'Routing tuned for Front Range geography — peaks, foothills, and metro rooftops working together as one mesh.',
    glyph: '◉',
    color: 'text-forest-300',
    bg: 'bg-forest-300/10',
  },
] as const;

const operatorPaths = [
  {
    audience: 'Newcomer',
    title: 'First time on the mesh',
    description: 'Pick a radio, flash MeshCore, get your first messages flowing.',
    href: '/guides/getting-started',
    cta: 'Start here',
  },
  {
    audience: 'Operator',
    title: 'Run repeaters and tools',
    description: 'Plan a hilltop install, pick a free prefix, and watch the live network from one console.',
    href: '/tools',
    cta: 'Operator tools',
  },
  {
    audience: 'Community',
    title: 'Help build the network',
    description: 'Meet the volunteers behind Colorado MeshCore and join the operator Discord.',
    href: '/about',
    cta: 'About the project',
  },
] as const;

export default function Home() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · LoRa.915`}
          eyebrowTone="mesh"
          title={
            <>
              {COMMUNITY_NAME}
              <span className="block text-mesh">community network</span>
            </>
          }
          description={
            <>
              {SITE_NAME} is home base for Colorado&apos;s open MeshCore mesh — for
              newcomers getting on the air, operators running infrastructure, and the
              community keeping it online. Track the network on the live map, open the
              tools, and join the volunteers building resilient off-grid communication
              across the Front Range and beyond.
            </>
          }
          actions={
            <>
              <Link href="/start" className="btn-primary">
                Get Started
              </Link>
              <Link href="/map" className="btn-secondary">
                Live Map
              </Link>
              <Link href="/tools" className="btn-outline">
                Tools
              </Link>
            </>
          }
        />

        <StatsSection />

        {/* Operator tools — promoted in-page after StatsSection */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
              <div>
                <SectionEyebrow tone="sunset">Operator tools</SectionEyebrow>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                  Plan a node, find a free prefix, talk to a radio.
                </h2>
                <p className="mt-3 text-foreground-muted max-w-2xl">
                  Naming, prefix planning, and field utilities live under{' '}
                  <Link
                    href="/tools"
                    className="text-mesh hover:text-mesh-light underline underline-offset-2"
                  >
                    /tools
                  </Link>
                  . Each one consumes the same live map data so identifiers stay coordinated.
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
              <ToolCard
                tone="mesh"
                glyph="◈"
                tag="REPEATER NAMING"
                title="Repeater name wizard"
                description="Compose a standards-aligned repeater name using region, city, landmark, and node type."
                href="/tools/repeater-name"
              />
              <ToolCard
                tone="sky"
                glyph="◇"
                tag="COMPANION NAMING"
                title="Companion name builder"
                description="Build a personal MeshCore identity that fits inside the 23-character limit."
                href="/tools/companion-name"
              />
              <ToolCard
                tone="sunset"
                glyph="◊"
                tag="PREFIX PLANNING"
                title="Public-key prefix matrix"
                description={`See live prefix occupancy across ${COMMUNITY_NAME} and pick a free first byte.`}
                href="/tools/prefix-matrix"
              />
              <ToolCard
                tone="forest"
                glyph="◉"
                tag="USB SERIAL"
                title="Web Serial console"
                description="Connect to a MeshCore node over USB from the browser. Manual send and canned commands."
                href="/tools/serial-usb"
              />
            </div>
          </div>
        </section>

        {/* Mission / What is MeshCore */}
        <section className="bg-background-secondary py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <SectionEyebrow tone="mesh">Mission</SectionEyebrow>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                  Build a resilient mesh that belongs to its operators.
                </h2>
                <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
                  {COMMUNITY_NAME} is a volunteer-run effort to keep a decentralized,
                  community-owned LoRa mesh online across Colorado. We deploy infrastructure,
                  document setup paths, and share the same live data that operators rely on
                  in the field.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/why-meshcore" className="btn-secondary">
                    Why MeshCore
                  </Link>
                  <Link href="/use-cases" className="btn-outline">
                    Use cases
                  </Link>
                </div>
              </div>

              <NetworkPanel
                eyebrow="What is MeshCore?"
                eyebrowTone="sky"
                title="Open LoRa mesh, no internet required"
                tone="elevated"
                padding="lg"
              >
                <p className="text-foreground-muted leading-relaxed">
                  MeshCore is an open-source LoRa mesh networking firmware. Dedicated repeaters
                  carry traffic, companion devices stay quiet, and messages can travel many hops
                  without hitting the public internet. The protocol is purpose-built for
                  city-scale infrastructure, off-grid travel, and emergency communication.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-foreground-muted">
                  <li className="flex gap-2">
                    <span aria-hidden className="text-mesh">◊</span>
                    <span>Up to 64 hops with intelligent repeater routing</span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-mesh">◊</span>
                    <span>AES-256-GCM / ChaCha20-Poly1305 encryption</span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-mesh">◊</span>
                    <span>Solar-friendly repeaters; companions stay light-weight</span>
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <a
                    href={MESHCORE_DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light"
                  >
                    MeshCore docs ↗
                  </a>
                  <a
                    href={GITHUB_ORG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mesh hover:text-mesh-light"
                  >
                    {COMMUNITY_NAME} on GitHub ↗
                  </a>
                </div>
              </NetworkPanel>
            </div>
          </div>
        </section>

        {/* Operator paths */}
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <SectionEyebrow tone="sky" className="justify-center">
                Pick a path
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                There&apos;s a doorway for every visitor.
              </h2>
              <p className="mt-3 text-foreground-muted max-w-2xl mx-auto">
                Whether you&apos;re flashing your first companion, running a hilltop
                repeater, or just here to follow the community, the docs, tools, and
                live network all link back together.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {operatorPaths.map((path) => (
                <Link
                  key={path.href}
                  href={path.href}
                  className="panel p-6 group transition-all duration-200 hover:-translate-y-0.5 focus-ring"
                >
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-3">
                    {path.audience}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {path.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {path.description}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm text-mesh group-hover:text-mesh-light">
                    {path.cta}
                    <span aria-hidden>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why operate */}
        <section className="bg-background-secondary py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <SectionEyebrow tone="mesh" className="justify-center">
                Why operate with us
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Why join {COMMUNITY_NAME}?
              </h2>
              <p className="mt-3 text-foreground-muted max-w-2xl mx-auto">
                Be part of Colorado&apos;s open mesh — built by neighbors, run by volunteers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {featureCards.map((card) => (
                <div key={card.title} className="panel p-6 sm:p-7 h-full flex flex-col">
                  <div
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-lg ${card.bg} mb-4`}
                  >
                    <span className={`text-xl leading-none ${card.color}`} aria-hidden>
                      {card.glyph}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Discord CTA */}
        <section className="bg-night-stars py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-mesh/20 mb-6">
                <svg
                  className="h-10 w-10 text-mesh"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-snow-100 tracking-tight">
                Join the operator community
              </h2>
              <p className="mt-4 text-lg sm:text-xl text-mountain-100 max-w-2xl mx-auto leading-relaxed">
                Coordinate repeaters, ask questions, and stay current on network changes.
                Free to join, no experience required.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 focus-ring shadow-lg"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Join the {COMMUNITY_NAME} Discord
                </a>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-snow-100/30 text-snow-100 hover:bg-snow-100/10 transition-all duration-200 focus-ring"
                >
                  About the project
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { HeroPanel, SectionEyebrow, ToolCard } from '@/components/brand';
import {
  BASE_URL,
  COMMUNITY_NAME,
  DISCORD_INVITE_URL,
  SITE_NAME,
} from '@/lib/constants';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';

const PAGE_TITLE = 'Learn';
const PAGE_DESCRIPTION = `Everything to learn about MeshCore — why the protocol exists, how communities use it across ${COMMUNITY_NAME}, and field notes from operators.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/learn',
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/learn`,
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    card: 'summary_large_image',
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: PAGE_TITLE, url: `${BASE_URL}/learn` },
]);

const learnDestinations = [
  {
    href: '/why-meshcore',
    title: 'Why MeshCore',
    tag: 'PROTOCOL',
    glyph: '◊',
    tone: 'mesh' as const,
    description:
      'Faster messaging, longer battery life, and city-scale coverage — what makes MeshCore different from other LoRa mesh protocols.',
  },
  {
    href: '/use-cases',
    title: 'Use Cases',
    tag: 'IN THE FIELD',
    glyph: '◈',
    tone: 'sunset' as const,
    description:
      'Practical applications across emergency preparedness, off-grid travel, and neighborhood-owned community networks.',
  },
  {
    href: '/blog',
    title: 'Blog',
    tag: 'FIELD NOTES',
    glyph: '◇',
    tone: 'sky' as const,
    description:
      'News, tutorials, hardware reviews, and operator field notes from the Colorado MeshCore community.',
  },
] as const;

export default function LearnPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />

      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · Learn`}
          eyebrowTone="sky"
          title={
            <>
              Learn about
              <span className="block text-mesh">MeshCore</span>
            </>
          }
          description={PAGE_DESCRIPTION}
          actions={
            <>
              <Link href="/why-meshcore" className="btn-primary">
                Why MeshCore
              </Link>
              <Link href="/use-cases" className="btn-secondary">
                Use cases
              </Link>
              <Link href="/blog" className="btn-outline">
                Blog
              </Link>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: PAGE_TITLE }]} />
            </div>
          }
        />

        <section
          aria-labelledby="learn-vs-start-heading"
          className="px-4 sm:px-6 lg:px-8 pb-12 -mt-10"
        >
          <div className="mx-auto max-w-7xl">
            <div className="panel p-6 sm:p-8">
              <SectionEyebrow tone="sky" className="mb-3" as="p">
                Learn vs Get Started
              </SectionEyebrow>
              <h2
                id="learn-vs-start-heading"
                className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight"
              >
                Background reading, not setup steps
              </h2>
              <p className="mt-3 text-foreground-muted max-w-3xl leading-relaxed">
                <strong className="text-foreground">Learn</strong> is for context — why MeshCore
                exists, how communities use it, and what operators are seeing on the air. If you
                want to put hardware on the network, head to{' '}
                <Link
                  href="/start"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  Get Started
                </Link>{' '}
                instead — that&rsquo;s the path-picker for joining, operating, or following along.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="learn-destinations-heading"
          className="px-4 sm:px-6 lg:px-8 pb-16"
        >
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="sky" className="mb-3" as="p">
              Three places to start
            </SectionEyebrow>
            <h2
              id="learn-destinations-heading"
              className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight"
            >
              Pick a thread to follow
            </h2>
            <p className="mt-3 mb-8 text-foreground-muted max-w-2xl leading-relaxed">
              Each destination tackles a different question — the protocol, the use cases, and the
              field notes from real operators.
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {learnDestinations.map((item) => (
                <ToolCard
                  key={item.href}
                  href={item.href}
                  tone={item.tone}
                  glyph={item.glyph}
                  tag={item.tag}
                  title={item.title}
                  description={item.description}
                  headingLevel="h3"
                />
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="learn-skip-heading"
          className="px-4 sm:px-6 lg:px-8 pb-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="panel p-6 sm:p-8 text-sm text-foreground-muted leading-relaxed">
              <SectionEyebrow tone="mesh" className="mb-3" as="p">
                Want to skip the reading?
              </SectionEyebrow>
              <h2
                id="learn-skip-heading"
                className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight"
              >
                Jump to the action
              </h2>
              <p className="mt-3">
                Open the{' '}
                <Link
                  href="/start"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  Get Started guide
                </Link>{' '}
                to put a node on the air, drop into the{' '}
                <Link
                  href="/map"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  live network map
                </Link>
                , or jump straight to the{' '}
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

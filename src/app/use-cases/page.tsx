import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { HeroPanel, NetworkPanel, SectionEyebrow } from '@/components/brand';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import { BASE_URL, COMMUNITY_NAME, DISCORD_INVITE_URL, SITE_NAME } from '@/lib/constants';

const PAGE_DESCRIPTION = `Discover how mesh networks are used across ${COMMUNITY_NAME} — disaster preparedness, off-grid adventures, and neighborhood-scale community networks.`;

export const metadata: Metadata = {
  title: 'MeshCore Use Cases | Emergency, Off-Grid & Community Networks',
  description:
    'Discover how MeshCore mesh networks are used for emergency communication, off-grid adventures, and community networks in Colorado. Learn about practical applications for decentralized mesh technology.',
  keywords: [
    'mesh network use cases',
    'emergency communication mesh',
    'off-grid communication',
    'community mesh network',
    'Colorado mesh network applications',
    'disaster communication network',
    'backcountry communication',
    'neighborhood mesh network',
    'LoRa mesh applications',
    'decentralized communication uses',
    'MeshCore applications',
    'Colorado mesh use cases',
  ],
  alternates: {
    canonical: '/use-cases',
  },
  openGraph: {
    title: `Use cases | ${SITE_NAME}`,
    description:
      'Explore practical applications for mesh networks: emergency preparedness, off-grid communication, and community networks across Colorado.',
    url: `${BASE_URL}/use-cases`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Use cases | ${SITE_NAME}`,
    description:
      'Explore practical applications for mesh networks: emergency preparedness, off-grid communication, and community networks across Colorado.',
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Use Cases', url: `${BASE_URL}/use-cases` },
]);

type UseCaseTone = 'sunset' | 'sky' | 'mesh' | 'forest';

interface UseCase {
  slug: string;
  title: string;
  glyph: string;
  description: string;
  tone: UseCaseTone;
  badge: string;
  highlights: readonly string[];
}

const useCases: readonly UseCase[] = [
  {
    slug: 'emergency-communication',
    title: 'Emergency communication',
    glyph: '◊',
    description:
      'Disaster-ready communication infrastructure that works when cell towers fail. Wildfires, blizzards, power outages, and search-and-rescue across Colorado.',
    tone: 'sunset',
    badge: 'Disaster ready',
    highlights: [
      'Works when cell towers fail',
      'No internet dependency',
      'Battery / solar powered',
      'Encrypted communication',
    ],
  },
  {
    slug: 'off-grid-communication',
    title: 'Off-grid communication',
    glyph: '◇',
    description:
      'Stay connected in Colorado backcountry where cell service fails. Hiking, camping, skiing, and outdoor adventures across the Rockies and beyond.',
    tone: 'sky',
    badge: 'Backcountry',
    highlights: [
      'No cell service required',
      '10+ mile range',
      'Lightweight & portable',
      'Long battery life',
    ],
  },
  {
    slug: 'community-networks',
    title: 'Community networks',
    glyph: '◈',
    description:
      'Resilient neighborhood networks owned and operated by your community. HOAs, rural areas, mountain towns, and apartments seeking independent communication.',
    tone: 'forest',
    badge: 'Neighborhood',
    highlights: [
      'Zero monthly costs',
      'Community owned',
      'Privacy focused',
      'Builds connections',
    ],
  },
];

const TONE_TEXT: Record<UseCaseTone, string> = {
  sunset: 'text-sunset-500',
  sky: 'text-sky-signal',
  mesh: 'text-mesh',
  forest: 'text-forest-300',
};

const TONE_HOVER_BORDER: Record<UseCaseTone, string> = {
  sunset: 'group-hover:border-sunset-500/60',
  sky: 'group-hover:border-sky-signal/60',
  mesh: 'group-hover:border-mesh/60',
  forest: 'group-hover:border-forest-300/60',
};

const whyChoose = [
  {
    title: 'No internet required',
    description: 'Works independently of ISPs and cellular networks. The mesh is the network.',
    glyph: '◊',
  },
  {
    title: 'Zero monthly fees',
    description: 'One-time hardware cost, free to operate forever. No subscriptions, ever.',
    glyph: '◇',
  },
  {
    title: 'Encrypted & private',
    description: 'AES-256 encryption keeps messages secure end-to-end across the mesh.',
    glyph: '◉',
  },
  {
    title: 'No license needed',
    description: 'Uses license-free ISM band frequencies — no FCC certification required.',
    glyph: '◈',
  },
] as const;

const stats = [
  { value: '10+', label: 'Mile range', tone: 'text-mesh' },
  { value: '$0', label: 'Monthly cost', tone: 'text-forest-300' },
  { value: '256-bit', label: 'Encryption', tone: 'text-mountain-300' },
  { value: '24/7', label: 'Always on', tone: 'text-sunset-500' },
] as const;

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'MeshCore Use Cases',
  description:
    'Discover how MeshCore mesh networks are used for emergency communication, off-grid adventures, and community networks in Colorado.',
  url: `${BASE_URL}/use-cases`,
  publisher: {
    '@type': 'Organization',
    name: 'Colorado MeshCore',
    url: BASE_URL,
  },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: useCases.map((useCase, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: useCase.title,
      url: `${BASE_URL}/use-cases/${useCase.slug}`,
    })),
  },
};

export default function UseCasesPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <JsonLd data={pageSchema} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · Use cases`}
          eyebrowTone="sunset"
          title={
            <>
              MeshCore
              <span className="block text-mesh">use cases</span>
            </>
          }
          description={PAGE_DESCRIPTION}
          actions={
            <>
              <Link href="/start" className="btn-primary">
                Get Started
              </Link>
              <Link href="/map" className="btn-secondary">
                View live map
              </Link>
              <Link href="/why-meshcore" className="btn-outline">
                Why MeshCore
              </Link>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Use Cases' }]} />
            </div>
          }
        />

        {/* Use cases grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="sunset" className="mb-3">
              Explore use cases
            </SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Three ways the network shows up.
            </h2>
            <p className="mt-3 mb-8 text-foreground-muted max-w-2xl">
              From emergency preparedness to everyday neighborhood communication, MeshCore adapts
              to your scenario. Each card links to a deep dive.
            </p>

            <div className="grid gap-5 lg:grid-cols-3">
              {useCases.map((useCase) => {
                const toneText = TONE_TEXT[useCase.tone];
                const hoverBorder = TONE_HOVER_BORDER[useCase.tone];
                return (
                  <Link
                    key={useCase.slug}
                    href={`/use-cases/${useCase.slug}`}
                    className={`panel p-6 sm:p-7 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring h-full flex flex-col ${hoverBorder}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <span aria-hidden className={`text-4xl leading-none ${toneText}`}>
                        {useCase.glyph}
                      </span>
                      <span className={`mono text-[0.65rem] uppercase tracking-[0.18em] ${toneText}`}>
                        ◊ {useCase.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                      {useCase.title}
                    </h3>
                    <p className="mt-3 text-sm text-foreground-muted leading-relaxed flex-grow">
                      {useCase.description}
                    </p>

                    <ul className="mt-5 space-y-2">
                      {useCase.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="text-sm text-foreground-muted flex items-start gap-2"
                        >
                          <span aria-hidden className={`mt-0.5 ${toneText}`}>
                            ◊
                          </span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex items-center justify-between text-xs text-foreground-dim">
                      <span className="mono">explore</span>
                      <span className={toneText} aria-hidden>
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why mesh */}
        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="mesh" className="justify-center">
                Why choose MeshCore?
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Four reasons it works for every scenario.
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {whyChoose.map((item) => (
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

        {/* Stats */}
        <section className="bg-background py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {stats.map((stat) => (
                <div key={stat.label} className="panel p-5 text-center">
                  <div
                    className={`text-2xl sm:text-3xl mono font-semibold tracking-tight mb-1 ${stat.tone}`}
                  >
                    {stat.value}
                  </div>
                  <div className="metric-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-night-stars py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <SectionEyebrow tone="mesh" className="justify-center">
              Ready to get started?
            </SectionEyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-snow-100 tracking-tight">
              Join the {COMMUNITY_NAME} community.
            </h2>
            <p className="mt-4 text-lg text-mountain-100 leading-relaxed">
              Whether you&apos;re preparing for emergencies, exploring the backcountry, or
              connecting your neighborhood — there&apos;s a path for you.
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

import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { HeroPanel, NetworkPanel, SectionEyebrow } from '@/components/brand';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import { BASE_URL, COMMUNITY_NAME, DISCORD_INVITE_URL, SITE_NAME } from '@/lib/constants';

const PAGE_TITLE = 'Community networks';

export const metadata: Metadata = {
  title: 'Community Mesh Networks | Build Your Neighborhood Network',
  description:
    'Learn how to build a community mesh network for your neighborhood. Create resilient, decentralized communication infrastructure that works without internet or cell towers. Perfect for neighborhood networks, HOAs, and local communities.',
  keywords: [
    'community mesh network',
    'neighborhood network',
    'community network',
    'local mesh network',
    'neighborhood mesh',
    'community wireless network',
    'decentralized neighborhood network',
    'off-grid community network',
    'HOA mesh network',
    'residential mesh network',
    'Denver community network',
    'Colorado neighborhood network',
  ],
  alternates: {
    canonical: '/use-cases/community-networks',
  },
  openGraph: {
    title: `Community networks | ${SITE_NAME}`,
    description:
      'Build a resilient community mesh network for your neighborhood. Connect with neighbors, stay prepared for emergencies, and create lasting local communication infrastructure.',
    url: `${BASE_URL}/use-cases/community-networks`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Community networks | ${SITE_NAME}`,
    description:
      'Build a resilient community mesh network for your neighborhood. Connect with neighbors and create lasting local communication infrastructure.',
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Use Cases', url: `${BASE_URL}/use-cases` },
  { name: 'Community Networks', url: `${BASE_URL}/use-cases/community-networks` },
]);

const communityBenefits = [
  {
    title: 'Emergency resilience',
    description:
      'When power outages hit or cell towers fail, your community mesh keeps neighbors connected. Coordinate response, check on vulnerable residents, share critical information.',
    glyph: '◊',
    tone: 'sunset' as const,
  },
  {
    title: 'Zero monthly costs',
    description:
      'No monthly fees. After the initial hardware investment, your neighborhood network runs free — forever.',
    glyph: '◇',
    tone: 'sunset' as const,
  },
  {
    title: 'Community building',
    description:
      'Share local updates, organize events, coordinate neighborhood watch, and build stronger community bonds through better communication.',
    glyph: '◈',
    tone: 'mesh' as const,
  },
  {
    title: 'Privacy & independence',
    description:
      'Your community mesh operates independently of corporate infrastructure. No data harvesting, no surveillance, no third-party control.',
    glyph: '◉',
    tone: 'sky' as const,
  },
] as const;

const implementationSteps = [
  {
    step: 1,
    title: 'Survey your neighborhood',
    description:
      'Identify interested neighbors and map your community. Look for high points — rooftops, hills, tall buildings — that could host repeater nodes.',
    tips: [
      'Talk to neighbors about the benefits of a community mesh network',
      'Identify homes with good line-of-sight to other areas',
      'Consider solar power options for outdoor installations',
    ],
  },
  {
    step: 2,
    title: 'Plan your network architecture',
    description:
      'Design your network with a mix of repeaters and client devices. Strategic placement of repeaters ensures all homes can connect reliably.',
    tips: [
      'Place repeaters on the highest available points',
      'Plan for redundancy with multiple coverage paths',
      'Consider weather protection for outdoor nodes',
    ],
  },
  {
    step: 3,
    title: 'Deploy initial nodes',
    description:
      'Start with a core group of enthusiastic neighbors. Install repeaters at key locations and distribute companion devices to early adopters.',
    tips: [
      'Test coverage as you deploy each node',
      'Document node locations and configurations',
      'Create a maintenance schedule for outdoor installations',
    ],
  },
  {
    step: 4,
    title: 'Expand & onboard neighbors',
    description:
      'Grow your network organically. Help new neighbors set up their devices and integrate with the existing infrastructure.',
    tips: [
      'Host setup sessions for new members',
      'Create local documentation and guides',
      'Establish communication protocols and etiquette',
    ],
  },
] as const;

const useCaseScenarios = [
  {
    title: 'HOA & gated communities',
    description:
      'Perfect for homeowner associations seeking secure, private community communication. Coordinate maintenance, share announcements, no monthly fees.',
    glyph: '◊',
  },
  {
    title: 'Rural neighborhoods',
    description:
      'Ideal where cellular coverage is weak or nonexistent. A neighborhood network provides reliable communication across large properties.',
    glyph: '◇',
  },
  {
    title: 'Mountain communities',
    description:
      'Colorado mountain towns face unique challenges. Community mesh networks stay online when winter storms knock out traditional infrastructure.',
    glyph: '◉',
  },
  {
    title: 'Apartment & condo buildings',
    description:
      'Connect residents across multi-unit buildings. Share updates, coordinate package deliveries, and build a true community within your complex.',
    glyph: '◈',
  },
] as const;

const stats = [
  { value: '10+ mi', label: 'Node range', tone: 'text-mesh' },
  { value: '$0', label: 'Monthly fees', tone: 'text-forest-300' },
  { value: '24/7', label: 'Always on', tone: 'text-mountain-300' },
  { value: '100%', label: 'Community owned', tone: 'text-sunset-500' },
] as const;

const faqItems = [
  {
    question: 'How far can a community mesh network reach?',
    answer:
      'Individual nodes can communicate over several miles with good line-of-sight. By placing repeaters strategically, a neighborhood network can cover entire communities — from small subdivisions to multi-mile areas.',
  },
  {
    question: 'What equipment do neighbors need?',
    answer:
      'Each participant needs a MeshCore-compatible device (around $30–50 for basic units). Community repeaters cost a bit more ($50–100) but serve the entire neighborhood.',
  },
  {
    question: 'Is a community mesh network legal?',
    answer:
      'Yes. MeshCore uses license-free LoRa frequencies (915 MHz in the US). No radio license is required, making it accessible to everyone.',
  },
  {
    question: 'What happens during a power outage?',
    answer:
      'Battery-powered and solar-powered nodes continue operating. This is one of the key advantages of a community mesh for emergency preparedness.',
  },
  {
    question: 'Can our HOA manage the network?',
    answer:
      'Absolutely. Many HOAs and community groups successfully operate neighborhood networks. The decentralized nature means shared responsibility, and MeshCore provides tools for management.',
  },
] as const;

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Community Mesh Networks: Build Your Neighborhood Network',
  description:
    'Learn how to build a community mesh network for your neighborhood using MeshCore technology.',
  author: { '@type': 'Organization', name: 'Colorado MeshCore', url: BASE_URL },
  publisher: { '@type': 'Organization', name: 'Colorado MeshCore', url: BASE_URL },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/use-cases/community-networks` },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

export default function CommunityNetworksPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <JsonLd data={pageSchema} />
      <JsonLd data={faqSchema} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow="Use case · Community"
          eyebrowTone="mesh"
          title={
            <>
              Community
              <span className="block text-mesh">mesh networks</span>
            </>
          }
          description="Build a resilient neighborhood network that connects your community — no internet or cell service required. Decentralized, free, owned by neighbors."
          actions={
            <>
              <Link href="/start" className="btn-primary">
                Start your network
              </Link>
              <a href="#how-it-works" className="btn-secondary">
                How it works
              </a>
              <Link href="/map" className="btn-outline">
                Live map
              </Link>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Use Cases', href: '/use-cases' },
                  { label: PAGE_TITLE },
                ]}
              />
            </div>
          }
        />

        {/* What is a community mesh network */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
            <NetworkPanel
              eyebrow="What is a community mesh?"
              eyebrowTone="mesh"
              title="Decentralized comms, owned by neighbors"
              tone="elevated"
              padding="lg"
              headingLevel="h2"
            >
              <div className="space-y-4 text-foreground-muted leading-relaxed">
                <p>
                  A community mesh network is decentralized communication infrastructure built and
                  owned by neighborhood residents. Unlike traditional networks that rely on cell
                  towers and internet providers, a mesh network operates independently using radio
                  waves.
                </p>
                <p>
                  Each node can talk directly to others and relay messages across the community,
                  creating a resilient web of connections that works even when the power grid and
                  commercial networks fail.
                </p>
                <p>
                  Using MeshCore and LoRa radios, communities across Denver and Colorado are
                  building lasting infrastructure that serves their neighbors in everyday life and
                  during emergencies.
                </p>
              </div>
            </NetworkPanel>

            <div className="grid grid-cols-2 gap-4">
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

        {/* Benefits */}
        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="mesh" className="justify-center">
                Why build a neighborhood network?
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Lasting value for your neighborhood.
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {communityBenefits.map((benefit) => (
                <NetworkPanel
                  key={benefit.title}
                  title={benefit.title}
                  headingLevel="h3"
                  padding="md"
                  className="h-full"
                >
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="text-3xl text-mesh leading-none">
                      {benefit.glyph}
                    </span>
                    <p className="text-sm text-foreground-muted leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </NetworkPanel>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="sky" className="justify-center">
                Perfect for your community
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Adapts to any neighborhood type.
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {useCaseScenarios.map((scenario) => (
                <div key={scenario.title} className="panel p-6 h-full text-center">
                  <span aria-hidden className="text-4xl text-mesh leading-none mb-3 block">
                    {scenario.glyph}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="sunset" className="justify-center">
                Build your community mesh
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Four steps to a resilient neighborhood network.
              </h2>
            </div>

            <div className="space-y-4">
              {implementationSteps.map((step) => (
                <div key={step.step} className="panel p-6 sm:p-7 flex flex-col md:flex-row gap-5">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-mesh/15 border border-mesh/40 flex items-center justify-center font-mono font-semibold text-mesh"
                    aria-hidden
                  >
                    {step.step.toString().padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {step.tips.map((tip) => (
                        <li
                          key={tip}
                          className="text-sm text-foreground-muted flex items-start gap-2"
                        >
                          <span aria-hidden className="text-mesh mt-0.5">
                            ◊
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join Colorado MeshCore */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="panel-elevated p-6 sm:p-8 lg:p-10">
              <SectionEyebrow tone="mesh">Join {COMMUNITY_NAME}</SectionEyebrow>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                You don&apos;t start from scratch.
              </h2>
              <div className="mt-5 space-y-4 text-foreground-muted leading-relaxed">
                <p>
                  When you build a neighborhood network with MeshCore, you join a growing mesh that
                  spans Denver and the Front Range. Your local network can connect to the broader
                  {' '}{COMMUNITY_NAME} infrastructure for extended reach and access to repeaters
                  across the region.
                </p>
                <p>
                  Our Discord provides support and shared knowledge — from hardware
                  recommendations to install tips, experienced operators are ready to help.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/map" className="btn-secondary">
                  View network map
                </Link>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="sky" className="justify-center">
                FAQ
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Community network questions.
              </h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className="panel p-6">
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-night-stars py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <SectionEyebrow tone="mesh" className="justify-center">
              Ready to build your neighborhood network?
            </SectionEyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-snow-100 tracking-tight">
              Start small, grow organically.
            </h2>
            <p className="mt-4 text-lg text-mountain-100 leading-relaxed">
              Create lasting communication infrastructure for your community. The {COMMUNITY_NAME}
              {' '}community is here to help.
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

import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { HeroPanel, NetworkPanel, SectionEyebrow } from '@/components/brand';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import { generateFAQSchema } from '@/lib/schemas/faq';
import { BASE_URL, COMMUNITY_NAME, DISCORD_INVITE_URL, SITE_NAME } from '@/lib/constants';

const PAGE_TITLE = 'Why MeshCore?';
const PAGE_DESCRIPTION =
  'Faster messaging, better battery life, and city-scale reliability. See why operators are choosing MeshCore for serious mesh networking.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    'Discover why MeshCore offers faster messaging, better battery life, and more reliable communication than traditional mesh networks. Learn about the advantages of MeshCore for city-scale mesh networking.',
  keywords: [
    'MeshCore',
    'Meshtastic alternative',
    'mesh network comparison',
    'LoRa mesh',
    'off-grid communication',
    'decentralized network',
    'Colorado mesh',
  ],
  alternates: {
    canonical: '/why-meshcore',
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/why-meshcore`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: ['/logo-512.png'],
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: PAGE_TITLE, url: `${BASE_URL}/why-meshcore` },
]);

const whyMeshCoreFAQData = [
  {
    question: 'What is the difference between MeshCore and Meshtastic?',
    answer:
      'MeshCore and Meshtastic are both LoRa mesh networking protocols but with different design philosophies. MeshCore uses dedicated repeaters for routing while client devices stay quiet, reducing network congestion. Meshtastic uses a flooding approach where all nodes can relay messages. MeshCore supports up to 64 hops versus Meshtastic\'s 7 hops, making it better suited for city-scale infrastructure networks. Meshtastic has a larger community (~40,000+ users) while MeshCore is growing (~3,500+ users).',
  },
  {
    question: 'Why does MeshCore support 64 hops while Meshtastic only supports 7?',
    answer:
      'MeshCore\'s 64-hop limit versus Meshtastic\'s 7-hop limit comes from their different routing architectures. Meshtastic uses flooding where every node rebroadcasts, so limiting hops prevents exponential message multiplication. MeshCore uses intelligent repeater-based routing where only dedicated repeaters relay messages, allowing much longer routes without network saturation. This makes MeshCore ideal for spanning cities and regions.',
  },
  {
    question: 'Does MeshCore have better battery life than Meshtastic?',
    answer:
      'Yes, MeshCore typically offers better battery life for edge devices because only dedicated repeaters relay messages. In Meshtastic, every node rebroadcasts all messages, consuming more power. MeshCore\'s "repeaters route, edge nodes don\'t pollute" philosophy means companion devices use significantly less power, making it ideal for solar-powered installations and portable use.',
  },
  {
    question: 'How does MeshCore reduce network congestion compared to Meshtastic?',
    answer:
      'MeshCore reduces congestion by separating device roles: Companion devices connect via Bluetooth to phones and don\'t relay traffic, while dedicated Repeaters handle all routing. Meshtastic uses flooding where all nodes rebroadcast messages by default. This means MeshCore networks have more available airtime for actual communication, especially as the network grows larger.',
  },
  {
    question: 'Which is better for emergency communication: MeshCore or Meshtastic?',
    answer:
      'Both work for emergency communication, but they excel in different scenarios. MeshCore is better for planned infrastructure networks with fixed repeaters providing reliable city-wide coverage. Meshtastic excels for ad-hoc mobile groups where everyone brings a radio. For community emergency preparedness with pre-deployed repeater infrastructure, MeshCore\'s reliability and range make it the stronger choice.',
  },
  {
    question: 'Can MeshCore and Meshtastic devices communicate with each other?',
    answer:
      'No, MeshCore and Meshtastic use different protocols and cannot communicate with each other directly. They are separate mesh networks even if using similar LoRa hardware. You need to choose one protocol for your network. Some communities run both networks in parallel for different use cases.',
  },
  {
    question: 'How fast is messaging on MeshCore compared to Meshtastic?',
    answer:
      'MeshCore typically delivers messages faster with sub-second delivery for nearby nodes and sub-2-second responses across 9-hop routes. Meshtastic message speed is more variable, especially on congested networks with many nodes broadcasting. MeshCore\'s optimized bandwidth settings and reduced traffic from non-repeater nodes contribute to faster, more consistent message delivery.',
  },
  {
    question: 'What encryption does MeshCore use compared to Meshtastic?',
    answer:
      'MeshCore supports AES-256-GCM and ChaCha20-Poly1305 encryption with identity attestation and key control. Meshtastic uses AES-256 encryption. Both provide strong encryption for secure communication. MeshCore\'s Room Servers also enable encrypted group messaging for persistent chat rooms.',
  },
];

const faqData = generateFAQSchema(whyMeshCoreFAQData);

const keyAdvantages = [
  {
    eyebrow: 'Speed',
    title: 'Faster messaging',
    description:
      'Sub-second delivery for nearby nodes and sub-2-second responses across 9-hop routes. Optimized bandwidth and clean airtime keep latency low.',
    glyph: '◊',
    tone: 'mesh' as const,
  },
  {
    eyebrow: 'Battery',
    title: 'Better battery life',
    description:
      'Companions stay quiet — only dedicated repeaters relay traffic. Less LoRa transmit time means longer runtime on solar and battery.',
    glyph: '◇',
    tone: 'sunset' as const,
  },
  {
    eyebrow: 'Airtime',
    title: 'Less network congestion',
    description:
      'No flood-by-default. Repeaters carry routing while client devices listen, leaving more airtime for actual messages.',
    glyph: '◉',
    tone: 'sky' as const,
  },
  {
    eyebrow: 'Range',
    title: 'City-scale coverage',
    description:
      'Up to 64 hops (vs 7 in flood-routed alternatives). Communities have linked hundreds of miles of repeaters across multiple states.',
    glyph: '◈',
    tone: 'sunset' as const,
  },
] as const;

const comparisonPoints = [
  { feature: 'Maximum Hops', meshcore: 'Up to 64', alternative: 'Up to 7', winner: 'meshcore' },
  { feature: 'Message Speed', meshcore: 'Sub-second to 2s', alternative: 'Variable, often slower', winner: 'meshcore' },
  { feature: 'Network Traffic', meshcore: 'Minimal (repeaters only)', alternative: 'All nodes broadcast', winner: 'meshcore' },
  { feature: 'Battery Life', meshcore: 'Excellent', alternative: 'Good', winner: 'meshcore' },
  { feature: 'Message Delivery Feedback', meshcore: 'Precise status & retry', alternative: 'Basic', winner: 'meshcore' },
  { feature: 'Encryption', meshcore: 'AES-256-GCM / ChaCha20', alternative: 'AES-256', winner: 'meshcore' },
  { feature: 'Community Size', meshcore: 'Growing (~3,500+)', alternative: 'Large (~40,000+)', winner: 'alternative' },
  { feature: 'Best For', meshcore: 'Planned networks, city-scale', alternative: 'Ad-hoc, mobile groups', winner: 'tie' },
] as const;

const detailedBenefits = [
  {
    title: 'Infrastructure-focused design',
    description:
      'MeshCore concentrates airtime on purpose-built repeater nodes rather than relying on end-user devices to relay messages. The "repeaters route; edge nodes don\'t pollute" philosophy dramatically reduces network congestion.',
    details: [
      'Companion devices connect via Bluetooth to your phone',
      'Only dedicated Repeaters relay messages across the network',
      'Room Servers enable persistent chat rooms',
      'Each role is optimized for its specific purpose',
    ],
    eyebrowTone: 'mesh' as const,
  },
  {
    title: 'Reliable message delivery',
    description:
      'MeshCore provides precise control over message delivery and status. The app shows exact sending attempts, automatically switches between direct and flood routing if delivery fails, and gives clear feedback.',
    details: [
      'See exactly how many delivery attempts were made',
      'Automatic retry with intelligent routing fallback',
      'Define specific repeater paths for critical messages',
      'Clear success / failure feedback for every message',
    ],
    eyebrowTone: 'sky' as const,
  },
  {
    title: 'Optimized radio configuration',
    description:
      'MeshCore\'s default preset uses optimized bandwidth and spreading factors that improve signal-to-noise ratio and airtime efficiency while maintaining excellent range.',
    details: [
      '62.5 kHz bandwidth fits between interference sources',
      'Tuned spreading factors for US 902-928 MHz band',
      'Pull-based telemetry minimizes unnecessary broadcasts',
      'More available airtime for actual communication',
    ],
    eyebrowTone: 'sunset' as const,
  },
  {
    title: 'Strong security',
    description:
      'MeshCore supports optional end-to-end encryption with identity attestation, giving you control over your communication security.',
    details: [
      'AES-256-GCM or ChaCha20-Poly1305 encryption',
      'Identity attestation and key control',
      'Secure group messaging with Room Servers',
      'No central authority or data collection',
    ],
    eyebrowTone: 'mesh' as const,
  },
] as const;

const useCases = [
  {
    title: 'Emergency preparedness',
    glyph: '◊',
    description:
      'When cell towers fail, MeshCore keeps communities connected. Fixed repeaters on high points provide reliable coverage across entire regions.',
  },
  {
    title: 'Community networks',
    glyph: '◈',
    description:
      'Build a city-scale mesh that grows with your community. Strategic repeater placement creates robust, long-lasting infrastructure.',
  },
  {
    title: 'Outdoor adventures',
    glyph: '◇',
    description:
      'Stay connected in the backcountry where cell service does not exist. Lightweight companion devices pair with your smartphone.',
  },
  {
    title: 'Events & coordination',
    glyph: '◉',
    description:
      'Room Servers enable group chat for events, search and rescue, or community coordination without internet dependency.',
  },
] as const;

export default function WhyMeshCorePage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <JsonLd data={faqData} />
      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · Why MeshCore`}
          eyebrowTone="mesh"
          title={
            <>
              Why
              <span className="block text-mesh">MeshCore?</span>
            </>
          }
          description={PAGE_DESCRIPTION}
          actions={
            <>
              <Link href="/start" className="btn-primary">
                Get Started
              </Link>
              <a href="#comparison" className="btn-secondary">
                See comparison
              </a>
              <Link href="/use-cases" className="btn-outline">
                Use cases
              </Link>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: PAGE_TITLE }]} />
            </div>
          }
        />

        {/* Key advantages */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10" aria-labelledby="key-advantages-heading">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="mesh" className="mb-3">
              Key advantages
            </SectionEyebrow>
            <h2
              id="key-advantages-heading"
              className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight"
            >
              Built for reliable, city-scale communication.
            </h2>
            <p className="mt-3 mb-6 text-foreground-muted max-w-2xl">
              MeshCore is designed from the ground up for serious mesh networking. Four
              choices made early in the protocol give it a different shape than flood-routed
              alternatives.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {keyAdvantages.map((advantage) => (
                <NetworkPanel
                  key={advantage.title}
                  eyebrow={advantage.eyebrow}
                  eyebrowTone={advantage.tone}
                  title={advantage.title}
                  headingLevel="h3"
                  padding="md"
                  className="h-full"
                >
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="text-3xl text-mesh leading-none">
                      {advantage.glyph}
                    </span>
                    <p className="text-sm text-foreground-muted leading-relaxed">
                      {advantage.description}
                    </p>
                  </div>
                </NetworkPanel>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section id="comparison" className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="sunset" className="justify-center">
                Comparison
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                MeshCore vs flood-routed alternatives.
              </h2>
              <p className="mt-3 text-foreground-muted max-w-2xl mx-auto">
                A fair comparison with other LoRa mesh solutions. Each has its strengths.
              </p>
            </div>

            {/* Mobile: stacked cards. md+: classic table. */}
            <div className="md:hidden space-y-3" role="list" aria-label="MeshCore vs alternatives comparison">
              {comparisonPoints.map((point) => {
                const winnerLabel =
                  point.winner === 'meshcore'
                    ? 'MeshCore advantage'
                    : point.winner === 'alternative'
                      ? 'Alternative advantage'
                      : 'Even — depends on use case';
                return (
                  <div
                    key={point.feature}
                    role="listitem"
                    className="panel p-4"
                  >
                    <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim">
                      {point.feature}
                    </div>
                    <dl className="mt-3 grid grid-cols-1 gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-xs mono uppercase tracking-[0.18em] text-mesh shrink-0">
                          MeshCore
                        </dt>
                        <dd
                          className={`text-sm text-right ${
                            point.winner === 'meshcore'
                              ? 'text-mesh font-semibold'
                              : 'text-foreground-muted'
                          }`}
                        >
                          {point.meshcore}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim shrink-0">
                          Alternatives
                        </dt>
                        <dd
                          className={`text-sm text-right ${
                            point.winner === 'alternative'
                              ? 'text-mesh font-semibold'
                              : 'text-foreground-muted'
                          }`}
                        >
                          {point.alternative}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-[0.7rem] mono uppercase tracking-[0.18em] text-foreground-dim">
                      {winnerLabel}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="hidden md:block panel overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <caption className="sr-only">
                  MeshCore versus flood-routed mesh alternatives across eight comparison points.
                </caption>
                <thead className="bg-night-800/50">
                  <tr>
                    <th scope="col" className="px-4 md:px-6 py-4 text-left text-xs mono uppercase tracking-[0.18em] text-foreground-dim">
                      Feature
                    </th>
                    <th scope="col" className="px-4 md:px-6 py-4 text-left text-xs mono uppercase tracking-[0.18em] text-mesh">
                      MeshCore
                    </th>
                    <th scope="col" className="px-4 md:px-6 py-4 text-left text-xs mono uppercase tracking-[0.18em] text-foreground-dim">
                      Alternatives
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {comparisonPoints.map((point) => (
                    <tr key={point.feature} className="hover:bg-night-800/30 transition-colors">
                      <th scope="row" className="px-4 md:px-6 py-4 text-foreground font-medium text-sm text-left">
                        {point.feature}
                      </th>
                      <td className="px-4 md:px-6 py-4">
                        <span
                          className={`text-sm ${
                            point.winner === 'meshcore'
                              ? 'text-mesh font-semibold'
                              : 'text-foreground-muted'
                          }`}
                        >
                          {point.meshcore}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span
                          className={`text-sm ${
                            point.winner === 'alternative'
                              ? 'text-mesh font-semibold'
                              : 'text-foreground-muted'
                          }`}
                        >
                          {point.alternative}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-sm text-foreground-dim text-center">
              Note: MeshCore and other mesh protocols are not compatible with each other. Choose
              based on your network&apos;s goals.
            </p>
          </div>
        </section>

        {/* Detailed benefits */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="sky" className="justify-center">
                Built for real-world networks
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                What this looks like in practice.
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {detailedBenefits.map((benefit) => (
                <NetworkPanel
                  key={benefit.title}
                  title={benefit.title}
                  headingLevel="h3"
                  padding="md"
                  className="h-full"
                >
                  <p className="text-sm text-foreground-muted leading-relaxed mb-4">
                    {benefit.description}
                  </p>
                  <ul className="space-y-2">
                    {benefit.details.map((detail) => (
                      <li
                        key={detail}
                        className="text-sm text-foreground-muted flex items-start gap-2"
                      >
                        <span aria-hidden className="text-mesh mt-0.5">
                          ◊
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </NetworkPanel>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="bg-background-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionEyebrow tone="mesh" className="justify-center">
                Who uses MeshCore?
              </SectionEyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                From emergencies to weekend hikes.
              </h2>
              <p className="mt-3 text-foreground-muted max-w-2xl mx-auto">
                MeshCore powers communication when it matters most — and when it&apos;s just
                neighborly to stay in touch.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map((useCase) => (
                <div key={useCase.title} className="panel p-6 h-full flex flex-col">
                  <span aria-hidden className="text-3xl text-mesh leading-none mb-3">
                    {useCase.glyph}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {useCase.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Honest framing */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="panel-elevated p-6 sm:p-8 lg:p-10">
              <SectionEyebrow tone="sky">A note on choosing your protocol</SectionEyebrow>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Honest about technology choices.
              </h2>
              <div className="mt-5 space-y-4 text-foreground-muted leading-relaxed">
                <p>
                  We&apos;re fans of MeshCore, but it&apos;s not the only option. Other LoRa mesh
                  protocols have larger communities and may be better suited for ad-hoc mobile
                  groups or events where everyone brings a radio.
                </p>
                <p>
                  MeshCore shines when you want lasting infrastructure — fixed repeaters on
                  rooftops and high points that create reliable, city-scale coverage. If you&apos;re
                  here to participate in {COMMUNITY_NAME}, MeshCore is the protocol our network is
                  built on.
                </p>
              </div>
              <div className="mt-6">
                <a
                  href="https://www.austinmesh.org/learn/meshcore-vs-meshtastic/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2 inline-flex items-center gap-2"
                >
                  Read a detailed comparison from Austin Mesh
                  <span aria-hidden>↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-night-stars py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <SectionEyebrow tone="mesh" className="justify-center">
              Ready to try MeshCore?
            </SectionEyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-snow-100 tracking-tight">
              Join the {COMMUNITY_NAME} community.
            </h2>
            <p className="mt-4 text-lg text-mountain-100 leading-relaxed">
              Get hardware, flash the firmware, and become part of Colorado&apos;s growing mesh
              network.
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

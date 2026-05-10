import type { Metadata } from 'next';
import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { HeroPanel, NetworkPanel, SectionEyebrow } from '@/components/brand';
import {
  BASE_URL,
  COMMUNITY_NAME,
  DISCORD_INVITE_URL,
  SITE_NAME,
} from '@/lib/constants';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';

const PAGE_TITLE = 'Get Started';
const PAGE_DESCRIPTION = `Three balanced paths into ${SITE_NAME}: get your first radio on the air, run repeaters and operator tools, or join the community building the network.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/start',
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/start`,
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
  { name: PAGE_TITLE, url: `${BASE_URL}/start` },
]);

interface JourneyLink {
  label: string;
  href: string;
  external?: boolean;
}

type EyebrowTone = 'mesh' | 'sunset' | 'sky';

interface JourneyPath {
  audience: 'Newcomer' | 'Operator' | 'Community';
  eyebrowTone: EyebrowTone;
  title: string;
  description: string;
  primary: JourneyLink;
  supporting: readonly JourneyLink[];
}

const journeyPaths: readonly JourneyPath[] = [
  {
    audience: 'Newcomer',
    eyebrowTone: 'mesh',
    title: 'First time on the mesh',
    description:
      'Pick a radio, flash MeshCore, name your node, and send your first message on the Front Range mesh.',
    primary: {
      href: '/guides/getting-started',
      label: 'Getting started guide',
    },
    supporting: [
      { href: '/guides/radio-settings', label: 'Radio settings & channels' },
      { href: '/guides/naming-standard', label: 'Naming standard' },
    ],
  },
  {
    audience: 'Operator',
    eyebrowTone: 'sunset',
    title: 'Already have hardware',
    description:
      'Run the operator tools, plan a repeater install, and watch the live network from one console.',
    primary: {
      href: '/tools',
      label: 'Open operator tools',
    },
    supporting: [
      { href: '/map', label: 'Live network map' },
      { href: '/guides/repeater-setup', label: 'Repeater setup guide' },
    ],
  },
  {
    audience: 'Community',
    eyebrowTone: 'sky',
    title: 'Here for the community',
    description: `Meet the volunteers behind ${COMMUNITY_NAME}, learn why MeshCore matters, and join the operator chat on Discord.`,
    primary: {
      href: '/about',
      label: 'About the project',
    },
    supporting: [
      { href: DISCORD_INVITE_URL, label: 'Operator Discord', external: true },
      { href: '/why-meshcore', label: 'Why MeshCore' },
      { href: '/use-cases', label: 'Use cases' },
    ],
  },
] as const;

function PrimaryAction({ link }: { link: JourneyLink }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        {link.label}
        <span aria-hidden> ↗</span>
      </a>
    );
  }

  return (
    <Link href={link.href} className="btn-primary">
      {link.label}
    </Link>
  );
}

function SupportingLink({ link }: { link: JourneyLink }) {
  const className =
    'text-mesh hover:text-mesh-light underline underline-offset-2';

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
        <span aria-hidden> ↗</span>
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export default function StartPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />

      <div className="min-h-screen">
        <HeroPanel
          background="topo-grid"
          showMountains
          eyebrow={`${COMMUNITY_NAME} · Onboarding`}
          eyebrowTone="mesh"
          title={
            <>
              Get Started with
              <span className="block text-mesh">{COMMUNITY_NAME}</span>
            </>
          }
          description={
            <>
              There is more than one way into {SITE_NAME}. Pick whether you are setting
              up your first radio, running infrastructure, or joining the community —
              every path crosses back to the same live data and operator chat.
            </>
          }
          actions={
            <>
              <Link href="/guides/getting-started" className="btn-primary">
                Get on the mesh
              </Link>
              <Link href="/map" className="btn-secondary">
                Live Map
              </Link>
              <Link href="/tools" className="btn-outline">
                Tools
              </Link>
            </>
          }
          meta={
            <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: PAGE_TITLE }]} />
            </div>
          }
        />

        <section className="px-4 sm:px-6 lg:px-8 pb-16 -mt-10">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tone="mesh" className="mb-3">
              Pick your path
            </SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Three doorways into the network.
            </h2>
            <p className="mt-3 mb-8 text-foreground-muted max-w-2xl">
              Newcomers learn first. Operators ship infrastructure. Community-minded folks
              coordinate and help out.
            </p>

            <div className="grid gap-5 md:grid-cols-3">
              {journeyPaths.map((path) => (
                <NetworkPanel
                  key={path.audience}
                  eyebrow={path.audience}
                  eyebrowTone={path.eyebrowTone}
                  title={path.title}
                  padding="md"
                  className="h-full"
                  headingLevel="h3"
                >
                  <p className="text-sm text-foreground-muted leading-relaxed">
                    {path.description}
                  </p>

                  <div className="mt-6">
                    <PrimaryAction link={path.primary} />
                  </div>

                  <ul className="mt-6 space-y-2 text-sm">
                    {path.supporting.map((link) => (
                      <li key={link.href} className="flex items-start gap-2">
                        <span aria-hidden className="text-mesh mt-0.5">
                          ◊
                        </span>
                        <SupportingLink link={link} />
                      </li>
                    ))}
                  </ul>
                </NetworkPanel>
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
                Already know what you need? Jump straight to the{' '}
                <Link
                  href="/map"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  live network map
                </Link>
                , the{' '}
                <Link
                  href="/tools"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  operator tools
                </Link>
                , or browse every{' '}
                <Link
                  href="/guides"
                  className="text-mesh hover:text-mesh-light underline underline-offset-2"
                >
                  guide
                </Link>
                . Questions are best asked in the{' '}
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { ObserverStats, NetworkHealthCard, TopContributors } from '@/components';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import { OBSERVER_REFRESH_INTERVAL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Denver MeshCore Analyzers',
  description:
    'Live network monitoring for Denver MeshCore. Our analyzers track mesh network status, node activity, signal strength, and network health metrics in real-time across the Colorado Front Range.',
  keywords: [
    'mesh network',
    'analyzer',
    'observer',
    'network monitoring',
    'Denver',
    'MeshCore',
    'LoRa',
    'network health',
    'live stats',
  ],
  alternates: {
    canonical: '/observer',
  },
  openGraph: {
    title: 'Denver MeshCore Analyzers',
    description:
      'Live network monitoring for Denver MeshCore. Track mesh network status and node activity in real-time.',
    url: 'https://denvermc.com/observer',
  },
};

const OBSERVERS = [
  {
    name: '\u{1F47B}CO-DENVER-RUBYHL-OB',
    url: 'https://analyzer.letsmesh.net/node/4D0CC1003DBF678DF420907F9ACD77BD71D9E4C34300F72660F6BA6A2656A868',
  },
  {
    name: 'Meadowood',
    url: 'https://analyzer.letsmesh.net/node/7BC042F4C47C3539BBEF6C2FA520A9553B0C44E8EFEF2A3D90A39BE2FE7C7F4B',
  },
  {
    name: '🦉 CO-LFAYTE-OB01',
    url: 'https://analyzer.letsmesh.net/node/71B12612421B83C340A756240B20B7CCEAFFAA0DD29E3BFF6A4A6D221E9ADE79',
  },
  {
    name: 'CO-CMRCE-TWR+96-OB01',
    url: 'https://analyzer.letsmesh.net/node/D00F58E430E141FB7C617F497A2A386E98903648B75FDFF57D693EA88D226764',
  },
];

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://denvermc.com' },
  { name: 'Analyzers', url: 'https://denvermc.com/observer' },
]);

export default function ObserverPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen bg-mesh">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-16 md:py-24">
          {/* Mesh network background effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-night-950/50 via-transparent to-transparent pointer-events-none" />

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Observer icon */}
            <div className="mb-6 inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse-glow rounded-full" />
                <svg
                  className="h-16 w-16 md:h-20 md:w-20 text-mesh"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Central eye/observer */}
                  <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2" fill="none" />
                  <circle cx="32" cy="32" r="5" fill="currentColor" />
                  {/* Radar rings */}
                  <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="1" opacity="0.5" strokeDasharray="4 4" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />
                  {/* Connection nodes */}
                  <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.7" />
                  <circle cx="52" cy="12" r="3" fill="currentColor" opacity="0.7" />
                  <circle cx="12" cy="52" r="3" fill="currentColor" opacity="0.7" />
                  <circle cx="52" cy="52" r="3" fill="currentColor" opacity="0.7" />
                  <circle cx="32" cy="6" r="2" fill="currentColor" opacity="0.5" />
                  <circle cx="32" cy="58" r="2" fill="currentColor" opacity="0.5" />
                  <circle cx="6" cy="32" r="2" fill="currentColor" opacity="0.5" />
                  <circle cx="58" cy="32" r="2" fill="currentColor" opacity="0.5" />
                  {/* Connection lines */}
                  <line x1="32" y1="32" x2="12" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                  <line x1="32" y1="32" x2="52" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                  <line x1="32" y1="32" x2="12" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                  <line x1="32" y1="32" x2="52" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-mono tracking-tight">
              <span className="text-gradient-mesh">Denver </span>
              <span className="text-mesh">Analyzers</span>
            </h1>

            <p className="text-xl md:text-2xl text-foreground-muted mb-4">
              Live network monitoring for Denver MeshCore
            </p>

            <p className="text-foreground-muted max-w-2xl mx-auto mb-8">
              Our analyzer nodes are dedicated monitoring stations that watch over the Denver mesh network,
              tracking activity, measuring performance, and ensuring network health across the Front Range.
            </p>

            {/* Analyzer CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {OBSERVERS.map((observer) => (
                <a
                  key={observer.name}
                  href={observer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 btn-accent text-lg px-6 py-4 focus-ring"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {observer.name}
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </section>


        {/* What are Analyzers Section */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              What are <span className="text-mesh">Analyzers</span>?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Monitoring */}
              <div className="card-mesh p-6">
                <div className="h-12 w-12 rounded-lg bg-mountain-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-mountain-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Network Monitoring</h3>
                <p className="text-foreground-muted text-sm">
                  Our analyzer nodes continuously monitor network traffic, tracking messages as they propagate
                  through the Denver mesh network. They provide visibility into network activity patterns and
                  communication flows.
                </p>
              </div>

              {/* Performance Tracking */}
              <div className="card-mesh p-6">
                <div className="h-12 w-12 rounded-lg bg-forest-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-forest-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Performance Metrics</h3>
                <p className="text-foreground-muted text-sm">
                  Track signal strength, hop counts, and message delivery rates. The analyzers collect
                  performance data that helps identify network bottlenecks and optimize node placement
                  across the Front Range.
                </p>
              </div>

              {/* Data Collection */}
              <div className="card-mesh p-6">
                <div className="h-12 w-12 rounded-lg bg-sunset-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-sunset-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Data Collection</h3>
                <p className="text-foreground-muted text-sm">
                  Aggregates anonymized network statistics to help the community understand usage patterns.
                  This data drives improvements to the network and helps new operators find optimal
                  locations for their nodes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats Section */}
        <section className="px-6 py-16 bg-night-950/20">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                Live <span className="text-mesh">Stats</span>
              </h2>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                <span aria-live="polite">Live</span>
              </span>
            </div>

            <ObserverStats refreshInterval={OBSERVER_REFRESH_INTERVAL} />

            <p className="text-center text-foreground-muted mt-8 text-sm">
              Statistics auto-refresh every 2 minutes from the Denver mesh network.
            </p>
          </div>
        </section>

        {/* Network Health Section */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                Network <span className="text-mesh">Health</span>
              </h2>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                <span aria-live="polite">Live</span>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <NetworkHealthCard refreshInterval={OBSERVER_REFRESH_INTERVAL} />
              </div>
              <div>
                <TopContributors refreshInterval={OBSERVER_REFRESH_INTERVAL} />
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="px-6 py-16 bg-night-950/30">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Explore <span className="text-mesh">More</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Get Started */}
              <Link
                href="/start"
                className="card-mesh p-6 group hover:border-mesh/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-lg bg-forest-500/20 flex items-center justify-center mb-4 group-hover:bg-mesh/20 transition-colors">
                  <svg
                    className="h-6 w-6 text-forest-500 group-hover:text-mesh transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-mesh transition-colors">
                  Get Started
                </h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Learn how to join the Denver mesh network and set up your own node.
                </p>
                <span className="inline-flex items-center text-sm text-mesh font-medium">
                  Join the Mesh
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>

              {/* LetsMesh */}
              <a
                href="https://letsmesh.net"
                target="_blank"
                rel="noopener noreferrer"
                className="card-mesh p-6 group hover:border-mesh/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-lg bg-sunset-500/20 flex items-center justify-center mb-4 group-hover:bg-mesh/20 transition-colors">
                  <svg
                    className="h-6 w-6 text-sunset-500 group-hover:text-mesh transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-mesh transition-colors">
                  LetsMesh Network
                </h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Visit the main LetsMesh site to learn about the global mesh network.
                </p>
                <span className="inline-flex items-center text-sm text-mesh font-medium">
                  Visit Site
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

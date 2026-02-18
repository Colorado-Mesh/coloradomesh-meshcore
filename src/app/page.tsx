import Link from 'next/link';
import { StatsSection } from '@/components';
import JsonLd from '@/components/JsonLd';
import NamingWizard from '@/components/NamingWizard';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';
import { BASE_URL } from '@/lib/constants';

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
]);

export default function Home() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-mountain-gradient overflow-hidden">
          {/* Mountain Silhouette Background */}
          <div className="absolute inset-0 opacity-20">
            <svg
              className="absolute bottom-0 w-full h-64"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path
                className="text-night-950"
                d="M0,256L48,240C96,224,192,192,288,186.7C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
            <svg
              className="absolute bottom-0 w-full h-48"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path
                className="text-night-900"
                d="M0,288L60,277.3C120,267,240,245,360,234.7C480,224,600,224,720,229.3C840,235,960,245,1080,250.7C1200,256,1320,256,1380,256L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
              />
            </svg>
          </div>

          {/* Mesh Network Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-mesh" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                Denver MeshCore
                <span className="block text-mesh-light">Community</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-mountain-100 max-w-3xl mx-auto mb-10 leading-relaxed">
                Building Colorado&apos;s decentralized mesh network.
                Connect off-grid, stay in touch across the Front Range,
                and help grow our community-powered communication network.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="https://discord.gg/QpaW8FTTCE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl focus-ring text-lg"
                >
                  {/* Discord Icon */}
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Join Our Discord
                </a>
                <Link
                  href="/start"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg border-2 border-white/30 transition-all duration-200 focus-ring text-lg backdrop-blur-sm"
                >
                  Get Started
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Section */}
        <StatsSection />

        {/* Node Name Generator */}
        <section id="naming" className="bg-background-secondary py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Node Name Generator <span className="text-base font-normal text-foreground-muted">v2.0</span>
              </h2>
              <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
                Build a valid name for your <span className="text-mesh font-semibold">repeater or room server</span> following our naming standard. All names are limited to 23 characters.
              </p>
            </div>
            <NamingWizard />
          </div>
        </section>

        {/* Mission Statement */}
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg sm:text-xl text-foreground-muted leading-relaxed mb-8">
                Denver MeshCore is a community-driven initiative to build a robust,
                decentralized mesh network across the Colorado Front Range. We believe
                in creating resilient communication infrastructure that works
                when traditional networks can&apos;t.
              </p>
              <div className="bg-card border border-card-border rounded-xl p-6 sm:p-8 text-left">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg
                    className="h-6 w-6 text-mesh"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  What is MeshCore?
                </h3>
                <p className="text-foreground-muted leading-relaxed">
                  MeshCore is an open-source mesh networking protocol designed for LoRa radios.
                  It enables peer-to-peer communication without relying on cellular networks,
                  WiFi, or internet connectivity. Whether you&apos;re hiking in the mountains,
                  responding to emergencies, or just want to explore off-grid communication,
                  MeshCore provides a reliable way to stay connected with your community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features/Benefits Grid */}
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Why Join Denver MeshCore?
              </h2>
              <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
                Be part of Colorado&apos;s growing mesh network community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Off-Grid Communication */}
              <div className="card-mesh p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-sunset-500/10 flex items-center justify-center">
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
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Off-Grid Communication
                    </h3>
                    <p className="text-foreground-muted leading-relaxed">
                      Stay connected in the backcountry, during power outages, or anywhere
                      cellular service doesn&apos;t reach. No internet or cell towers required.
                    </p>
                  </div>
                </div>
              </div>

              {/* Community-Powered */}
              <div className="card-mesh p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-forest-500/10 flex items-center justify-center">
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Community-Powered Network
                    </h3>
                    <p className="text-foreground-muted leading-relaxed">
                      Every node strengthens the network. Join a growing community of
                      enthusiasts, makers, and preparedness-minded Coloradans building
                      infrastructure together.
                    </p>
                  </div>
                </div>
              </div>

              {/* Open Source */}
              <div className="card-mesh p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-mountain-500/10 flex items-center justify-center">
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
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Open Source Technology
                    </h3>
                    <p className="text-foreground-muted leading-relaxed">
                      Built on open protocols and affordable hardware. No vendor lock-in,
                      no subscriptions, no corporate gatekeepers. The network belongs to
                      the community.
                    </p>
                  </div>
                </div>
              </div>

              {/* Colorado Coverage */}
              <div className="card-mesh p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-mesh/10 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-mesh"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Colorado Coverage
                    </h3>
                    <p className="text-foreground-muted leading-relaxed">
                      From Denver to the mountain peaks. We&apos;re building coverage across
                      the Front Range, with nodes in Denver, Boulder, Golden, and beyond.
                      See our live network map.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discord CTA Section */}
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Join Our Community
              </h2>
              <p className="text-lg sm:text-xl text-mountain-100 max-w-2xl mx-auto mb-8 leading-relaxed">
                Connect with fellow mesh enthusiasts, get help setting up your node,
                share your experiences, and stay updated on network developments.
              </p>
              <a
                href="https://discord.gg/QpaW8FTTCE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 focus-ring text-lg shadow-lg hover:shadow-xl"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Join Denver MeshCore Discord
              </a>
              <p className="text-sm text-mountain-300 mt-4">
                Free to join. No experience required.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

import Link from 'next/link';
import BrandMark from './brand/BrandMark';
import {
  COMMUNITY_NAME,
  DISCORD_INVITE_URL,
  GITHUB_ORG_URL,
  LETSMESH_URL,
  MESHCORE_DOCS_URL,
  SITE_NAME,
} from '@/lib/constants';

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
  icon?: 'discord' | 'github';
}

const quickLinks: FooterLink[] = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Live Map' },
  { href: '/tools', label: 'Tools' },
  { href: '/guides', label: 'Guides' },
  { href: '/guides/getting-started', label: 'Getting Started' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

const communityLinks: FooterLink[] = [
  { href: DISCORD_INVITE_URL, label: 'Discord', icon: 'discord', external: true },
  { href: GITHUB_ORG_URL, label: 'Colorado-Mesh on GitHub', icon: 'github', external: true },
];

const resourceLinks: FooterLink[] = [
  { href: MESHCORE_DOCS_URL, label: 'MeshCore docs', external: true },
  { href: LETSMESH_URL, label: 'LetsMesh', external: true },
];

function ExternalGlyph() {
  return (
    <svg
      className="h-3 w-3"
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
  );
}

function DiscordGlyph() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function GithubGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function FooterIcon({ icon }: { icon?: FooterLink['icon'] }) {
  if (icon === 'discord') return <DiscordGlyph />;
  if (icon === 'github') return <GithubGlyph />;
  return null;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-night-950 text-snow-100 border-t border-card-border" role="contentinfo">
      <div className="relative h-16 -mt-px overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-full text-night-900"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,120 L0,60 L100,80 L200,40 L300,70 L400,30 L500,60 L600,20 L700,50 L800,35 L900,55 L1000,25 L1100,45 L1200,30 L1200,120 Z"
            fill="currentColor"
          />
        </svg>
        <svg
          className="absolute bottom-0 w-full h-full text-night-800"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,120 L0,80 L150,90 L250,60 L350,85 L450,50 L550,75 L650,45 L750,70 L850,55 L950,80 L1050,60 L1150,75 L1200,65 L1200,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <BrandMark size="lg" href="/" tone="inverse" />
            <p className="mt-5 text-snow-300 text-sm leading-relaxed max-w-sm">
              A volunteer-run LoRa mesh stretching across Colorado&apos;s Front Range.
              Off-grid messaging, open firmware, and a community that&apos;s patient
              with first-timers.
            </p>

            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 btn-accent focus-ring"
              aria-label={`Join the ${SITE_NAME} Discord`}
            >
              <DiscordGlyph />
              Join Discord
            </a>
          </div>

          <div>
            <h3 className="metric-label text-snow-300">Quick Links</h3>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-snow-300 hover:text-mesh transition-colors duration-200 focus-ring rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="metric-label text-snow-300">Community</h3>
            <ul className="mt-4 space-y-3">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-2 text-snow-300 hover:text-mesh transition-colors duration-200 focus-ring rounded-sm"
                    {...(link.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    })}
                  >
                    <FooterIcon icon={link.icon} />
                    <span>{link.label}</span>
                    {link.external && <ExternalGlyph />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="metric-label text-snow-300">Resources</h3>
            <ul className="mt-4 space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-2 text-snow-300 hover:text-mesh transition-colors duration-200 focus-ring rounded-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{link.label}</span>
                    <ExternalGlyph />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-night-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-snow-400">
              &copy; {currentYear} {COMMUNITY_NAME} community. Open infrastructure for everyone on the Front Range.
            </p>

            <a
              href={GITHUB_ORG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-snow-400 hover:text-mesh transition-colors duration-200 focus-ring rounded-sm"
            >
              <GithubGlyph className="h-5 w-5" />
              Open source on GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

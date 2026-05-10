import type { MetadataRoute } from 'next';

export type SiteSection = 'home' | 'start' | 'map' | 'tools' | 'guides' | 'learn' | 'about';
export type FooterGroupKey = 'explore' | 'tools' | 'learn';
export type SitemapChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

export interface SiteSitemapMetadata {
  changeFrequency: SitemapChangeFrequency;
  priority: number;
}

export interface SiteRoute {
  path: `/${string}`;
  label: string;
  description?: string;
  navLabel?: string;
  section: SiteSection;
  parent?: `/${string}`;
  primaryNavOrder?: number;
  footerGroup?: FooterGroupKey;
  criticalTestOrder?: number;
  sitemap: false | SiteSitemapMetadata;
}

export interface SiteLink {
  href: SiteRoute['path'];
  label: string;
  description?: string;
}

export interface FooterRouteGroup {
  key: FooterGroupKey;
  label: string;
  links: SiteLink[];
}

export const SITE_ROUTES: readonly SiteRoute[] = [
  {
    path: '/',
    label: 'Home',
    description: 'Colorado MeshCore community network overview and entry paths.',
    section: 'home',
    criticalTestOrder: 1,
    sitemap: { changeFrequency: 'weekly', priority: 1 },
  },
  {
    path: '/start',
    label: 'Get Started',
    description: 'Choose the right first path for joining, operating, or learning about the network.',
    section: 'start',
    primaryNavOrder: 1,
    footerGroup: 'explore',
    criticalTestOrder: 2,
    sitemap: { changeFrequency: 'weekly', priority: 0.9 },
  },
  {
    path: '/map',
    label: 'Live Map',
    description: 'View current Colorado MeshCore network coverage and node context.',
    section: 'map',
    primaryNavOrder: 2,
    footerGroup: 'explore',
    criticalTestOrder: 3,
    sitemap: { changeFrequency: 'daily', priority: 0.7 },
  },
  {
    path: '/tools',
    label: 'Tools',
    description: 'Operator utilities for naming, prefix planning, repeater setup, and serial USB settings.',
    section: 'tools',
    primaryNavOrder: 3,
    footerGroup: 'explore',
    criticalTestOrder: 4,
    sitemap: { changeFrequency: 'monthly', priority: 0.75 },
  },
  {
    path: '/tools/repeater-name',
    label: 'Repeater Name Generator',
    description: 'Generate repeater names that match the Colorado Mesh naming standard.',
    section: 'tools',
    parent: '/tools',
    footerGroup: 'tools',
    sitemap: { changeFrequency: 'monthly', priority: 0.7 },
  },
  {
    path: '/tools/companion-name',
    label: 'Companion Name Generator',
    description: 'Generate companion node names for phones, tablets, and client devices.',
    section: 'tools',
    parent: '/tools',
    footerGroup: 'tools',
    sitemap: { changeFrequency: 'monthly', priority: 0.7 },
  },
  {
    path: '/tools/prefix-matrix',
    label: 'Prefix Matrix',
    description: 'Search and reserve location-aware prefixes for repeaters and network planning.',
    section: 'tools',
    parent: '/tools',
    footerGroup: 'tools',
    sitemap: { changeFrequency: 'monthly', priority: 0.7 },
  },
  {
    path: '/tools/serial-usb',
    label: 'Serial USB Setup',
    description: 'Preview and apply serial USB settings for MeshCore devices.',
    section: 'tools',
    parent: '/tools',
    footerGroup: 'tools',
    sitemap: { changeFrequency: 'monthly', priority: 0.7 },
  },
  {
    path: '/guides',
    label: 'Guides',
    description: 'Plain-language setup, operator, and troubleshooting guides.',
    section: 'guides',
    primaryNavOrder: 4,
    footerGroup: 'explore',
    criticalTestOrder: 5,
    sitemap: { changeFrequency: 'weekly', priority: 0.8 },
  },
  {
    path: '/guides/getting-started',
    label: 'Getting Started Guide',
    description: 'Set up a first device and send initial messages on the network.',
    section: 'guides',
    parent: '/guides',
    sitemap: { changeFrequency: 'monthly', priority: 0.75 },
  },
  {
    path: '/guides/radio-settings',
    label: 'Radio Settings & Channels',
    description: 'Understand the radio settings and channel choices used by Colorado MeshCore.',
    section: 'guides',
    parent: '/guides',
    sitemap: { changeFrequency: 'monthly', priority: 0.75 },
  },
  {
    path: '/guides/repeater-setup',
    label: 'Repeater Setup Guide',
    description: 'Configure and tune repeater installs for Colorado MeshCore coverage.',
    section: 'guides',
    parent: '/guides',
    sitemap: { changeFrequency: 'monthly', priority: 0.75 },
  },
  {
    path: '/guides/naming-standard',
    label: 'Naming Standard',
    description: 'Learn the naming rules for repeaters, companions, and location prefixes.',
    section: 'guides',
    parent: '/guides',
    sitemap: { changeFrequency: 'monthly', priority: 0.75 },
  },
  {
    path: '/guides/troubleshooting',
    label: 'Troubleshooting Guide',
    description: 'Diagnose common MeshCore setup, connectivity, and field-use issues.',
    section: 'guides',
    parent: '/guides',
    sitemap: { changeFrequency: 'monthly', priority: 0.75 },
  },
  {
    path: '/learn',
    label: 'Learn',
    description: 'Hub for everything to learn about MeshCore — why it exists, how it is used, and field notes.',
    section: 'learn',
    primaryNavOrder: 5,
    footerGroup: 'learn',
    sitemap: { changeFrequency: 'weekly', priority: 0.6 },
  },
  {
    path: '/why-meshcore',
    label: 'Why MeshCore',
    description: 'Learn why MeshCore is useful for community, field, and resilient communications.',
    section: 'learn',
    footerGroup: 'learn',
    sitemap: { changeFrequency: 'weekly', priority: 0.85 },
  },
  {
    path: '/use-cases',
    label: 'Use Cases',
    description: 'Explore practical MeshCore use cases for communities, emergencies, and off-grid settings.',
    section: 'learn',
    footerGroup: 'learn',
    sitemap: { changeFrequency: 'weekly', priority: 0.8 },
  },
  {
    path: '/blog',
    label: 'Blog',
    description: 'Updates, announcements, and field notes from Colorado MeshCore.',
    section: 'learn',
    footerGroup: 'learn',
    sitemap: { changeFrequency: 'weekly', priority: 0.85 },
  },
  {
    path: '/about',
    label: 'About',
    description: 'About the Colorado MeshCore project and community.',
    section: 'about',
    primaryNavOrder: 6,
    footerGroup: 'explore',
    criticalTestOrder: 6,
    sitemap: { changeFrequency: 'monthly', priority: 0.8 },
  },
] as const;

const FOOTER_GROUPS: readonly { key: FooterGroupKey; label: string }[] = [
  { key: 'explore', label: 'Explore' },
  { key: 'tools', label: 'Tools' },
  { key: 'learn', label: 'Learn' },
];

const routeByPath = new Map(SITE_ROUTES.map((route) => [route.path, route]));

function toSiteLink(route: SiteRoute): SiteLink {
  return {
    href: route.path,
    label: route.navLabel ?? route.label,
    description: route.description,
  };
}

function sitemapUrl(baseUrl: string, routePath: SiteRoute['path']): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  return routePath === '/' ? normalizedBaseUrl : `${normalizedBaseUrl}${routePath}`;
}

export function getSiteRoute(path: string): SiteRoute | undefined {
  return routeByPath.get(path as SiteRoute['path']);
}

export function getPublicSiteRoutes(): SiteRoute[] {
  return [...SITE_ROUTES];
}

export function getPublicSiteRoutePaths(): SiteRoute['path'][] {
  return SITE_ROUTES.map((route) => route.path);
}

export function getPrimaryNavLinks(): SiteLink[] {
  return SITE_ROUTES.filter((route) => typeof route.primaryNavOrder === 'number')
    .sort((a, b) => Number(a.primaryNavOrder) - Number(b.primaryNavOrder))
    .map(toSiteLink);
}

export function getFooterRouteGroups(): FooterRouteGroup[] {
  return FOOTER_GROUPS.map((group) => ({
    ...group,
    links: SITE_ROUTES.filter((route) => route.footerGroup === group.key).map((route) => ({
      href: route.path,
      label: route.label,
      description: route.description,
    })),
  })).filter((group) => group.links.length > 0);
}

export function getCriticalTestRoutes(): SiteRoute['path'][] {
  return SITE_ROUTES.filter((route) => typeof route.criticalTestOrder === 'number')
    .sort((a, b) => Number(a.criticalTestOrder) - Number(b.criticalTestOrder))
    .map((route) => route.path);
}

function pathMatchesRoute(pathname: string, routePath: string): boolean {
  if (routePath === '/') return pathname === '/';
  if (pathname === routePath) return true;
  return pathname.startsWith(`${routePath}/`);
}

export function isPrimaryNavLinkActive(href: string, pathname: string): boolean {
  const navRoute = getSiteRoute(href);
  if (!navRoute) {
    return pathMatchesRoute(pathname, href);
  }

  if (navRoute.section === 'home') {
    return pathname === '/';
  }

  return SITE_ROUTES
    .filter((route) => route.section === navRoute.section)
    .some((route) => pathMatchesRoute(pathname, route.path));
}

export function getBreadcrumbTrail(path: string): SiteLink[] {
  const route = getSiteRoute(path);

  if (!route) {
    return [];
  }

  const trail: SiteRoute[] = [];
  const visited = new Set<string>();
  let current: SiteRoute | undefined = route;

  while (current && !visited.has(current.path)) {
    trail.unshift(current);
    visited.add(current.path);
    current = current.parent ? getSiteRoute(current.parent) : undefined;
  }

  const home = getSiteRoute('/');
  if (home && route.path !== '/' && trail[0]?.path !== '/') {
    trail.unshift(home);
  }

  return trail.map((trailRoute) => ({
    href: trailRoute.path,
    label: trailRoute.label,
    description: trailRoute.description,
  }));
}

export function getStaticSitemapRoutes(
  baseUrl: string,
  lastModified: Date,
): MetadataRoute.Sitemap {
  return SITE_ROUTES.filter((route) => route.sitemap !== false).map((route) => ({
    url: sitemapUrl(baseUrl, route.path),
    lastModified,
    changeFrequency: route.sitemap === false ? undefined : route.sitemap.changeFrequency,
    priority: route.sitemap === false ? undefined : route.sitemap.priority,
  }));
}

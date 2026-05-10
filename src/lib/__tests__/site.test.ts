import { describe, expect, it } from 'vitest';

import {
  getBreadcrumbTrail,
  getCriticalTestRoutes,
  getFooterRouteGroups,
  getPrimaryNavLinks,
  getPublicSiteRoutes,
  getSiteRoute,
  getStaticSitemapRoutes,
  SITE_ROUTES,
} from '../site';

const VISIBLE_SITEMAP_PATHS = [
  '/',
  '/start',
  '/map',
  '/tools',
  '/tools/repeater-name',
  '/tools/companion-name',
  '/tools/prefix-matrix',
  '/tools/serial-usb',
  '/guides',
  '/guides/getting-started',
  '/guides/radio-settings',
  '/guides/repeater-setup',
  '/guides/naming-standard',
  '/guides/troubleshooting',
  '/why-meshcore',
  '/use-cases',
  '/blog',
  '/about',
] as const;

describe('site route metadata', () => {
  it('uses unique absolute route paths', () => {
    const paths = SITE_ROUTES.map((route) => route.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith('/'))).toBe(true);
  });

  it('only references existing parent paths', () => {
    const paths = new Set(SITE_ROUTES.map((route) => route.path));

    for (const route of SITE_ROUTES) {
      if (route.parent) {
        expect(paths.has(route.parent)).toBe(true);
      }
    }
  });

  it('returns the approved primary navigation labels in order', () => {
    expect(getPrimaryNavLinks().map((link) => link.label)).toEqual([
      'Get Started',
      'Live Map',
      'Tools',
      'Guides',
      'Learn',
      'About',
    ]);
  });

  it('includes visible guide and use-case routes in static sitemap output', () => {
    const entries = getStaticSitemapRoutes('https://coloradomesh.org/', new Date('2026-02-16'));
    const paths = entries.map((entry) => new URL(entry.url).pathname);

    expect(paths).toEqual(expect.arrayContaining([...VISIBLE_SITEMAP_PATHS]));
    expect(paths).not.toContain('/use-cases/community-networks');
    expect(paths).not.toContain('/blog/example-post');
  });

  it('normalizes the home sitemap URL without a trailing slash', () => {
    const entries = getStaticSitemapRoutes('https://coloradomesh.org/', new Date('2026-02-16'));

    expect(entries[0]?.url).toBe('https://coloradomesh.org');
  });

  it('looks up routes and returns breadcrumb chains', () => {
    expect(getSiteRoute('/guides/repeater-setup')).toEqual(
      expect.objectContaining({
        label: 'Repeater Setup Guide',
        parent: '/guides',
      }),
    );
    expect(getSiteRoute('/missing')).toBeUndefined();

    expect(getBreadcrumbTrail('/guides/repeater-setup').map((link) => link.href)).toEqual([
      '/',
      '/guides',
      '/guides/repeater-setup',
    ]);
  });

  it('derives footer groups and critical test routes from metadata', () => {
    expect(getFooterRouteGroups().map((group) => group.key)).toEqual(['explore', 'tools', 'learn']);
    expect(getCriticalTestRoutes()).toEqual(['/', '/start', '/map', '/tools', '/guides', '/about']);
    expect(getPublicSiteRoutes()).toHaveLength(SITE_ROUTES.length);
  });
});

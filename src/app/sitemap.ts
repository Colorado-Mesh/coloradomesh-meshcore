import fs from 'fs';
import path from 'path';
import { MetadataRoute } from 'next';
import { getPostBySlug, getPostSlugs, getAllTags } from '@/lib/blog';
import { BASE_URL } from '@/lib/constants';
import { getStaticSitemapRoutes } from '@/lib/site';

const STATIC_LAST_EDITED = new Date('2026-02-16');

function getUseCaseSlugs(): string[] {
  const useCasesDir = path.join(process.cwd(), 'src/app/use-cases');

  try {
    if (!fs.existsSync(useCasesDir)) {
      return [];
    }

    return fs
      .readdirSync(useCasesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = getStaticSitemapRoutes(BASE_URL, STATIC_LAST_EDITED);

  const useCaseSlugs = getUseCaseSlugs();
  const useCasePages: MetadataRoute.Sitemap = useCaseSlugs.map((slug) => ({
    url: `${BASE_URL}/use-cases/${slug}`,
    lastModified: STATIC_LAST_EDITED,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const blogSlugs = getPostSlugs();
  const blogPages: MetadataRoute.Sitemap = blogSlugs
    .map((slug) => {
      const post = getPostBySlug(slug);
      if (!post || !post.published) return null;
      return {
        url: `${BASE_URL}/blog/${slug}`,
        lastModified: new Date(post.dateModified || post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const tags = getAllTags();
  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${BASE_URL}/blog/tag/${encodeURIComponent(tag.toLowerCase())}`,
    lastModified: STATIC_LAST_EDITED,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...useCasePages, ...blogPages, ...tagPages];
}

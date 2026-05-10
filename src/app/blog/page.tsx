import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { BASE_URL, COMMUNITY_NAME, SITE_NAME } from '@/lib/constants';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { HeroPanel, SectionEyebrow } from '@/components/brand';
import { generateBreadcrumbSchema } from '@/lib/schemas/breadcrumb';

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Blog', url: `${BASE_URL}/blog` },
]);

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'News, tutorials, and updates from the Colorado MeshCore community. Learn about mesh networking, MeshCore technology, and community events.',
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    title: `Blog | ${SITE_NAME}`,
    description:
      'News, tutorials, and updates from the Colorado MeshCore community.',
    url: `${BASE_URL}/blog`,
    type: 'website',
  },
};

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
}

export default function BlogPage() {
  const posts = getAllPosts();

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    description:
      'News, tutorials, and updates from the Colorado MeshCore community. Operator field notes, hardware reviews, and announcements.',
    url: `${BASE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      description: post.excerpt,
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={blogSchema} />
      <div className="min-h-screen">
      <HeroPanel
        background="topo-grid"
        showMountains={false}
        eyebrow={`${COMMUNITY_NAME} · Blog`}
        eyebrowTone="sky"
        title={
          <>
            Field notes &amp;
            <span className="block text-mesh">network updates</span>
          </>
        }
        description="News, tutorials, and updates from the Colorado MeshCore community. Operator field notes, hardware reviews, and announcements."
        actions={
          <>
            <Link href="/start" className="btn-primary">
              Get Started
            </Link>
            <Link href="/map" className="btn-secondary">
              Live Map
            </Link>
            <Link href="/guides" className="btn-outline">
              Guides
            </Link>
          </>
        }
        meta={
          <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
          </div>
        }
      />

      <section className="px-4 sm:px-6 lg:px-8 pb-24 -mt-10">
        <div className="mx-auto max-w-4xl">
          {posts.length === 0 ? (
            <div className="panel p-10 sm:p-14 text-center">
              <SectionEyebrow tone="sky" className="justify-center">
                Coming soon
              </SectionEyebrow>
              <h2 className="mt-4 text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Posts inbound.
              </h2>
              <p className="mt-3 text-foreground-muted max-w-md mx-auto">
                We&apos;re working on great content. Check back soon for news, tutorials, and
                updates from the {COMMUNITY_NAME} community.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group panel p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Link href={`/blog/${post.slug}`} className="block focus-ring rounded-md">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs mono uppercase tracking-[0.18em] text-foreground-dim">
                          <time dateTime={post.date}>{formatDate(post.date)}</time>
                          <span aria-hidden>·</span>
                          <span>{post.readingTime}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight group-hover:text-mesh transition-colors">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-foreground-muted leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="hidden sm:block shrink-0">
                        <span className="inline-flex items-center gap-1 text-sm text-mesh group-hover:text-mesh-light">
                          Read
                          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}
                          className="tag-mono hover:border-mesh/50 hover:text-mesh transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </>
  );
}

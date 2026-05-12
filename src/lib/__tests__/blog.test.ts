import { describe, expect, it } from 'vitest';

import { getAllPosts, getPostBySlug, getPostSlugs } from '../blog';

describe('blog content loader', () => {
  it('loads posts from both canonical content directories', () => {
    expect(getPostSlugs()).toEqual(expect.arrayContaining([
      'network-expansion-2026',
      'getting-started-meshcore-denver',
    ]));
  });

  it('returns posts from the root content directory as published posts', () => {
    expect(getPostBySlug('denver-network-coverage-update')).toEqual(expect.objectContaining({
      slug: 'denver-network-coverage-update',
      published: true,
    }));
    expect(getAllPosts().map((post) => post.slug)).toContain('denver-network-coverage-update');
  });
});

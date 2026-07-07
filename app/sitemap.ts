import type { MetadataRoute } from 'next'
import { blogApi, podcastApi } from '@/lib/api'
import { SITE_URL, slugify, toList } from '@/lib/site'

// Regenerated on request; degrades to the static routes if the API is down.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/podcasts`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/register`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/refund`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const [posts, episodes] = await Promise.all([
    blogApi.list({ status: 'published' }).then(toList).catch(() => []),
    podcastApi.list({ status: 'published' }).then(toList).catch(() => []),
  ])

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p: any) => ({
    url: `${SITE_URL}/blog/${p.slug ?? slugify(p.title)}`,
    lastModified: p.updated_at ?? p.published_at ?? p.created_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const podcastRoutes: MetadataRoute.Sitemap = episodes.map((e: any) => ({
    url: `${SITE_URL}/podcasts/${e.slug ?? slugify(e.title)}`,
    lastModified: e.updated_at ?? e.published_at ?? e.created_at,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes, ...podcastRoutes]
}

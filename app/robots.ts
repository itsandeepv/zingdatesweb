import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the app + admin surfaces out of the index.
      disallow: ['/admin', '/discover', '/matches', '/chat', '/call', '/profile', '/notifications', '/plans', '/companion'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

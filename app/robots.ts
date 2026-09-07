import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the app + admin surfaces out of the index.
      //
      // The companion rules are split on purpose: a bare '/companion' is a
      // prefix match, so it would also block the PUBLIC marketing page at
      // '/companions'. '$' pins the signed-in feed exactly, and '/companion/'
      // covers its sub-routes, leaving '/companions' crawlable.
      disallow: [
        '/admin', '/discover', '/matches', '/chat', '/call',
        '/profile', '/notifications', '/plans',
        '/companion$', '/companion/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

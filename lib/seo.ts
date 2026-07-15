/* Centralised Schema.org structured-data builders for the public site.
 *
 * Keeping these in one place means every page emits consistent JSON-LD and new
 * pages can drop in a schema with one import. Rendered via <JsonLd/>.
 *
 * IMPORTANT: only mark up what is actually visible on the page — never fabricate
 * ratings/reviews (Google penalises self-serving or invisible review markup).
 */
import { SITE_URL, SITE_NAME } from './site'

const ORG_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

/** The brand — powers the knowledge panel, logo, and links every other node back here. */
export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo-full.png`,
    },
    image: `${SITE_URL}/og-image.jpg`,
    description:
      'zingDates is a social networking platform to meet your future partner and book verified companions through local events, real-time chat, and video calls.',
  }
}

/** The website node — enables sitelinks and ties pages to the brand. */
export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  }
}

/** Describes the mobile app itself — eligible for the app rich result. */
export function mobileAppSchema() {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#app`,
    name: SITE_NAME,
    operatingSystem: 'Android, iOS',
    applicationCategory: 'SocialNetworkingApplication',
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      'Meet new people nearby, match, chat, and connect over HD voice & video calls — or book a verified companion. Free to download.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    publisher: { '@id': ORG_ID },
  }
}

/** A breadcrumb trail. Pass ordered [{name, url}] items (last = current page). */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

/** Wrap one or more schema nodes into a single @graph document. */
export function graph(...nodes: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  }
}

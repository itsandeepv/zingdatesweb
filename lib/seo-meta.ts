/**
 * Admin-managed page metadata.
 *
 * Everything an admin saves in /admin/seo is stored server-side in `seo_pages`
 * and served by the public `GET /seo/{slug}` endpoint. Public pages call
 * `pageMetadata()` from `generateMetadata()` so titles, descriptions, keywords,
 * OG cards, and geo tags come from the panel rather than from source.
 *
 * Anything the admin leaves blank falls back to the page's built-in copy, so a
 * half-filled row never blanks out a page's SEO — and if the API is unreachable
 * the site still builds and renders with its defaults.
 */
import type { Metadata } from 'next'
import { SITE_URL } from './site'

// Hardcoded for the same reason as lib/api.ts — see the note there before
// making this configurable again.
const API = 'https://api.zingdates.com/api'

/** Minutes the fetched meta is cached before Next revalidates it in the background. */
const REVALIDATE_SECONDS = 300

/** Slugs seeded in `seo_pages` — one per public page the panel can control. */
export type SeoSlug =
  | 'home' | 'about' | 'blog' | 'podcasts'
  | 'pricing' | 'contact' | 'privacy' | 'terms'
  // Has no seo_pages row yet — the endpoint returns null and the page keeps its
  // built-in defaults until a row is added.
  | 'companions'

export interface SeoPage {
  slug: string
  url: string
  title: string | null
  description: string | null
  keywords: string | null
  og_title: string | null
  og_description: string | null
  og_image: string | null
  geo_region: string | null
  geo_placename: string | null
  geo_position: string | null       // "lat;lng"
}

/** Blank strings count as "not set" — the panel saves '' for cleared fields. */
function value(v?: string | null) {
  const s = v?.trim()
  return s ? s : undefined
}

/** Absolute-ise an admin-supplied image path so OG cards resolve off-site. */
function imageUrl(v?: string | null) {
  const s = value(v)
  if (!s) return undefined
  return /^https?:\/\//i.test(s) ? s : `${SITE_URL}${s.startsWith('/') ? '' : '/'}${s}`
}

/**
 * Fetch one page's admin meta. Never throws: SEO must not be able to break a
 * page render, so any failure resolves to null and the caller uses fallbacks.
 */
export async function fetchSeoPage(slug: SeoSlug): Promise<SeoPage | null> {
  try {
    const res = await fetch(`${API}/seo/${slug}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['seo', `seo:${slug}`] },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? null) as SeoPage | null
  } catch {
    return null
  }
}

export interface SeoFallback {
  title: string
  description: string
  /** Defaults to `/og-image.jpg`. */
  image?: string
  /** Path for the canonical URL, e.g. "/about". Defaults to "/". */
  path?: string
}

/**
 * Build a Next `Metadata` object for a public page, admin values winning over
 * the page's own defaults field by field.
 */
export async function pageMetadata(slug: SeoSlug, fallback: SeoFallback): Promise<Metadata> {
  const seo = await fetchSeoPage(slug)
  const path = fallback.path ?? '/'

  const title = value(seo?.title) ?? fallback.title
  const description = value(seo?.description) ?? fallback.description
  const ogTitle = value(seo?.og_title) ?? title
  const ogDescription = value(seo?.og_description) ?? description
  const image = imageUrl(seo?.og_image) ?? fallback.image ?? '/og-image.jpg'

  const keywords = value(seo?.keywords)
    ?.split(',')
    .map(k => k.trim())
    .filter(Boolean)

  // Geo tags have no first-class Next field — they go through `other`.
  const other: Record<string, string> = {}
  const region = value(seo?.geo_region)
  const placename = value(seo?.geo_placename)
  const position = value(seo?.geo_position)
  if (region) other['geo.region'] = region
  if (placename) other['geo.placename'] = placename
  if (position) {
    other['geo.position'] = position
    other['ICBM'] = position.replace(';', ', ')
  }

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: `${SITE_URL}${path === '/' ? '' : path}` },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      images: [{ url: image, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [image],
    },
    ...(Object.keys(other).length ? { other } : {}),
  }
}

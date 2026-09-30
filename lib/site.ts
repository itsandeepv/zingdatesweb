/* Shared constants + helpers for public (SEO-facing) pages. */

// Absolute origin used for canonical URLs, Open Graph, and the sitemap.
// Set NEXT_PUBLIC_SITE_URL in production (e.g. https://zingdates.com).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zingdates.com'
).replace(/\/$/, '')

export const SITE_NAME = 'zingDates'

/** Official social profiles — footer icons and the Organization schema's sameAs. */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/zingdates/',
  facebook:  'https://www.facebook.com/profile.php?id=61594014257270',
} as const

/** Google Play listing for the ZingDates Android app. */
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.zingdates.app'

/** Turn a title into a URL-safe slug (mirrors the admin CMS slug preview). */
export function slugify(str: string) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function fmtDate(s?: string | null) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Date AND time — "15 Mar 2026, 2:30 pm".
 *
 * For the lists where "when" means the moment, not the day: two accounts that
 * signed up on the same date are indistinguishable without it, and the order
 * they are listed in looks arbitrary.
 */
export function fmtDateTime(s?: string | null) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/** Just the clock part, for a cell that already shows the date above it. */
export function fmtTime(s?: string | null) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Rough reading time from a body of text/HTML. */
export function readingTime(text?: string | null) {
  const words = (text || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Format seconds (or an "mm:ss" string) into a human duration. */
export function fmtDuration(v?: number | string | null) {
  if (v == null || v === '') return ''
  if (typeof v === 'string') return v
  const m = Math.floor(v / 60)
  const s = Math.round(v % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Normalise a Laravel paginated / wrapped list response into a plain array. */
export function toList(res: any): any[] {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  return []
}

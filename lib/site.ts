/* Shared constants + helpers for public (SEO-facing) pages. */

// Absolute origin used for canonical URLs, Open Graph, and the sitemap.
// Set NEXT_PUBLIC_SITE_URL in production (e.g. https://zingdates.com).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zingdates.com'
).replace(/\/$/, '')

export const SITE_NAME = 'zingDates'

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

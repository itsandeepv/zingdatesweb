import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import EventSearch from '@/components/EventSearch'
import { publicEventApi, type PublicEvent, type PublicPastEvent, type PublicEventReview } from '@/lib/api'
import { pageMetadata } from '@/lib/seo-meta'

export const revalidate = 120

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('events', {
    title: 'Events Near You — Meet People, Join Experiences',
    description:
      'Find ZingDates events happening near you — night outs, weekend trips, food, sports and more. See who is hosting, how many have joined, and book your spot.',
    path: '/events',
  })
}

function formatWhen(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit',
  })
}

/* A chip's link: swap the category but keep whatever is being searched for. */
function chipHref(category: string | null, search?: string) {
  const p = new URLSearchParams()
  if (category) p.set('category', category)
  if (search) p.set('search', search)
  const qs = p.toString()
  return qs ? `/events?${qs}` : '/events'
}

function EventCard({ e }: { e: PublicEvent }) {
  return (
    <Link
      href={`/events/${e.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="relative h-44 bg-gradient-to-br from-pink-400 to-purple-600">
        {e.cover_url && (
          // Covers come from Cloudinary or the app's own storage, so this is
          // a plain img rather than next/image — the host list would have to
          // be kept in sync with whatever the app uploads to.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        {e.is_live ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE NOW
          </span>
        ) : e.is_full ? (
          <span className="absolute top-3 left-3 bg-gray-900/80 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Full
          </span>
        ) : null}
        {e.category_label && (
          <span className="absolute top-3 right-3 bg-white/90 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {e.category_label}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">
          {e.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{e.summary}</p>

        <dl className="mt-3 space-y-1 text-sm text-gray-600">
          {!!e.location_name && <dd>📍 {e.location_name}</dd>}
          {!!e.starts_at && <dd>📅 {formatWhen(e.starts_at)}</dd>}
          <dd>👥 {e.participants_count}/{e.capacity} joined</dd>
        </dl>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {e.host_name ? `by ${e.host_name}` : ''}
            {e.host_verified ? ' ✓' : ''}
          </span>
          <span className="font-bold text-gray-900">
            {e.is_free ? 'Free' : `₹${e.price}`}
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Ratings ─────────────────────────────────────────── */
function Stars({ value, size = 'text-sm' }: { value: number; size?: string }) {
  const full = Math.round(value)
  return (
    <span className={`inline-flex items-center gap-0.5 ${size} leading-none`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= full ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

function ReviewQuote({ r }: { r: PublicEventReview }) {
  return (
    <figure className="flex gap-2.5">
      {r.reviewer_photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.reviewer_photo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <span className="w-7 h-7 rounded-full gradient-brand text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {r.reviewer_name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <figcaption className="text-xs font-semibold text-gray-800">{r.reviewer_name}</figcaption>
          <Stars value={r.rating} size="text-[11px]" />
        </div>
        <blockquote className="text-sm text-gray-600 mt-0.5 line-clamp-2">&ldquo;{r.comment}&rdquo;</blockquote>
      </div>
    </figure>
  )
}

function PastEventCard({ e }: { e: PublicPastEvent }) {
  return (
    <Link
      href={`/events/${e.id}#reviews`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="relative h-36 bg-gradient-to-br from-gray-500 to-gray-800">
        {e.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        <span className="absolute top-3 left-3 bg-gray-900/80 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          Completed
        </span>
        {e.category_label && (
          <span className="absolute top-3 right-3 bg-white/90 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {e.category_label}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">{e.title}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {!!e.starts_at && formatWhen(e.starts_at)}
          {!!e.city && ` · ${e.city}`}
          {` · ${e.participants_count} went`}
        </p>

        <div className="flex items-center gap-2 mt-3">
          {e.rating != null ? (
            <>
              <span className="text-lg font-extrabold text-gray-900 leading-none">{e.rating.toFixed(1)}</span>
              <Stars value={e.rating} />
              <span className="text-xs text-gray-500">({e.review_count} {e.review_count === 1 ? 'review' : 'reviews'})</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No ratings yet</span>
          )}
        </div>

        {e.reviews.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {e.reviews.slice(0, 2).map(r => <ReviewQuote key={r.id} r={r} />)}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{e.host_name ? `by ${e.host_name}` : ''}{e.host_verified ? ' ✓' : ''}</span>
          <span className="text-xs font-semibold text-pink-600">{e.review_count > 0 ? 'Read reviews →' : 'View event →'}</span>
        </div>
      </div>
    </Link>
  )
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; search?: string }>
}) {
  const { category, city, search } = await searchParams

  const [events, categories, pastEvents] = await Promise.all([
    publicEventApi.list({ category, city, search, per_page: 24 }),
    publicEventApi.categories(),
    // The past list follows the category/city chips but not the search box:
    // a search is for something to go to, not something that already happened.
    publicEventApi.past({ category, city, per_page: 9 }),
  ])

  return (
    <div className="min-h-screen bg-white">
      <Navbar overlay />

      <section className="relative overflow-hidden min-h-[60svh] flex items-center bg-[#160a2a]">
        {/* Photo background with a dark wash so the copy stays readable over any part of the image. */}
        <div className="absolute inset-0">
          <Image src="/events-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,7,32,0.78) 0%, rgba(42,16,51,0.5) 45%, rgba(12,7,32,0.92) 100%)' }} />
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(60% 50% at 50% 55%, rgba(233,30,140,0.35), transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-white/90">Discover · Meet · Experience</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto">
            Meet new people at{' '}
            <span className="gradient-brand-text-anim">real events</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto mt-5">
            Night outs, weekend trips, food, sport and everything in between. See who is
            hosting, how many are already going, and grab a spot.
          </p>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="max-w-md"><EventSearch /></div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {/* Chips carry the current search along, so picking a category
                  narrows the search rather than throwing it away. */}
              <Link
                href={chipHref(null, search)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!category ? 'gradient-brand text-white shadow-brand' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </Link>
              {categories.map(c => (
                <Link
                  key={c.key}
                  href={chipHref(c.key, search)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === c.key ? 'gradient-brand text-white shadow-brand' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-gray-900">No events to show yet</p>
            <p className="text-gray-500 mt-2">
              {search
                ? <>Nothing matched &ldquo;{search}&rdquo;. Try a different word, or clear the filters.</>
                : category || city
                  ? 'Try another category, or see everything.'
                  : 'New plans get added all the time — check back soon.'}
            </p>
            {(category || city || search) && (
              <Link href="/events" className="inline-block mt-6 px-6 py-3 rounded-full gradient-brand text-white font-semibold shadow-brand">
                See all events
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(e => <EventCard key={e.id} e={e} />)}
          </div>
        )}
      </section>

      {/* ── Past events — what people said ───────────────── */}
      {pastEvents.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-pink-600">Past events</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">How the last ones went</h2>
                <p className="text-gray-500 mt-1">Ratings and reviews from people who were there.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(e => <PastEventCard key={e.id} e={e} />)}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  )
}

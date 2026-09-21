import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { publicEventApi } from '@/lib/api'

// A shared link lands here, so the seat count must not be badly stale.
export const revalidate = 60

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const event = await publicEventApi.get(id)

  if (!event) return { title: 'Event not found — ZingDates' }

  // The cover is the share image: this page exists mostly to be posted
  // somewhere, and a link with no picture gets ignored.
  const title = `${event.title} — ${event.city ?? 'ZingDates'}`
  const description = event.summary || `Join ${event.title} on ZingDates.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://zingdates.com/events/${event.id}`,
      images: event.cover_url ? [{ url: event.cover_url }] : undefined,
    },
    twitter: {
      card: event.cover_url ? 'summary_large_image' : 'summary',
      title,
      description,
      images: event.cover_url ? [event.cover_url] : undefined,
    },
    alternates: { canonical: `https://zingdates.com/events/${event.id}` },
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await publicEventApi.get(id)

  if (!event) notFound()

  const over = event.status === 'completed'
  const off = event.status === 'cancelled'
  const mapsQuery = event.latitude != null && event.longitude != null
    ? `${event.latitude},${event.longitude}`
    : [event.location_name, event.city].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-white">
      <Navbar overlay />

      <section className="relative min-h-[55svh] flex items-end bg-[#160a2a]">
        <div className="absolute inset-0">
          {event.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.cover_url} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,7,32,0.6) 0%, rgba(12,7,32,0.35) 40%, rgba(12,7,32,0.92) 100%)' }} />
        </div>

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {event.is_live && (
              <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE NOW
              </span>
            )}
            {event.category_label && (
              <span className="bg-white/15 border border-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {event.category_label}
              </span>
            )}
            {off && <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">Cancelled</span>}
            {over && <span className="bg-blue-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">Finished</span>}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {event.title}
          </h1>
          {event.host_name && (
            <p className="text-white/80 mt-3">
              Hosted by {event.host_name}{event.host_verified ? ' ✓' : ''}
            </p>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">About this event</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</p>
              <p className="text-gray-900 mt-1">{formatDate(event.starts_at)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</p>
              <p className="text-gray-900 mt-1">
                {formatTime(event.starts_at)}{event.ends_at ? ` – ${formatTime(event.ends_at)}` : ''}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Where</p>
              <p className="text-gray-900 mt-1">{event.location_name ?? event.city ?? '—'}</p>
              {!!mapsQuery && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-pink-600 hover:text-pink-700 mt-1 inline-block"
                >
                  View on map &rsaquo;
                </a>
              )}
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Who can come</p>
              <p className="text-gray-900 mt-1">
                {event.age_min || event.age_max
                  ? `Ages ${event.age_min ?? 18}–${event.age_max ?? 'any'}`
                  : 'Anyone 18+'}
              </p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-3xl font-bold text-gray-900">
              {event.is_free ? 'Free' : `₹${event.price}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {event.participants_count} of {event.capacity} spots taken
            </p>

            <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div
                className="gradient-brand h-2 rounded-full"
                style={{ width: `${Math.min(100, Math.round((event.participants_count / Math.max(event.capacity, 1)) * 100))}%` }}
              />
            </div>

            {off ? (
              <p className="mt-6 text-sm text-red-600 font-medium">This event was cancelled.</p>
            ) : over ? (
              <p className="mt-6 text-sm text-blue-600 font-medium">This event has finished.</p>
            ) : event.is_full ? (
              <p className="mt-6 text-sm text-gray-600 font-medium">This event is full.</p>
            ) : (
              <>
                {/* Joining happens in the app — this page is the poster, not
                    the door. The deep link opens the app when it is
                    installed and the store when it is not. */}
                <a
                  href={`zingdates://events/${event.id}`}
                  className="block w-full text-center mt-6 px-6 py-3.5 rounded-full gradient-brand text-white font-semibold shadow-brand"
                >
                  Join in the app
                </a>
                <p className="text-xs text-gray-400 text-center mt-3">
                  You will need the ZingDates app to join.
                </p>
              </>
            )}

            {event.rating != null && (
              <p className="text-sm text-gray-500 mt-5 pt-5 border-t border-gray-100">
                ⭐ {event.rating} from {event.review_count} {event.review_count === 1 ? 'rating' : 'ratings'}
              </p>
            )}
          </div>

          <Link href="/events" className="block text-center text-sm font-semibold text-pink-600 hover:text-pink-700 mt-5">
            &larr; All events
          </Link>
        </aside>
      </section>

      <SiteFooter />
    </div>
  )
}

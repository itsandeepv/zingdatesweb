import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { publicEventApi, type PublicEvent } from '@/lib/api'
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

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string }>
}) {
  const { category, city } = await searchParams

  const [events, categories] = await Promise.all([
    publicEventApi.list({ category, city, per_page: 24 }),
    publicEventApi.categories(),
  ])

  return (
    <div className="min-h-screen bg-white">
      <Navbar overlay />

      <section className="relative overflow-hidden min-h-[60svh] flex items-center bg-[#160a2a]">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,7,32,0.82) 0%, rgba(42,16,51,0.7) 45%, rgba(12,7,32,0.94) 100%)' }} />
          <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(60% 50% at 50% 55%, rgba(233,30,140,0.4), transparent 70%)' }} />
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

      {categories.length > 0 && (
        <section className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link
                href="/events"
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!category ? 'gradient-brand text-white shadow-brand' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </Link>
              {categories.map(c => (
                <Link
                  key={c.key}
                  href={`/events?category=${c.key}`}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === c.key ? 'gradient-brand text-white shadow-brand' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-gray-900">No events to show yet</p>
            <p className="text-gray-500 mt-2">
              {category || city
                ? 'Try another category, or see everything.'
                : 'New plans get added all the time — check back soon.'}
            </p>
            {(category || city) && (
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

      <SiteFooter />
    </div>
  )
}

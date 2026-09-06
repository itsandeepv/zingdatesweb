import Link from 'next/link'
import type { PublicCompanion } from '@/lib/api'

/** Turn a category key ("coffee_chat") into a chip label ("Coffee Chat"). */
export function catLabel(key: string, lookup?: Record<string, string>) {
  return lookup?.[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-white/90 text-xs font-semibold">{Number(value || 0).toFixed(1)}</span>
    </span>
  )
}

/**
 * Public companion listing card — same shape as the in-app feed card so the
 * two surfaces read as one product.
 *
 * Two deliberate differences from the in-app version:
 *  • no rate is shown (rates are for people who have signed in to book), and
 *  • the whole card, Book included, goes to sign-in carrying `?next=`, so after
 *    logging in the visitor lands on THIS companion rather than the feed.
 */
export default function CompanionCard({
  c,
  categoryLabels,
  showPrice = false,
}: {
  c: PublicCompanion
  categoryLabels?: Record<string, string>
  showPrice?: boolean
}) {
  const cover = c.cover_image || c.photo
  const initials = (c.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const perHour = Math.round(c.price_per_hour || 0)

  return (
    <Link
      href={`/login?next=${encodeURIComponent(`/companion/${c.id}`)}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-brand transition-shadow duration-300 group flex flex-col h-full"
    >
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 200 }}>
        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={cover}
            alt={c.name ?? 'Companion'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full gradient-brand flex items-center justify-center">
            <span className="text-white text-5xl font-bold opacity-40">{initials}</span>
          </div>
        )}

        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start gap-1.5 flex-wrap">
          {c.is_verified && (
            <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </span>
          )}
          {c.is_available_now && (
            <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white" /> Available
            </span>
          )}
        </div>

        {/* Name / city / rating over the photo */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg leading-tight">
            {c.name}{c.age ? `, ${c.age}` : ''}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            {c.city && <span className="text-white/75 text-xs">{c.city}</span>}
            {c.rating_count > 0 && <Stars value={c.rating_avg} />}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {c.headline && <p className="text-gray-600 text-sm line-clamp-1 mb-2">{c.headline}</p>}

        {c.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {c.categories.slice(0, 3).map(k => (
              <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                {catLabel(k, categoryLabels)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          {showPrice && perHour > 0 ? (
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">rate</span>
              <p className="text-lg font-extrabold text-gray-900 leading-none">
                ₹{perHour} <span className="text-xs text-purple-600 font-bold">/hour</span>
              </p>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Sign in to see the rate</span>
          )}
          <span className="gradient-brand text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-brand group-hover:opacity-90 flex-shrink-0">
            Book
          </span>
        </div>
      </div>
    </Link>
  )
}

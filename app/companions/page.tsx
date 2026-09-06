import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import CompanionCard from '@/components/CompanionCard'
import { publicCompanionApi } from '@/lib/api'
import { pageMetadata } from '@/lib/seo-meta'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('companions', {
    title: 'Book a Verified Companion — Friendship, Chat & Hangouts',
    description:
      'Browse verified ZingDates companions and book an hour for friendship, a coffee chat, gaming, study help, or a hangout. Rated, verified people — you pick who and for how long.',
    path: '/companions',
  })
}

/** Chips we surface first — the everyday reasons people book someone. */
const FEATURED_CATS = [
  'friendship', 'coffee_chat', 'friendly_conversation', 'hanging_out',
  'gaming', 'study', 'emotional_support', 'movie', 'dinner', 'travel',
]

const HOW = [
  { n: '01', title: 'Pick someone', desc: 'Browse verified companions, their rate, rating, and what they are up for.' },
  { n: '02', title: 'Request an hour', desc: 'Choose a time and send the request. They accept before anything is charged.' },
  { n: '03', title: 'Pay and meet', desc: 'Pay once accepted, then chat, call, or meet up for the time you booked.' },
]

export default async function CompanionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [companions, categories] = await Promise.all([
    publicCompanionApi.list({ category, limit: 24 }),
    publicCompanionApi.categories(),
  ])

  const labels = Object.fromEntries(categories.map(c => [c.key, c.label]))
  const chips = categories.length
    ? categories.filter(c => FEATURED_CATS.includes(c.key))
    : []

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16" style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 50%,#fff 100%)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#E91E8C,transparent 70%)' }} />
          <div className="animate-blob2 absolute top-20 -left-20 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle,#9C27B0,transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-full px-4 py-2 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-60" />
              <span className="relative w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E91E8C' }} />
            </span>
            <span className="text-sm font-medium" style={{ color: '#E91E8C' }}>Verified companions</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
            Book someone to{' '}
            <span className="gradient-brand-text-anim">spend time with</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mt-5">
            Not a match — a booking. Pick a verified companion, choose how long, and spend
            the hour on a coffee chat, a game, study help, or just company. You see the rate
            before you book, and nothing is charged until they accept.
          </p>
        </div>
      </section>

      {/* ── Category filter ────────────────────────────── */}
      {chips.length > 0 && (
        <section className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link
                href="/companions"
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  !category ? 'gradient-brand text-white shadow-brand' : 'bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                }`}>
                All
              </Link>
              {chips.map(c => (
                <Link
                  key={c.key}
                  href={`/companions?category=${encodeURIComponent(c.key)}`}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    category === c.key ? 'gradient-brand text-white shadow-brand' : 'bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                  }`}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Listing ────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {companions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔎</div>
              <p className="font-bold text-gray-800 text-lg">
                {category ? 'No companions in this category yet' : 'No companions listed yet'}
              </p>
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                {category
                  ? 'Try another category — more people join every week.'
                  : 'Companions are being onboarded. Create an account and you will see them the moment they go live.'}
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                {category && (
                  <Link href="/companions" className="px-6 py-3 rounded-2xl border-2 border-gray-200 font-semibold text-gray-700 text-sm hover:border-pink-300 hover:bg-pink-50 transition-all">
                    See everyone
                  </Link>
                )}
                <Link href="/register" className="gradient-brand text-white font-semibold px-6 py-3 rounded-2xl text-sm shadow-brand hover:opacity-90 transition-all">
                  Create a free account
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {companions.map((c, i) => (
                  <ScrollReveal key={c.id} delay={(i % 4) * 80} direction="up" className="h-full">
                    {/* Rates stay visible on the browse page; the landing teaser hides them. */}
                    <CompanionCard c={c} categoryLabels={labels} showPrice />
                  </ScrollReveal>
                ))}
              </div>
              <p className="text-center text-sm text-gray-400 mt-10">
                Sign in to see everyone, filter by city and time, and book an hour.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── How booking works ──────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How <span className="gradient-brand-text-anim">booking</span> works
            </h2>
            <p className="text-lg text-gray-500">Three steps, and you are never charged before they say yes.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 150} direction="up">
                <div className="text-center group">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full gradient-brand opacity-20 animate-ping-slow group-hover:opacity-40" style={{ animationDelay: `${i * 0.5}s` }} />
                    <div className="relative w-20 h-20 rounded-full gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-brand-lg group-hover:scale-110 transition-transform duration-300">
                      {s.n}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-500">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Become a companion ─────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl gradient-brand p-12 grid md:grid-cols-2 gap-10 items-center relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 animate-blob" />

            <ScrollReveal direction="left" className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">Good company is a skill. Get paid for it.</h2>
              <p className="text-pink-100 text-lg leading-relaxed">
                Set your own hourly rate and the hours you are free. Accept only the requests
                you want. You keep your earnings minus the platform fee, and withdraw once you
                pass the minimum.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={100} className="relative z-10 flex flex-col gap-3">
              {[
                'You set the rate and the hours',
                'Every request needs your approval first',
                'Payment is held until the session is done',
              ].map(line => (
                <div key={line} className="flex items-center gap-3 bg-white/15 rounded-2xl p-4">
                  <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-white font-medium text-sm">{line}</p>
                </div>
              ))}
              <Link
                href="/register"
                className="mt-2 bg-white text-pink-600 font-bold text-center px-6 py-3.5 rounded-2xl hover:scale-[1.02] transition-transform duration-200 shadow-xl">
                Become a companion
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'
import CompanionCard from '@/components/CompanionCard'
import { publicCompanionApi } from '@/lib/api'

/**
 * Landing-page teaser for the companion booking side of the product.
 *
 * Async server component so the fetch is isolated from the rest of the page,
 * and cached (see publicCompanionApi) so it does not cost a request per view.
 * Renders nothing when no companions are listed — an empty grid on the home
 * page reads worse than no section at all.
 */
export default async function CompanionsSection() {
  // Everyone who is registered and approved, up to the API's page ceiling.
  // Past that the "Browse all" link takes over — a home page that renders a
  // hundred cards is slower to load than the page built for browsing them.
  const [companions, categories] = await Promise.all([
    publicCompanionApi.list({ limit: 24 }),
    publicCompanionApi.categories(),
  ])

  if (companions.length === 0) return null

  const labels = Object.fromEntries(categories.map(c => [c.key, c.label]))

  return (
    <section id="companions" className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-2 mb-5">
            <span className="text-sm font-medium text-purple-600">Companions</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Want company{' '}
            <span className="gradient-brand-text-anim">right now</span>?
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Matching takes time. Booking does not. Pick a verified companion and spend an hour
            on a coffee chat, a game, study help, or just someone to talk to. Sign in to see
            their rate and send a request — nothing is charged until they accept.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {companions.map((c, i) => (
            // Stagger only across the first row — a long list should not make
            // the last card wait two seconds to appear.
            <ScrollReveal key={c.id} delay={(i % 4) * 90} direction="up" className="h-full">
              <CompanionCard c={c} categoryLabels={labels} />
            </ScrollReveal>
          ))}
        </div>

        {/* ── Booking needs an account ──────────────────── */}
        <ScrollReveal direction="up" delay={150}>
          <div className="mt-14 rounded-3xl border border-pink-100 p-8 sm:p-10 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg,#fff5f8 0%,#fdf4ff 100%)' }}>
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
                 style={{ background: 'radial-gradient(circle,#E91E8C,transparent 70%)' }} />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Browsing is free.{' '}
                  <span className="gradient-brand-text">Booking needs an account.</span>
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  You can look through every companion right here without signing up. To send a
                  booking request we need an account — so they know who is asking, and so your
                  session, payment, and chat stay tied to you.
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  Sign-in is your mobile number and one OTP. Nothing is charged until the
                  companion accepts your request.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { n: '1', t: 'Pick a companion', d: 'Tap any card above — we will bring you right back to them.' },
                  { n: '2', t: 'Sign in with your number', d: 'One OTP. Takes about a minute.' },
                  { n: '3', t: 'Send the request', d: 'They accept first, then you pay.' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-pink-100/70">
                    <span className="w-7 h-7 flex-shrink-0 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center">
                      {s.n}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.t}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Link
                    href="/login?next=%2Fcompanion"
                    className="flex-1 gradient-brand text-white font-semibold text-center px-6 py-3.5 rounded-2xl shadow-brand hover:opacity-90 transition-all">
                    Sign in to book
                  </Link>
                  <Link
                    href="/companions"
                    className="flex-1 text-center px-6 py-3.5 rounded-2xl border-2 border-gray-200 font-semibold text-gray-700 hover:border-pink-300 hover:bg-white transition-all">
                    Browse all
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <p className="text-center text-sm text-gray-400 mt-8">
          Looking for a relationship instead? That is the free side — match, chat, and video call.
        </p>
      </div>
    </section>
  )
}

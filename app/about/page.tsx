import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { PhoneFrame } from '@/components/AppScreens'
import { screen } from '@/lib/screens'
import SiteFooter from '@/components/SiteFooter'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: `About ${SITE_NAME} — Our Story, Mission & Values`,
  description:
    'Learn how ZingDates started, what drives us, and how we help people find meaningful connections. Real people, real connections — built on trust.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: `About ${SITE_NAME} — Our Story, Mission & Values`,
    description:
      'Learn how ZingDates started, what drives us, and how we help people find meaningful connections.',
    url: `${SITE_URL}/about`,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'About zingDates' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `About ${SITE_NAME}`,
    description: 'The story behind the app built for real people and real connections.',
    images: ['/og-image.jpg'],
  },
}


// Product facts, not invented metrics.
const STATS = [
  { value: '100%', label: 'Free to join',      icon: '💝' },
  { value: 'OTP',  label: 'Verified sign-in',  icon: '🔒' },
  { value: 'HD',   label: 'Voice & video',     icon: '📞' },
  { value: '24/7', label: 'Member support',    icon: '💬' },
]

const VALUES = [
  {
    icon: '❤️',
    title: 'Authenticity First',
    desc: 'We believe real connections start with real people. Every profile is verified, every interaction is genuine. No bots, no fake accounts — just you, being you.',
  },
  {
    icon: '🛡️',
    title: 'Safety at Every Step',
    desc: 'Your safety is non-negotiable. From photo verification and ID checks to in-app reporting and a dedicated trust team, we build safety into every feature we ship.',
  },
  {
    icon: '🌈',
    title: 'Inclusive by Design',
    desc: 'Love has no boundaries. zingDates welcomes everyone — every orientation, background, and relationship goal is valid here. We are a community for all.',
  },
  {
    icon: '🤝',
    title: 'Respect & Privacy',
    desc: 'Your data belongs to you. We never sell your information, we never spam you, and we give you full control over who sees what. Trust is earned, not assumed.',
  },
  {
    icon: '🚀',
    title: 'Relentlessly Improving',
    desc: 'Dating is hard enough without a clunky app. Our team ships improvements every week, guided by real feedback from real members. Done is never done.',
  },
  {
    icon: '🌐',
    title: 'Community-Driven',
    desc: 'We grow through word of mouth — because members who find love tell their friends. Building a community people genuinely love is how we measure success.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-28 pb-24"
        style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 50%,#fff 100%)' }}
      >
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#E91E8C,transparent 70%)' }} />
          <div className="absolute bottom-0 -left-24 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#9C27B0,transparent 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse-ring" />
            <span className="text-sm font-medium text-pink-600">Our Story</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            We believe in{' '}
            <span className="gradient-brand-text">real connections</span>
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10">
            zingDates was built on a simple idea: technology should bring people closer together, not turn them into a product to be swiped away. We are a team of engineers, designers, and romantics on a mission to make meaningful human connection easier.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="gradient-brand text-white font-semibold px-8 py-4 rounded-2xl shadow-brand-lg hover:opacity-90 transition-all"
            >
              Join zingDates Free
            </Link>
            <a
              href="#our-story"
              className="flex items-center justify-center gap-2 text-gray-700 font-semibold px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-pink-200 hover:bg-pink-50 transition-all"
            >
              Read Our Story
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="text-4xl font-bold gradient-brand-text mb-1">{s.value}</p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ────────────────────────────────────────── */}
      <section id="our-story" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-pink-500 uppercase tracking-widest mb-3">How It Started</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-snug">
                Built by people who were tired of bad dating apps
              </h2>
              <div className="space-y-5 text-gray-600 leading-relaxed text-lg">
                <p>
                  In 2021, our founders were — like millions of others — using dating apps that felt like scrolling through a product catalogue. Swipe right. Get ghosted. Repeat. The apps had optimised for engagement metrics, not for the thing that actually matters: helping real people find real connection.
                </p>
                <p>
                  So they built the app they wished existed. One that uses AI to surface genuine compatibility, not just attractive photos. One that encourages conversations and real-world meetups, not endless swiping. One that treats safety and privacy as foundational, not as afterthoughts bolted on after a PR crisis.
                </p>
                <p>
                  That app became ZingDates: real people, real connections. Sign up takes a minute — your number, one OTP, a few details about you — and you are talking to people near you the same day.
                </p>
              </div>
            </div>

            {/* The real app screens */}
            <div className="relative hidden lg:grid grid-cols-2 gap-5">
              <PhoneFrame screen={screen('getstarted')} width={210} className="mt-8" />
              <PhoneFrame screen={screen('profile')} width={210} className="-mt-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-pink-500 uppercase tracking-widest mb-4">Our Mission</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-snug">
            Make meaningful connection <br className="hidden sm:block" />
            <span className="gradient-brand-text">accessible to everyone</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Loneliness is one of the defining challenges of modern life. We believe technology — built thoughtfully, built for humans — can be part of the solution. Our mission is to close the gap between the people who are looking for each other, wherever they are in the world.
          </p>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-pink-500 uppercase tracking-widest mb-3">What We Stand For</p>
            <h2 className="text-4xl font-bold text-gray-900">
              Our <span className="gradient-brand-text">core values</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VALUES.map(v => (
              <div
                key={v.title}
                className="group p-8 rounded-3xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className="w-14 h-14 rounded-2xl gradient-brand-soft flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology ───────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-last lg:order-first">
              <div className="grid grid-cols-2 gap-5">
                {[
                  { icon: '🤖', label: 'AI Compatibility Score', desc: '50+ signals, updated daily' },
                  { icon: '🔍', label: 'Smart Discovery', desc: 'Learns your preferences over time' },
                  { icon: '🔒', label: 'End-to-End Encryption', desc: 'Every message is private' },
                  { icon: '✅', label: 'Photo Verification', desc: 'Real people, verified faces' },
                ].map(t => (
                  <div key={t.label} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
                    <div className="text-2xl mb-3">{t.icon}</div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-pink-500 uppercase tracking-widest mb-3">The Tech</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-snug">
                AI that understands <span className="gradient-brand-text">chemistry</span>, not just preferences
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Our matching engine analyses over 50 behavioural, personality, and preference signals to surface the people you are most likely to genuinely connect with — not just the most recently active users.
                </p>
                <p>
                  Every day the model gets smarter. Connections that lead to ongoing conversations improve future recommendations. Connections that go nowhere are quietly down-weighted. No questionnaires required — the algorithm learns from how you naturally use the app.
                </p>
                <p>
                  Privacy is baked into the architecture: your raw behavioural data never leaves your device. Only anonymised signals are used to train the model.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24 gradient-brand">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to find your person?
          </h2>
          <p className="text-pink-100 text-xl mb-10 leading-relaxed">
            It only takes a minute to get started on ZingDates — and it could change everything.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-pink-600 font-bold px-10 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Create Your Free Profile
            </Link>
            <Link
              href="/blog"
              className="border-2 border-white/40 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-white/10 transition-all"
            >
              Read Our Blog
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

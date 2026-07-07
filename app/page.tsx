import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import CountUp from '@/components/CountUp'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'zingDates — The Best Place to Meet Your Future Partner',
  description: 'Connect with millions of people near you. Find meaningful relationships, attend local events, and build real connections on zingDates — the social networking app.',
  alternates: { canonical: 'https://zingdates.com' },
  openGraph: {
    title: 'zingDates — The Best Place to Meet Your Future Partner',
    description: 'Connect with millions of people near you. Find meaningful relationships, attend local events, and build real connections.',
    url: 'https://zingdates.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'zingDates — Find Your Perfect Match' }],
  },
}

// Structured data — gives Google the brand name + logo for rich results / knowledge panel.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo-full.png`,
      image: `${SITE_URL}/og-image.jpg`,
      description: 'zingDates is a social networking platform to meet your future partner through local events, real-time chat, and video calls.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

const FEATURES = [
  { icon: '💝', title: 'Smart AI Matching', desc: 'Our AI algorithm learns your preferences and connects you with people who truly match your personality and interests.' },
  { icon: '🎉', title: 'Local Events & Meetups', desc: 'Join events and social gatherings happening near you. Meet people in real life with shared interests.' },
  { icon: '📞', title: 'Voice & Video Calls', desc: 'Go beyond text with crystal-clear audio and video calls. Truly get to know your matches before meeting up.' },
  { icon: '🔒', title: 'Safe & Verified', desc: 'Advanced profile verification and safety features ensure every interaction is authentic and secure.' },
]

const STEPS = [
  { n: '01', title: 'Create Your Profile', desc: 'Set up your profile with photos, bio, and interests in just a few minutes.' },
  { n: '02', title: 'Discover Matches', desc: 'Browse people near you and connect with those who spark your interest.' },
  { n: '03', title: 'Start Connecting', desc: 'Chat, call, and meet up. Build real connections that truly last.' },
]

const STATS = [
  { n: 5,   suffix: 'M+', l: 'Active Users' },
  { n: 150, suffix: '+',  l: 'Countries' },
  { n: 1,   suffix: 'M+', l: 'Connections' },
  { n: 4.9, suffix: '★',  l: 'App Rating', isFloat: true },
]

const REVIEWS = [
  { name: 'Priya S.', loc: 'Mumbai, India',   img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face&q=85', text: 'I found my life partner on zingDates! The matching algorithm is incredible — it knew exactly what I was looking for.' },
  { name: 'James W.', loc: 'New York, USA',   img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face&q=85', text: 'The events feature is amazing. I met so many interesting people at local meetups organised through the app.' },
  { name: 'Sofia R.', loc: 'Barcelona, Spain', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=face&q=85', text: "zingDates changed my social life completely. It's not just dating — it's a whole community of genuine people." },
]

const PROFILES = [
  { name: 'Aria', age: 24, online: true,  img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Maya', age: 26, online: false, img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Zoe',  age: 22, online: true,  img: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Nina', age: 28, online: true,  img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Luna', age: 23, online: false, img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Sara', age: 25, online: true,  img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Kate', age: 27, online: true,  img: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Emma', age: 21, online: false, img: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=500&fit=crop&crop=top&q=85' },
  { name: 'Lily', age: 29, online: true,  img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=top&q=85' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* ── Navbar ─────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20" style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 50%,#fff 100%)' }}>
        {/* Animated ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#E91E8C,transparent 70%)' }} />
          <div className="animate-blob2 absolute top-20 -left-20 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle,#9C27B0,transparent 70%)' }} />
          <div className="animate-blob absolute bottom-10 right-1/3 w-56 h-56 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#E91E8C,transparent 70%)', animationDelay: '4s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="hero-badge inline-flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-full px-4 py-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-60" />
                  <span className="relative w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E91E8C' }} />
                </span>
                <span className="text-sm font-medium" style={{ color: '#E91E8C' }}>5 Million+ Active Members</span>
              </div>

              <h1 className="hero-h1 text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
                The best place to meet your{' '}
                <span className="gradient-brand-text-anim">future partner</span>
              </h1>

              <p className="hero-p text-xl text-gray-500 leading-relaxed max-w-lg">
                Create connections with people near you. Find meaningful relationships, attend local events, and build a life worth sharing.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row gap-4">
                <Link href="/register"
                  className="btn-glow gradient-brand text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-brand-lg hover:opacity-90 hover:scale-105 transition-all duration-200 text-center"
                >
                  Get Started Free
                </Link>
                <a href="#how-it-works"
                  className="flex items-center justify-center gap-2 text-gray-700 font-semibold px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 hover:scale-105 transition-all duration-200 text-base"
                >
                  <svg className="w-5 h-5 animate-heartbeat" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  How It Works
                </a>
              </div>

              <div className="hero-stats grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                {STATS.map(s => (
                  <div key={s.l} className="group">
                    <p className="text-2xl font-bold gradient-brand-text group-hover:scale-110 transition-transform duration-200 inline-block">
                      {s.isFloat ? `${s.n}${s.suffix}` : <CountUp end={s.n} suffix={s.suffix} />}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Profile Grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-3 gap-3 p-4">
                {PROFILES.map((p, i) => (
                  <div
                    key={i}
                    className={`profile-card group relative aspect-square rounded-2xl overflow-hidden shadow-lg cursor-pointer ${i === 4 ? 'scale-110 z-10 shadow-xl ring-2 ring-pink-300/60' : ''}`}
                  >
                    <Image
                      src={p.img} alt={p.name} fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="140px"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-x-0 bottom-0 px-2 py-2 translate-y-0">
                      <p className="text-white text-xs font-semibold text-center drop-shadow">{p.name}, {p.age}</p>
                    </div>
                    {p.online && (
                      <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                        <span className="relative w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                      </span>
                    )}
                    {/* Like button on hover */}
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-brand scale-75 group-hover:scale-100">
                      ❤️
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating match notification */}
              <div className="absolute -bottom-4 left-0 glass rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-pink-100 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-lg animate-heartbeat">💝</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">New Match!</p>
                  <p className="text-xs text-gray-500">Maya liked your profile</p>
                </div>
              </div>

              {/* Floating call notification */}
              <div className="absolute -top-4 right-0 glass rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-purple-100 animate-float2">
                <div className="relative w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-sm">
                  📞
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Incoming call</p>
                  <p className="text-xs text-gray-500">From Aria</p>
                </div>
              </div>

              {/* New message notification */}
              <div className="absolute top-1/2 -right-4 glass rounded-2xl shadow-lg p-3 flex items-center gap-2 border border-pink-100 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-sm">💬</div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Zoe sent a message</p>
                  <p className="text-xs text-gray-400">just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why choose <span className="gradient-brand-text-anim">zingDates</span>?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Everything you need to find meaningful connections in one beautiful app.
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 100} direction="up">
                <div className="group h-full p-8 rounded-3xl border border-gray-100 hover:border-pink-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white cursor-default">
                  <div className="w-14 h-14 rounded-2xl gradient-brand-soft flex items-center justify-center text-2xl mb-6 group-hover:scale-125 group-hover:rotate-3 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────── */}
      <section id="how-it-works" className="py-20 overflow-hidden" style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How <span className="gradient-brand-text-anim">zingDates</span> works
            </h2>
            <p className="text-xl text-gray-500">Three simple steps to start your journey.</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <ScrollReveal key={i} delay={i * 180} direction="up">
                <div className="relative text-center group">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full gradient-brand opacity-20 animate-ping-slow group-hover:opacity-40" style={{ animationDelay: `${i * 0.5}s` }} />
                    <div className="relative w-20 h-20 rounded-full gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-brand-lg group-hover:scale-110 transition-transform duration-300">
                      {s.n}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-2/3 right-0 h-0.5" style={{ background: 'linear-gradient(to right,#E91E8C50,#9C27B050)' }} />
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-500">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coin / Calls promo ─────────────────────────── */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl gradient-brand p-12 grid md:grid-cols-2 gap-10 items-center relative overflow-hidden">
            {/* Animated shimmer blob inside card */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 animate-blob" />
            <div className="pointer-events-none absolute -bottom-8 left-1/3 w-48 h-48 rounded-full bg-white/5 animate-blob2" />

            <ScrollReveal direction="left" className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">Connect deeper with zingDates Coins</h2>
              <p className="text-pink-100 text-lg mb-6 leading-relaxed">
                Use zingDates Coins to unlock audio and video calls with your matches. Recharge anytime — starting from just ₹149.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[{ coins: 100, price: '₹149' }, { coins: 250, price: '₹349' }, { coins: 500, price: '₹599' }].map((c, i) => (
                  <div key={c.coins}
                    className="bg-white/20 hover:bg-white/30 rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:-translate-y-1"
                    style={{ transitionDelay: `${i * 60}ms` }}>
                    <p className="text-2xl font-bold text-white">{c.coins}</p>
                    <p className="text-pink-100 text-xs mt-1">Coins</p>
                    <p className="text-white font-semibold mt-2">{c.price}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={100} className="relative z-10 flex flex-col gap-4">
              {[
                { icon: '🎙️', label: 'Audio Call', cost: '10 coins / min' },
                { icon: '📹', label: 'Video Call', cost: '25 coins / min' },
                { icon: '🎁', label: 'Send Gift',  cost: 'From 5 coins' },
              ].map((item, i) => (
                <div key={item.label}
                  className="flex items-center gap-4 bg-white/15 hover:bg-white/25 rounded-2xl p-4 transition-all duration-200 hover:translate-x-2 cursor-pointer"
                  style={{ transitionDelay: `${i * 80}ms` }}>
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-pink-100 text-sm">{item.cost}</p>
                  </div>
                  <svg className="ml-auto w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────── */}
      <section id="testimonials" className="py-20 overflow-hidden" style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Love stories from <span className="gradient-brand-text-anim">zingDates</span>
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {REVIEWS.map((r, i) => (
              <ScrollReveal key={i} delay={i * 120} direction="up">
                <div className="h-full p-8 rounded-3xl bg-white border border-pink-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-yellow-400 text-lg" style={{ animationDelay: `${j * 80}ms` }}>★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">"{r.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-pink-100">
                      <Image src={r.img} alt={r.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-sm text-gray-500">{r.loc}</p>
                    </div>
                    <div className="ml-auto text-pink-400 text-xl">💬</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ───────────────────────────────── */}
      <section className="py-20 gradient-brand relative overflow-hidden">
        {/* Animated blobs inside CTA */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-white/10 animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full bg-white/5 animate-blob2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <ScrollReveal direction="scale">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to find your match?</h2>
            <p className="text-pink-100 text-xl mb-10">Join 5 million+ people already on zingDates. Free to download.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {[
                { store: 'Google Play', sub: 'Get it on', icon: (<path d="M3.18 23.73c.3.16.66.17.99.04l13.5-7.74-2.85-2.86-11.64 10.56zM.5 1.5C.2 1.83.04 2.3.04 2.83v18.34c0 .53.16 1 .46 1.33l.08.08 10.27-10.26v-.24L.58 1.42.5 1.5zM20.99 10.22l-2.87-1.65-3.18 3.18 3.18 3.18 2.89-1.66c.83-.47.83-1.58-.02-2.05zM3.18.27L16.68 8c.28.16.52.36.71.6L7.12 9.12l-4.02 3.82V3.18c0-.53.16-.99.46-1.33L3.64.77l-.46-.5z" />) },
              ].map(b => (
                <button key={b.store} className="flex items-center gap-3 bg-black/90 hover:bg-black hover:scale-105 text-white px-7 py-4 rounded-2xl font-semibold transition-all duration-200 mx-auto sm:mx-0 shadow-xl">
                  <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">{b.icon}</svg>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">{b.sub}</p>
                    <p className="font-bold">{b.store}</p>
                  </div>
                </button>
              ))}
              <Link href="/register"
                className="flex items-center justify-center gap-2 bg-white text-pink-600 font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-200 shadow-xl mx-auto sm:mx-0">
                Sign Up on Web
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
            <p className="mt-8 text-pink-200 text-sm">
              Free forever · No credit card required
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <SiteFooter />
    </div>
  )
}

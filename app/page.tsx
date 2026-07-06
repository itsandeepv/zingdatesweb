import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'zingDates — The Best Place to Meet Your Future Partner',
  description: 'Connect with millions of people near you. Find meaningful relationships, attend local events, and build real connections on zingDates — the social networking app.',
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
  { v: '5M+', l: 'Active Users' }, { v: '150+', l: 'Countries' },
  { v: '1M+', l: 'Connections' }, { v: '4.9★', l: 'App Rating' },
]

const REVIEWS = [
  { name: 'Priya S.', loc: 'Mumbai, India',    img: 'https://randomuser.me/api/portraits/women/26.jpg', text: 'I found my life partner on zingDates! The matching algorithm is incredible — it knew exactly what I was looking for.' },
  { name: 'James W.', loc: 'New York, USA',     img: 'https://randomuser.me/api/portraits/men/32.jpg',   text: 'The events feature is amazing. I met so many interesting people at local meetups organised through the app.' },
  { name: 'Sofia R.', loc: 'Barcelona, Spain',  img: 'https://randomuser.me/api/portraits/women/63.jpg', text: "zingDates changed my social life completely. It's not just dating — it's a whole community of genuine people." },
]

const PROFILES = [
  { name: 'Aria', age: 24, online: true,  img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Maya', age: 26, online: false, img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Zoe',  age: 22, online: true,  img: 'https://randomuser.me/api/portraits/women/21.jpg' },
  { name: 'Nina', age: 28, online: true,  img: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { name: 'Luna', age: 23, online: false, img: 'https://randomuser.me/api/portraits/women/57.jpg' },
  { name: 'Sara', age: 25, online: true,  img: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { name: 'Kate', age: 27, online: true,  img: 'https://randomuser.me/api/portraits/women/76.jpg' },
  { name: 'Emma', age: 21, online: false, img: 'https://randomuser.me/api/portraits/women/90.jpg' },
  { name: 'Lily', age: 29, online: true,  img: 'https://randomuser.me/api/portraits/women/5.jpg'  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20" style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 50%,#fff 100%)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#E91E8C,transparent 70%)' }} />
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#9C27B0,transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full animate-pulse-ring" style={{ backgroundColor: '#E91E8C' }} />
                <span className="text-sm font-medium" style={{ color: '#E91E8C' }}>5 Million+ Active Members</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
                The best place to meet your{' '}
                <span className="gradient-brand-text">future partner</span>
              </h1>

              <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
                Create connections with people near you. Find meaningful relationships, attend local events, and build a life worth sharing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register"
                  className="gradient-brand text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-brand-lg hover:opacity-90 transition-all text-center"
                >
                  Get Started Free
                </Link>
                <a href="#how-it-works"
                  className="flex items-center justify-center gap-2 text-gray-700 font-semibold px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-pink-200 hover:bg-pink-50 transition-all text-base"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  How It Works
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                {STATS.map(s => (
                  <div key={s.l}>
                    <p className="text-2xl font-bold gradient-brand-text">{s.v}</p>
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
                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-lg ${i === 4 ? 'scale-110 z-10 shadow-xl' : ''}`}
                  >
                    <Image src={p.img} alt={p.name} fill className="object-cover" sizes="120px" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
                      <p className="text-white text-xs font-semibold text-center">{p.name}, {p.age}</p>
                    </div>
                    {p.online && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                    )}
                  </div>
                ))}
              </div>

              {/* Floating notification */}
              <div className="absolute -bottom-4 left-0 glass rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-pink-100 animate-float">
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-lg">💝</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">New Match!</p>
                  <p className="text-xs text-gray-500">Maya liked your profile</p>
                </div>
              </div>

              {/* Call notification */}
              <div className="absolute -top-4 right-0 glass rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-purple-100">
                <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-sm">📞</div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Incoming call</p>
                  <p className="text-xs text-gray-500">From Aria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why choose <span className="gradient-brand-text">zingDates</span>?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Everything you need to find meaningful connections in one beautiful app.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="group p-8 rounded-3xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all duration-300 bg-white">
                <div className="w-14 h-14 rounded-2xl gradient-brand-soft flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────── */}
      <section id="how-it-works" className="py-20" style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How <span className="gradient-brand-text">zingDates</span> works
            </h2>
            <p className="text-xl text-gray-500">Three simple steps to start your journey.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-brand-lg">
                  {s.n}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-2/3 right-0 h-0.5" style={{ background: 'linear-gradient(to right,#E91E8C50,#9C27B050)' }} />
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coin / Calls promo ─────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl gradient-brand p-12 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Connect deeper with zingDates Coins</h2>
              <p className="text-pink-100 text-lg mb-6 leading-relaxed">
                Use zingDates Coins to unlock audio and video calls with your matches. Recharge anytime — starting from just ₹149.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[{ coins: 100, price: '₹149' }, { coins: 250, price: '₹349' }, { coins: 500, price: '₹599' }].map(c => (
                  <div key={c.coins} className="bg-white/20 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{c.coins}</p>
                    <p className="text-pink-100 text-xs mt-1">Coins</p>
                    <p className="text-white font-semibold mt-2">{c.price}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: '🎙️', label: 'Audio Call', cost: '10 coins / min' },
                { icon: '📹', label: 'Video Call', cost: '25 coins / min' },
                { icon: '🎁', label: 'Send Gift', cost: 'From 5 coins' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 bg-white/15 rounded-2xl p-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-pink-100 text-sm">{item.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────── */}
      <section id="testimonials" className="py-20" style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Love stories from <span className="gradient-brand-text">zingDates</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {REVIEWS.map((r, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white border border-pink-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-yellow-400">★</span>)}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={r.img} alt={r.name} fill className="object-cover" sizes="40px" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-sm text-gray-500">{r.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ───────────────────────────────── */}
      <section className="py-20 gradient-brand">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to find your match?</h2>
          <p className="text-pink-100 text-xl mb-10">Join 5 million+ people already on zingDates. Free to download.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {[
              // { store: 'App Store', sub: 'Download on the', icon: (<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />) },
              { store: 'Google Play', sub: 'Get it on', icon: (<path d="M3.18 23.73c.3.16.66.17.99.04l13.5-7.74-2.85-2.86-11.64 10.56zM.5 1.5C.2 1.83.04 2.3.04 2.83v18.34c0 .53.16 1 .46 1.33l.08.08 10.27-10.26v-.24L.58 1.42.5 1.5zM20.99 10.22l-2.87-1.65-3.18 3.18 3.18 3.18 2.89-1.66c.83-.47.83-1.58-.02-2.05zM3.18.27L16.68 8c.28.16.52.36.71.6L7.12 9.12l-4.02 3.82V3.18c0-.53.16-.99.46-1.33L3.64.77l-.46-.5z" />) },
            ].map(b => (
              <button key={b.store} className="flex items-center gap-3 bg-black/90 hover:bg-black text-white px-7 py-4 rounded-2xl font-semibold transition-colors mx-auto sm:mx-0">
                <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">{b.icon}</svg>
                <div className="text-left">
                  <p className="text-xs text-gray-400">{b.sub}</p>
                  <p className="font-bold">{b.store}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-8 text-pink-200 text-sm">
            Also available on web —{' '}
            <Link href="/register" className="text-white underline underline-offset-2">Sign up here</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <SiteFooter />
    </div>
  )
}

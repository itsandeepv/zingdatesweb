import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import AppScreens, { PhoneFrame } from '@/components/AppScreens'
import CompanionsSection from '@/components/CompanionsSection'
import { screen, POSTERS } from '@/lib/screens'
import { PLAY_STORE_URL } from '@/lib/site'
import JsonLd from '@/components/JsonLd'
import { graph, organizationSchema, websiteSchema, mobileAppSchema } from '@/lib/seo'
import { pageMetadata } from '@/lib/seo-meta'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('home', {
    title: 'zingDates — Dating App to Meet, Chat & Video Call Nearby',
    description:
      'zingDates is the free dating & social app to meet people near you, match, chat, and connect over HD video calls — or book a verified companion. Find your perfect match today.',
    path: '/',
  })
}

// Brand + website + app rich-result markup. Built from the shared helpers so it
// stays consistent with every other page.
const structuredData = graph(organizationSchema(), websiteSchema(), mobileAppSchema())

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

// Product facts, not invented metrics. Every line here is something the app
// actually does, so nothing on this page has to be walked back later.
// Mirrors WalletController::PLANS on the API — the only things the product
// actually sells. `POST /wallet/create-order` accepts trial | monthly | vip and
// nothing else, so there is no coin pack or gift to advertise here.
const PLANS = [
  { name: '1 Day Free Trial', price: '\u20b91',   duration: '1 day',   features: 'Chat, likes & search',                    featured: false },
  { name: 'Monthly Premium',  price: '\u20b999',  duration: '30 days', features: 'Chat, likes & search',                    featured: false },
  { name: 'VIP Plan',         price: '\u20b9199', duration: '30 days', features: 'Chat, likes, search + audio & video calls', featured: true  },
]

const HIGHLIGHTS = [
  { v: '100%', l: 'Free to join' },
  { v: 'HD',   l: 'Voice & video' },
  { v: 'OTP',  l: 'Verified sign-in' },
  { v: '24/7', l: 'Support' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={structuredData} />

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
                <span className="text-sm font-medium" style={{ color: '#E91E8C' }}>Real people, real connections</span>
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
                {HIGHLIGHTS.map(h => (
                  <div key={h.l} className="group">
                    <p className="text-2xl font-bold gradient-brand-text group-hover:scale-110 transition-transform duration-200 inline-block">
                      {h.v}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{h.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: real app screens */}
            <div className="relative hidden lg:flex justify-center items-end gap-5 pt-4">
              <PhoneFrame screen={screen('chats')} width={214} className="translate-y-6" />
              <PhoneFrame screen={screen('companions')} width={230} />

              {/* Floating match notification */}
              <div className="absolute -bottom-4 -left-2 glass rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-pink-100 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-lg animate-heartbeat">💝</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">It&apos;s a Match!</p>
                  <p className="text-xs text-gray-500">You both liked each other</p>
                </div>
              </div>

              {/* Floating call notification */}
              <div className="absolute -top-2 -right-4 glass rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-purple-100 animate-float2">
                <div className="relative w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-sm">
                  📞
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Incoming call</p>
                  <p className="text-xs text-gray-500">HD video, in-app</p>
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

      {/* ── Plans promo ────────────────────────────────── */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl gradient-brand p-12 grid md:grid-cols-2 gap-10 items-center relative overflow-hidden">
            {/* Animated shimmer blob inside card */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 animate-blob" />
            <div className="pointer-events-none absolute -bottom-8 left-1/3 w-48 h-48 rounded-full bg-white/5 animate-blob2" />

            <ScrollReveal direction="left" className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">Unlimited chat and calls, on a plan</h2>
              <p className="text-pink-100 text-lg mb-6 leading-relaxed">
                Every new member gets a few free coins to try ZingDates out. Once they run out, a plan
                takes the limits off &mdash; and VIP adds audio and video calls.
              </p>

              {/* How the free coins work */}
              <div className="rounded-2xl bg-white/15 p-5 space-y-2.5">
                <p className="text-white font-semibold text-sm">How the free coins work</p>
                {[
                  '10 free coins the day you sign up',
                  '5 coins per message \u00b7 5 coins per call',
                  'Calls stop at 60 seconds without a plan',
                ].map(line => (
                  <p key={line} className="flex items-start gap-2 text-pink-100 text-sm leading-relaxed">
                    <span className="text-white/70 mt-0.5">&bull;</span>
                    {line}
                  </p>
                ))}
                <p className="text-white/70 text-xs pt-1 leading-relaxed">
                  Coins are a one-time trial allowance, not a product &mdash; they are never topped up.
                  On any active plan you are not charged coins at all.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={100} className="relative z-10 flex flex-col gap-4">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.name}
                  className={`flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:translate-x-2 ${
                    plan.featured
                      ? 'bg-white/25 ring-2 ring-white/60 hover:bg-white/30'
                      : 'bg-white/15 hover:bg-white/25'
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{plan.name}</p>
                      {plan.featured && (
                        <span className="bg-white text-pink-600 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                          Includes calls
                        </span>
                      )}
                    </div>
                    <p className="text-pink-100 text-sm mt-0.5">{plan.features}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-white leading-none">{plan.price}</p>
                    <p className="text-pink-100 text-xs mt-1">{plan.duration}</p>
                  </div>
                </div>
              ))}

              <Link
                href="/register"
                className="mt-1 bg-white text-pink-600 font-bold text-center px-6 py-3.5 rounded-2xl hover:scale-[1.02] transition-transform duration-200 shadow-xl">
                Get a plan
              </Link>
              <p className="text-white/70 text-xs text-center leading-relaxed">
                Upgrade or renew any time. While a higher plan is running you cannot drop to a lower one.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Inside the app ─────────────────────── */}
      <section id="screens" className="py-20 overflow-hidden relative" style={{ background: 'linear-gradient(160deg,#0c0720 0%,#1d0940 45%,#280c3a 75%,#0c0720 100%)' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/3 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(233,30,140,0.25),transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(156,39,176,0.2),transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">
              Take a look <span className="gradient-brand-text-anim">inside</span>
            </h2>
            <p className="text-white/55 text-lg max-w-2xl mx-auto">
              Browse verified companions, see who liked you, chat privately, and get real help — every screen below is the app you’ll install.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={120}>
            <AppScreens />
          </ScrollReveal>

          {/* Store artwork — the same shots you see on the app listing */}
          <ScrollReveal direction="up" delay={200} className="mt-16">
            <p className="text-center text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
              Straight from the app listing
            </p>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 px-2 -mx-2 snap-x snap-mandatory">
              {POSTERS.map(p => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={p.key}
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="w-[200px] sm:w-[230px] flex-shrink-0 snap-center rounded-3xl border border-white/10 object-cover shadow-2xl"
                />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Companions ─────────────────────────────────── */}
      <CompanionsSection />

      {/* ── App Download Bridge ────────────────────────── */}
      <section className="py-24 overflow-hidden relative" style={{ background: 'linear-gradient(160deg,#0c0720 0%,#1d0940 45%,#280c3a 75%,#0c0720 100%)' }}>
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/3 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(233,30,140,0.28),transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(156,39,176,0.22),transparent 70%)' }} />
          <div className="absolute top-1/2 -left-16 w-56 h-56 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(233,30,140,0.14),transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — text + CTAs */}
            <ScrollReveal direction="left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 mb-6">
                <span className="text-base">📱</span>
                <span className="text-pink-300 text-sm font-semibold">Available on Android & iOS</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Stop scrolling.<br />
                Start{' '}
                <span className="gradient-brand-text-anim">connecting</span>{' '}
                for real.
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
                Carry every match, message, and call right in your pocket. Download the ZingDates app and pick up wherever you left off — on any device, wherever life takes you.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 mb-10">
                <div className="flex items-center gap-2">
                  <span className="text-pink-400 text-base">📞</span>
                  <span className="text-white/70 text-sm font-medium">HD Voice &amp; Video</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-pink-400 text-base">💬</span>
                  <span className="text-white/70 text-sm font-medium">Instant Chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-base">🔒</span>
                  <span className="text-white/70 text-sm font-medium">Verified Profiles</span>
                </div>
              </div>

              {/* Store buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener" aria-label="Get ZingDates on Google Play" className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-200 hover:scale-105">
                  <svg className="w-7 h-7 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M3.18 23.73c.3.16.66.17.99.04l13.5-7.74-2.85-2.86-11.64 10.56zM.5 1.5C.2 1.83.04 2.3.04 2.83v18.34c0 .53.16 1 .46 1.33l.08.08 10.27-10.26v-.24L.58 1.42.5 1.5zM20.99 10.22l-2.87-1.65-3.18 3.18 3.18 3.18 2.89-1.66c.83-.47.83-1.58-.02-2.05zM3.18.27L16.68 8c.28.16.52.36.71.6L7.12 9.12l-4.02 3.82V3.18c0-.53.16-.99.46-1.33L3.64.77l-.46-.5z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-white/50">Get it on</p>
                    <p className="font-bold text-base">Google Play</p>
                  </div>
                </a>
                <a href="#" className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-200 hover:scale-105">
                  <svg className="w-7 h-7 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-white/50">Download on the</p>
                    <p className="font-bold text-base">App Store</p>
                  </div>
                </a>
              </div>
            </ScrollReveal>

            {/* Right — a real app screen */}
            <ScrollReveal direction="right" delay={120} className="relative flex justify-center lg:justify-end">
              <div className="relative animate-float2">
                <PhoneFrame screen={screen('likes')} width={264} />

                {/* Floating elements around the phone */}
                <div className="absolute -top-4 -right-8 glass rounded-2xl px-3 py-2 border border-pink-200/30 shadow-xl animate-float" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
                  <p className="text-white text-[11px] font-bold">💬 New message</p>
                  <p className="text-white/60 text-[10px]">Straight to your phone</p>
                </div>
                <div className="absolute -bottom-2 -left-10 glass rounded-2xl px-3 py-2 border border-purple-200/30 shadow-xl animate-float2">
                  <p className="text-white text-[11px] font-bold">📞 Incoming call</p>
                  <p className="text-white/60 text-[10px]">HD audio &amp; video</p>
                </div>
              </div>
            </ScrollReveal>

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
            <p className="text-pink-100 text-xl mb-10">Create your profile in under a minute. Free to download, free to join.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {[
                { store: 'Google Play', sub: 'Get it on', href: PLAY_STORE_URL, icon: (<path d="M3.18 23.73c.3.16.66.17.99.04l13.5-7.74-2.85-2.86-11.64 10.56zM.5 1.5C.2 1.83.04 2.3.04 2.83v18.34c0 .53.16 1 .46 1.33l.08.08 10.27-10.26v-.24L.58 1.42.5 1.5zM20.99 10.22l-2.87-1.65-3.18 3.18 3.18 3.18 2.89-1.66c.83-.47.83-1.58-.02-2.05zM3.18.27L16.68 8c.28.16.52.36.71.6L7.12 9.12l-4.02 3.82V3.18c0-.53.16-.99.46-1.33L3.64.77l-.46-.5z" />) },
              ].map(b => (
                <a key={b.store} href={b.href} target="_blank" rel="noopener" aria-label={`${b.sub} ${b.store}`} className="flex items-center gap-3 bg-gray-950 hover:bg-black hover:scale-105 text-white border border-white/15 px-7 py-4 rounded-2xl font-semibold transition-all duration-200 mx-auto sm:mx-0 shadow-xl">
                  <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">{b.icon}</svg>
                  <div className="text-left">
                    <p className="text-xs text-gray-300 leading-tight">{b.sub}</p>
                    <p className="font-bold text-white leading-tight">{b.store}</p>
                  </div>
                </a>
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

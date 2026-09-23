import Link from 'next/link'
import Image from 'next/image'
import HeroVideo from '@/components/HeroVideo'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import AppScreens, { PhoneFrame } from '@/components/AppScreens'
import CompanionsSection from '@/components/CompanionsSection'
import { screen } from '@/lib/screens'
import { PLAY_STORE_URL } from '@/lib/site'
import { publicPlansApi, type PublicPlans } from '@/lib/api'
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

// Plans are admin-managed (Admin → Plans), so the cards below are built from
// the API rather than written here. These values are only the fallback for when
// the public plan list cannot be reached — they mirror what the admin panel
// currently holds so the section never renders empty or wrong.
type PlanCard = { name: string; price: string; duration: string; features: string; tag: string | null }

const FALLBACK_PLANS: PlanCard[] = [
  { name: '1 Day Free Trial', price: '\u20b91',   duration: '1 day',   features: 'Chat, likes & search',                     tag: null },
  { name: 'Monthly Premium',  price: '\u20b999',  duration: '30 days', features: 'Chat, likes & search',                     tag: null },
  { name: 'VIP Plan',         price: '\u20b9199', duration: '30 days', features: 'Chat, likes, search + audio & video calls', tag: 'Includes calls' },
]

// Admin rows → what the card actually shows. Inactive plans are dropped and the
// admin's own sort order decides the sequence, so reordering in the panel
// reorders the landing page.
function toPlanCards(res: PublicPlans): PlanCard[] {
  const rows = (res.plans ?? []).filter(p => p.is_active !== false)
  if (!rows.length) return FALLBACK_PLANS
  const labels = res.feature_labels ?? {}
  return [...rows]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(p => ({
      name: p.name,
      price: `\u20b9${Number(p.price)}`,
      duration: p.duration_days === 1 ? '1 day' : `${p.duration_days} days`,
      features: (p.features ?? []).map(f => labels[f] ?? f).join(', '),
      tag: p.tag || null,
    }))
}

// Hero background. Drop your own clip at public/hero-bg.mp4 (landscape,
// 10–20 s, muted, ideally under 4 MB) and point HERO_VIDEO at it; the poster
// is what paints before the video is ready and for reduced-motion visitors.
const HERO_VIDEO  = '/hero-bg.mp4'
const HERO_POSTER = '/og-image.jpg'
// Second clip behind the "Take a look inside" section. Same rules as above.
const SCREENS_VIDEO = '/hero2.mp4'

const HIGHLIGHTS = [
  { v: '100%', l: 'Free to join' },
  { v: 'HD',   l: 'Voice & video' },
  { v: 'OTP',  l: 'Verified sign-in' },
  { v: '24/7', l: 'Support' },
]

export default async function LandingPage() {
  const plans = toPlanCards(await publicPlansApi.list())

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={structuredData} />

      {/* ── Navbar ─────────────────────────────────────── */}
      <Navbar overlay />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-[#160a2a]">
        {/* Background: poster paints instantly, the video fades in over it. */}
        <div className="absolute inset-0">
          {/* Blurred so the poster reads as colour and mood, never as competing artwork under the headline. */}
          <Image src={HERO_POSTER} alt="" fill priority sizes="100vw" className="object-cover blur-md scale-110" />
          <HeroVideo src={HERO_VIDEO} poster={HERO_POSTER} />
          {/* Darken for legibility: stronger at the top (under the nav) and the bottom (under the CTA). */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,7,32,0.78) 0%, rgba(12,7,32,0.55) 40%, rgba(12,7,32,0.65) 75%, rgba(12,7,32,0.92) 100%)' }} />
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(60% 50% at 50% 55%, rgba(233,30,140,0.35), transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 text-center">
          <div className="hero-badge inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-70" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-pink-400" />
            </span>
            <span className="text-sm font-medium text-white/90">Real people, real connections</span>
          </div>

          <h1 className="hero-h1 text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mt-7">
            The best place to meet your{' '}
            <span className="gradient-brand-text-anim">future partner</span>
          </h1>

          <p className="hero-p text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto mt-6">
            Create connections with people near you. Find meaningful relationships, attend local events, and build a life worth sharing.
          </p>

          <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="btn-glow gradient-brand text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-brand-lg hover:opacity-90 hover:scale-105 transition-all duration-200 text-center">
              Get Started Free
            </Link>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener" aria-label="Get ZingDates on Google Play"
              className="flex items-center gap-3 bg-white text-gray-900 pl-4 pr-6 py-3 rounded-2xl hover:scale-105 transition-transform duration-200 shadow-lg">
              <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M3.6 2.5 13.4 12 3.6 21.5c-.2-.2-.4-.6-.4-1V3.5c0-.4.2-.8.4-1z" />
                <path fill="#34A853" d="m13.4 12 3.1-3.1 3.6 2.1c1 .6 1 1.5 0 2.1l-3.6 2.1L13.4 12z" />
                <path fill="#FBBC04" d="M3.6 2.5c.3-.3.8-.4 1.3-.1l11.6 6.5-3.1 3.1L3.6 2.5z" />
                <path fill="#EA4335" d="M3.6 21.5 13.4 12l3.1 3.1L4.9 21.6c-.5.3-1 .2-1.3-.1z" />
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[11px] text-gray-500">Download on</span>
                <span className="block text-base font-bold">Google Play</span>
              </span>
            </a>
          </div>

          <div className="hero-stats mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {HIGHLIGHTS.map(h => (
              <div key={h.l}>
                <p className="text-2xl sm:text-3xl font-bold text-white">{h.v}</p>
                <p className="text-xs sm:text-sm text-white/60 mt-1">{h.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <Link href="#features" aria-label="Scroll to features"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 hover:text-white animate-scroll-cue">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </Link>
      </section>

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
              {plans.map((plan, i) => (
                <div
                  key={plan.name}
                  className={`flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:translate-x-2 ${
                    plan.tag
                      ? 'bg-white/25 ring-2 ring-white/60 hover:bg-white/30'
                      : 'bg-white/15 hover:bg-white/25'
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{plan.name}</p>
                      {plan.tag && (
                        <span className="bg-white text-pink-600 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                          {plan.tag}
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
        {/* Background video over the gradient; if the file is missing the gradient simply stays. */}
        <div className="pointer-events-none absolute inset-0">
          <HeroVideo src={SCREENS_VIDEO} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,7,32,0.85) 0%, rgba(12,7,32,0.6) 35%, rgba(12,7,32,0.65) 70%, rgba(12,7,32,0.9) 100%)' }} />
        </div>
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

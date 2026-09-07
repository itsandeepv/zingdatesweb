import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import SupportForm from '@/components/SupportForm'
import { pageMetadata } from '@/lib/seo-meta'

/** Published in the legal pages already — the one address people can rely on. */
const SUPPORT_EMAIL = 'zingdates2026@gmail.com'

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await pageMetadata('contact', {
      title: 'Support — Get Help with ZingDates',
      description:
        'Contact ZingDates support for help with your account, payments, plans, companion bookings, safety concerns, or deleting your account. We reply within 2 working days.',
      path: '/help',
    })),
    robots: { index: true, follow: true },
  }
}

const FAQS = [
  {
    q: 'How do I delete my account and my data?',
    a: 'Open the app, go to Profile → Settings → Delete account. This removes your profile, photos, matches, and chats. If you cannot sign in, email us from your registered address and we will delete it for you.',
  },
  {
    q: 'I paid for a plan but it has not activated.',
    a: 'Payments confirm within a few minutes. If it has been longer, send us the date, amount, and the payment reference from your bank or Razorpay message, and we will sort it out.',
  },
  {
    q: 'How do refunds work?',
    a: 'Refund eligibility and timelines are set out in our Refund Policy. For a booking that did not go ahead, contact us with the booking details.',
  },
  {
    q: 'Someone is behaving badly. What do I do?',
    a: 'Use Report and Block on their profile or in the chat — that stops all contact immediately. Then tell us here, with their name and roughly when it happened, so our team can act on the account.',
  },
  {
    q: 'A companion booking went wrong.',
    a: 'Bookings are paid only after the companion accepts. If a session did not happen or something went wrong, contact us with the booking date and the companion name before the session auto-completes.',
  },
  {
    q: 'I am not receiving the OTP.',
    a: 'Check that the number is correct and has network. Wait for the timer and use Resend. If it still does not arrive, email us with your mobile number and we will look into it.',
  },
]

const CHANNELS = [
  {
    icon: '✉️',
    title: 'Email us',
    body: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    note: 'Best for account, payment, and refund questions.',
  },
  {
    icon: '🛡️',
    title: 'Safety concern',
    body: 'Report from inside the app',
    href: null,
    note: 'Report & Block on a profile stops contact right away, then tell us here.',
  },
  {
    icon: '📄',
    title: 'Policies',
    body: 'Privacy · Terms · Refunds',
    href: '/privacy',
    note: 'How we handle your data, the rules, and refund eligibility.',
  },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16" style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 50%,#fff 100%)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#E91E8C,transparent 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            How can we <span className="gradient-brand-text-anim">help</span>?
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mt-5">
            Tell us what is going on and our support team will get back to you within
            2 working days. Real people read every message.
          </p>
        </div>
      </section>

      {/* ── Channels ───────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {CHANNELS.map((c, i) => {
              const inner = (
                <div className="h-full p-7 rounded-3xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="w-12 h-12 rounded-2xl gradient-brand-soft flex items-center justify-center text-xl mb-4">{c.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-sm font-semibold gradient-brand-text mb-2 break-all">{c.body}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{c.note}</p>
                </div>
              )
              return (
                <ScrollReveal key={c.title} delay={i * 100} direction="up" className="h-full">
                  {c.href
                    ? <Link href={c.href} className="block h-full">{inner}</Link>
                    : inner}
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Form + FAQ ─────────────────────────────────── */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#fdf4ff 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            <ScrollReveal direction="left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a message</h2>
              <p className="text-gray-500 mb-6">We reply to the email address you give us.</p>
              <SupportForm />
            </ScrollReveal>

            <ScrollReveal direction="right" delay={100}>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Common questions</h2>
              <p className="text-gray-500 mb-6">The quickest answers to what people ask most.</p>

              <div className="space-y-3">
                {FAQS.map(f => (
                  <details key={f.q} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-gray-900 text-sm hover:bg-pink-50/50 transition-colors">
                      {f.q}
                      <svg className="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-5">
                <p className="text-sm font-bold text-gray-900 mb-1">Still stuck?</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Email{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 font-semibold">{SUPPORT_EMAIL}</a>
                  {' '}from your registered address and include your mobile number — it helps us find your account.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Policy links ───────────────────────────────── */}
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Policies</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Refund Policy', href: '/refund' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600 transition-all">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

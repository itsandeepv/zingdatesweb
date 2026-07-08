import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: { template: '%s | zingDates', default: 'zingDates' } }

const DECO = [
  { img: 'https://randomuser.me/api/portraits/women/44.jpg', name: 'Aria', age: 24, style: { top: '8%',  left: '3%',  rotate: '-7deg', opacity: 0.45 } },
  { img: 'https://randomuser.me/api/portraits/women/68.jpg', name: 'Maya', age: 26, style: { top: '58%', left: '2%',  rotate:  '4deg', opacity: 0.38 } },
  { img: 'https://randomuser.me/api/portraits/men/32.jpg',   name: 'Jake', age: 27, style: { top: '14%', right: '3%', rotate:  '6deg', opacity: 0.42 } },
  { img: 'https://randomuser.me/api/portraits/women/33.jpg', name: 'Nina', age: 28, style: { top: '64%', right: '2%', rotate: '-5deg', opacity: 0.40 } },
  { img: 'https://randomuser.me/api/portraits/women/21.jpg', name: 'Zoe',  age: 22, style: { top: '36%', left: '1%', rotate:  '3deg', opacity: 0.35 } },
  { img: 'https://randomuser.me/api/portraits/women/57.jpg', name: 'Luna', age: 23, style: { top: '40%', right: '1%', rotate: '-4deg', opacity: 0.35 } },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#0c0720 0%,#1d0940 40%,#280c3a 70%,#0c0720 100%)' }}
    >
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4  w-96 h-96 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle,rgba(233,30,140,0.35),transparent 70%)' }} />
        <div className="absolute bottom-0   right-1/4 w-80 h-80 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle,rgba(156,39,176,0.25),transparent 70%)' }} />
        <div className="absolute top-1/2   right-0   w-64 h-64 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle,rgba(233,30,140,0.18),transparent 70%)' }} />
      </div>

      {/* Floating decorative profile cards — only on very wide screens */}
      {DECO.map((p, i) => (
        <div
          key={i}
          className="hidden 2xl:block absolute pointer-events-none select-none"
          style={{ ...p.style, transform: `rotate(${p.style.rotate})` }}
        >
          <div
            className="w-24 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: 'rgba(30,15,60,0.9)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.img} alt="" className="w-full h-32 object-cover" loading="lazy" />
            <div className="py-2 text-center">
              <p className="text-white/80 text-xs font-semibold">{p.name}, {p.age}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-[14px] gradient-brand flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
              <span className="text-white font-black text-xl">Z</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight">zingDates</span>
          </Link>
          <p className="text-white/35 text-xs mt-2.5 tracking-wide">5 million+ people connected worldwide</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 overflow-hidden" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/25 mt-6 space-x-2">
          <span>© 2026 zingDates</span>
          <span>·</span>
          <a href="#" className="hover:text-white/50 transition-colors">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
          <span>·</span>
          <a href="#" className="hover:text-white/50 transition-colors">Safety</a>
        </p>
      </div>
    </div>
  )
}

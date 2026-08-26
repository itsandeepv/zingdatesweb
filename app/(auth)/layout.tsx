import type { Metadata } from 'next'
import Logo from '@/components/Logo'

export const metadata: Metadata = { title: { template: '%s | zingDates', default: 'zingDates' } }

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

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size={52} tone="light" tagline />
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 overflow-hidden" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/25 mt-6 space-x-2">
          <span>© 2026 zingDates</span>
          <span>·</span>
          <a href="/privacy" className="hover:text-white/50 transition-colors">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:text-white/50 transition-colors">Terms</a>
          <span>·</span>
          <a href="/refund" className="hover:text-white/50 transition-colors">Refunds</a>
        </p>
      </div>
    </div>
  )
}

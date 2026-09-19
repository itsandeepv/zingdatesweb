import Link from 'next/link'
import Image from 'next/image'
import { SOCIAL_LINKS } from '@/lib/site'

export default function SiteFooter() {
  const groups = [
    { title: 'Explore', links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Podcasts', href: '/podcasts' },
      { label: 'Companions', href: '/companions' },
      { label: 'Events', href: '/#features' },
      { label: 'Pricing', href: '/#features' },
    ]},
    { title: 'Company', links: [
      { label: 'About', href: '/#how-it-works' },
      { label: 'App Screens',  href: '/#screens' },
      { label: 'Support', href: '/help' },
      { label: 'Get Started', href: '/register' },
      { label: 'Sign In', href: '/login' },
    ]},
    { title: 'Legal', links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Contact Support', href: '/help' },
    ]},
  ]

  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1">
                <Image src="/logo-mark.png" alt="zingDates" width={28} height={28} className="object-contain" />
              </span>
              <span className="text-white font-bold text-lg">zingDates</span>
            </Link>
            <p className="text-sm leading-relaxed">The best place to meet your future partner. Connecting people worldwide since 2024.</p>

            {/* Social */}
            <div className="flex items-center gap-2.5 mt-5">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener" aria-label="zingDates on Instagram" title="Instagram"
                className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] text-gray-300 hover:text-white flex items-center justify-center transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener" aria-label="zingDates on Facebook" title="Facebook"
                className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-[#1877F2] text-gray-300 hover:text-white flex items-center justify-center transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.5-1.5h1.4V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.5v7h3z" />
                </svg>
              </a>
            </div>
          </div>
          {groups.map(g => (
            <div key={g.title}>
              <h4 className="text-white font-semibold mb-4">{g.title}</h4>
              <ul className="space-y-2">
                {g.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2026 zingDates. All rights reserved.</p>
          <Link href="/admin" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Admin Dashboard →
          </Link>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import Image from 'next/image'

export default function SiteFooter() {
  const groups = [
    { title: 'Explore', links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Podcasts', href: '/podcasts' },
      { label: 'Events', href: '/#features' },
      { label: 'Pricing', href: '/#features' },
    ]},
    { title: 'Company', links: [
      { label: 'About', href: '/#how-it-works' },
      { label: 'Testimonials', href: '/#testimonials' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Sign In', href: '/login' },
    ]},
    { title: 'Legal', links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Contact Us', href: '/contact' },
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

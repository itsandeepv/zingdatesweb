import Link from 'next/link'

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
      { label: 'Get Started', href: '/register' },
      { label: 'Sign In', href: '/login' },
    ]},
    { title: 'Legal', links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Safety', href: '/terms' },
    ]},
  ]

  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
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

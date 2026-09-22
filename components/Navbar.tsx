'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { blogApi, podcastApi } from '@/lib/api'
import { toList } from '@/lib/site'

/* Dropdown nav item with lazily-loaded category links (mega-menu style). */
function NavMenu({
  label,
  href,
  loadCategories,
  className,
  active,
}: {
  label: string
  href: string
  loadCategories: () => Promise<string[]>
  className: string
  active: boolean
}) {
  const [open, setOpen] = useState(false)
  const [cats, setCats] = useState<string[] | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
    if (cats === null) {
      loadCategories().then(setCats).catch(() => setCats([]))
    }
  }
  function hide() {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-1 ${className}`}
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </Link>

      {open && (
        <div className="absolute left-0 top-full pt-3 w-56">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
            <Link href={href} className="block px-3 py-2 rounded-xl text-sm font-semibold text-gray-900 hover:bg-pink-50 hover:text-pink-600 transition-colors">
              All {label}
            </Link>
            {cats && cats.length > 0 && <div className="my-1 h-px bg-gray-100" />}
            {cats === null ? (
              <p className="px-3 py-2 text-xs text-gray-400">Loading…</p>
            ) : (
              cats.slice(0, 6).map(c => (
                <Link
                  key={c}
                  href={`${href}?category=${encodeURIComponent(c)}`}
                  className="block px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                >
                  {c}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * `overlay`: sit transparently on top of a dark hero (white text) until the
 * page scrolls, then switch to the usual white bar. Off by default so every
 * other page keeps the solid bar.
 */
export default function Navbar({ overlay = false }: { overlay?: boolean }) {
  const { user, isLoggedIn, clearAuth } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!overlay) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    const raf = requestAnimationFrame(onScroll)   // initial position, off the effect's own tick
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll) }
  }, [overlay])

  const loggedIn = mounted && isLoggedIn()
  // Light (white-on-dark) only while the transparent bar sits over the hero.
  const light = overlay && !scrolled && !mobileOpen
  const linkCls = light ? 'text-white/85 hover:text-white' : 'text-gray-600 hover:text-gray-900'

  // A section counts as current for its own page and anything nested under it
  // (/events also lights up on /events/42). Hash links point at the home page,
  // so they never win.
  const pathname = usePathname()
  const isActive = (href: string) =>
    href.startsWith('/') && !href.includes('#') &&
    (pathname === href || pathname.startsWith(`${href}/`))

  // Current section: brand pink on the white bar, solid white on the overlay,
  // with a matching underline so it reads at a glance either way.
  const navLink = (href: string) =>
    `relative text-sm font-medium transition-colors ${
      isActive(href)
        ? `${light ? 'text-white' : 'text-pink-600'} after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-0.5 after:rounded-full after:bg-current`
        : linkCls
    }`

  const blogCats = () => blogApi.categories().then(r => toList(r).map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.category)).filter(Boolean))
  const podcastCats = () => podcastApi.categories().then(r => toList(r).map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.category)).filter(Boolean))

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
      light ? 'bg-transparent border-b border-transparent' : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-mark.png" alt="zingDates" width={36} height={36} priority className="w-9 h-9 object-contain" />
          <span className={`text-xl font-bold ${light ? 'text-white' : 'gradient-brand-text'}`}>zingDates</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <NavMenu label="Blog" href="/blog" loadCategories={blogCats} className={navLink('/blog')} active={isActive('/blog')} />
          <NavMenu label="Podcasts" href="/podcasts" loadCategories={podcastCats} className={navLink('/podcasts')} active={isActive('/podcasts')} />
          <Link href="/events" aria-current={isActive('/events') ? 'page' : undefined} className={navLink('/events')}>Events</Link>
          <Link href="/companions" aria-current={isActive('/companions') ? 'page' : undefined} className={navLink('/companions')}>Companions</Link>
          <Link href="/about" aria-current={isActive('/about') ? 'page' : undefined} className={navLink('/about')}>About</Link>
          <Link href="/help" aria-current={isActive('/help') ? 'page' : undefined} className={navLink('/help')}>Support</Link>
          <a href="/#features" className={`text-sm font-medium transition-colors ${linkCls}`}>Features</a>
        </div>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <span className={`text-sm font-medium ${light ? 'text-white' : 'text-gray-700'}`}>{user?.name}</span>
              </div>
              <button
                onClick={() => { clearAuth(); window.location.href = '/' }}
                className={`text-sm font-medium hidden sm:block ${linkCls}`}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`text-sm font-medium hidden sm:block ${linkCls}`}>
                Sign In
              </Link>
              <Link href="/register" className="gradient-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-brand hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button className={`md:hidden w-9 h-9 flex items-center justify-center rounded-lg ${light ? 'text-white hover:bg-white/15' : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => setMobileOpen(v => !v)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {[
            { label: 'Blog', href: '/blog' },
            { label: 'Podcasts', href: '/podcasts' },
            { label: 'Events', href: '/events' },
            { label: 'Companions', href: '/companions' },
            { label: 'About', href: '/about' },
            { label: 'Support', href: '/help' },
            { label: 'Features', href: '/#features' },
            { label: 'How It Works', href: '/#how-it-works' },
          ].map(l => (
            <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                isActive(l.href)
                  ? 'bg-pink-50 text-pink-600'
                  : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
              }`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { blogApi, podcastApi } from '@/lib/api'
import { toList } from '@/lib/site'

/* Dropdown nav item with lazily-loaded category links (mega-menu style). */
function NavMenu({
  label,
  href,
  loadCategories,
}: {
  label: string
  href: string
  loadCategories: () => Promise<string[]>
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
        className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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

export default function Navbar() {
  const { user, isLoggedIn, clearAuth } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const loggedIn = mounted && isLoggedIn()

  const blogCats = () => blogApi.categories().then(r => toList(r).map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.category)).filter(Boolean))
  const podcastCats = () => podcastApi.categories().then(r => toList(r).map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.category)).filter(Boolean))

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center shadow-brand">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <span className="text-xl font-bold gradient-brand-text">zingDates</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <NavMenu label="Blog" href="/blog" loadCategories={blogCats} />
          <NavMenu label="Podcasts" href="/podcasts" loadCategories={podcastCats} />
          <a href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
          <a href="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
        </div>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={() => { clearAuth(); window.location.href = '/' }}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">
                Sign In
              </Link>
              <Link href="/register" className="gradient-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-brand hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100" onClick={() => setMobileOpen(v => !v)}>
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
            { label: 'Features', href: '/#features' },
            { label: 'How It Works', href: '/#how-it-works' },
          ].map(l => (
            <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

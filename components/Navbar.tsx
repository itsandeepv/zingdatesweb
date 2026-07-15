'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { blogApi, podcastApi } from '@/lib/api'
import { toList } from '@/lib/site'

function UserMenu({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-pink-50 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 max-w-[96px] truncate">{name}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-2 w-52 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 overflow-hidden">
            <Link
              href="/discover"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">Dashboard</p>
                <p className="text-[11px] text-gray-400">Go to your app</p>
              </div>
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">My Profile</p>
                <p className="text-[11px] text-gray-400">Edit your profile</p>
              </div>
            </Link>
            <div className="my-1 h-px bg-gray-100 mx-2" />
            <button
              onClick={() => { setOpen(false); onSignOut() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600 group-hover:text-red-600 transition-colors">Sign Out</p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
          <Image src="/logo-mark.png" alt="zingDates" width={36} height={36} priority className="w-9 h-9 object-contain" />
          <span className="text-xl font-bold gradient-brand-text">zingDates</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <NavMenu label="Blog" href="/blog" loadCategories={blogCats} />
          <NavMenu label="Podcasts" href="/podcasts" loadCategories={podcastCats} />
          <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">About</Link>
          <a href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
        </div>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/discover"
                className="gradient-brand text-white text-sm font-semibold px-4 py-2 rounded-full shadow-brand hover:opacity-90 transition-opacity"
              >
                Dashboard
              </Link>
              <UserMenu
                name={user?.name ?? 'User'}
                onSignOut={() => { clearAuth(); window.location.href = '/' }}
              />
            </div>
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
          {loggedIn && (
            <>
              <div className="flex items-center gap-3 px-3 py-3 mb-1">
                <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.phone ?? user?.email ?? ''}</p>
                </div>
              </div>
              <Link href="/discover" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold gradient-brand text-white mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Dashboard
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                My Profile
              </Link>
              <div className="h-px bg-gray-100 my-1" />
            </>
          )}
          {[
            { label: 'Blog', href: '/blog' },
            { label: 'Podcasts', href: '/podcasts' },
            { label: 'About', href: '/about' },
            { label: 'Features', href: '/#features' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'Contact Us', href: '/contact' },
          ].map(l => (
            <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600">
              {l.label}
            </Link>
          ))}
          {loggedIn && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={() => { setMobileOpen(false); clearAuth(); window.location.href = '/' }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { callApi } from '@/lib/api'

function Avatar({ name, src, size = 'sm' }: { name: string; src?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'
  if (src) return <img src={src} alt={name} className={`${dim} rounded-full object-cover`} />
  return (
    <div className={`${dim} rounded-full gradient-brand flex items-center justify-center text-white font-bold`}>
      {name?.[0]?.toUpperCase() ?? 'U'}
    </div>
  )
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = `transition-colors flex-shrink-0 ${active ? 'text-white' : 'text-white/50'}`
  if (name === 'discover') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill={active ? 'none' : 'none'} stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
  if (name === 'heart') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
  if (name === 'chat') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill={active ? 'none' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
  if (name === 'bell') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill={active ? 'none' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
  if (name === 'settings') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
  return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill={active ? 'none' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const NAV = [
  { href: '/discover', label: 'Discover', icon: 'discover' },
  { href: '/matches', label: 'Matches', icon: 'heart' },
  { href: '/chat', label: 'Chat', icon: 'chat' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/profile', label: 'Profile', icon: 'person' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

const PAGE_TITLES: Record<string, string> = {
  '/discover': 'Discover',
  '/matches': 'Matches',
  '/chat': 'Messages',
  '/notifications': 'Notifications',
  '/profile': 'My Profile',
  '/settings': 'Settings',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { token, user } = useAuthStore()
  const [incomingCall, setIncomingCall] = useState<any>(null)

  const isCallPage = pathname?.startsWith('/call')

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) =>
    pathname === k || (k !== '/discover' && pathname?.startsWith(k + '/'))
  )?.[1] ?? ''

  useEffect(() => {
    if (!token || isCallPage) return
    const iv = setInterval(async () => {
      try {
        const call = await callApi.pending(token)
        if (call?.id && !incomingCall) setIncomingCall(call)
      } catch {}
    }, 6000)
    return () => clearInterval(iv)
  }, [token, isCallPage, incomingCall])

  if (isCallPage) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-60 gradient-sidebar flex flex-col z-40 shadow-2xl">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/discover" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center shadow-brand">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">zingDates</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/discover' && pathname?.startsWith(item.href + '/'))
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`}>
                <NavIcon name={item.icon} active={active} />
                <span className="font-medium text-sm">{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full gradient-brand" />}
              </Link>
            )
          })}
        </nav>

        {/* User profile at bottom */}
        <div className="p-4 border-t border-white/10">
          <Link href="/profile" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/8 transition-colors">
            <Avatar name={user?.name ?? 'U'} src={user?.photo} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name ?? 'User'}</p>
              <p className="text-white/40 text-xs truncate">
                {user?.is_premium
                  ? (user.plan_type === 'vip' ? 'VIP Member' : 'Premium Member')
                  : 'Free Account'}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-30 flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">

        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            {pageTitle && <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications"
              className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </Link>
            <Link href="/profile" className="flex items-center gap-2 pl-2">
              <Avatar name={user?.name ?? 'U'} src={user?.photo} />
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name ?? 'User'}</p>
                <p className="text-xs text-gray-400 leading-tight">{user?.email ?? user?.phone ?? ''}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ── Incoming call modal ──────────────────────────── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center text-white text-3xl font-bold animate-pulse-ring">
                {incomingCall.caller?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-xl">{incomingCall.caller?.name ?? 'Unknown'}</p>
                <p className="text-sm text-gray-500 mt-1 capitalize">{incomingCall.type} call incoming...</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  try { await callApi.decline(token!, incomingCall.id) } catch {}
                  setIncomingCall(null)
                }}
                className="flex-1 py-3.5 rounded-2xl bg-red-100 text-red-600 font-semibold flex items-center justify-center gap-2 hover:bg-red-200 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.19 19.79 19.79 0 01.36 10.56 2 2 0 012 12.18V15a2 2 0 002 1.72 12.84 12.84 0 00.7-2.81 2 2 0 01-.45-2.11L5.52 10.7A16 16 0 006.06 14" />
                  <line x1="23" y1="1" x2="1" y2="23" />
                </svg>
                Decline
              </button>
              <button
                onClick={() => {
                  setIncomingCall(null)
                  router.push(`/call/${incomingCall.id}?role=callee&type=${incomingCall.type}`)
                }}
                className="flex-1 py-3.5 rounded-2xl gradient-brand text-white font-semibold flex items-center justify-center gap-2 shadow-brand hover:opacity-90 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

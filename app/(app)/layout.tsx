'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { callApi } from '@/lib/api'

function Avatar({ name, src, size = 'sm' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-11 h-11 text-base' : size === 'md' ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-sm'
  if (src) return <img src={src} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  return (
    <div className={`${dim} rounded-full gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() ?? 'U'}
    </div>
  )
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = `transition-colors flex-shrink-0`
  const color = active ? 'white' : 'rgba(255,255,255,0.45)'

  if (name === 'discover') return (
    <svg className={cls} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
  if (name === 'heart') return (
    <svg className={cls} width="19" height="19" viewBox="0 0 24 24" fill={active ? color : 'none'} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
  if (name === 'companion') return (
    <svg className={cls} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
  if (name === 'chat') return (
    <svg className={cls} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
  if (name === 'bell') return (
    <svg className={cls} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
  if (name === 'settings') return (
    <svg className={cls} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
  // person / profile
  return (
    <svg className={cls} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const NAV = [
  { href: '/discover',      label: 'Discover',      icon: 'discover'   },
  { href: '/matches',       label: 'Matches',        icon: 'heart'      },
  { href: '/companion',     label: 'Companion',      icon: 'companion'  },
  { href: '/chat',          label: 'Chat',           icon: 'chat'       },
  { href: '/notifications', label: 'Notifications',  icon: 'bell'       },
  { href: '/profile',       label: 'Profile',        icon: 'person'     },
]

const PAGE_TITLES: Record<string, string> = {
  '/discover':      'Discover',
  '/matches':       'Matches',
  '/companion':     'Companion',
  '/chat':          'Messages',
  '/notifications': 'Notifications',
  '/profile':       'My Profile',
  '/settings':      'Settings',
  '/plans':         'Upgrade Plan',
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
        const call = await callApi.incoming(token)
        if (call?.id && !incomingCall) setIncomingCall(call)
      } catch {}
    }, 6000)
    return () => clearInterval(iv)
  }, [token, isCallPage, incomingCall])

  if (isCallPage) return <>{children}</>

  const planLabel = user?.is_premium
    ? (user.plan_type === 'vip' ? 'VIP Member' : 'Premium')
    : 'Free'

  const planColor = user?.plan_type === 'vip'
    ? 'bg-amber-400/20 text-amber-300'
    : user?.is_premium
      ? 'bg-pink-400/20 text-pink-300'
      : 'bg-white/10 text-white/40'

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-[220px] gradient-sidebar flex flex-col z-40"
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.25)' }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <Link href="/discover" className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 4px 14px rgba(233,30,140,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="text-[17px] font-extrabold text-white tracking-tight">zingDates</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/8 mb-2" />

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href ||
              (item.href !== '/discover' && pathname?.startsWith(item.href + '/'))
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group ${
                  active
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/85'
                }`}
                style={active ? {
                  background: 'linear-gradient(90deg, rgba(233,30,140,0.18) 0%, rgba(156,39,176,0.08) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(233,30,140,0.2)',
                } : {}}>

                {/* Left accent bar */}
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                    style={{ background: 'linear-gradient(180deg, #E91E8C 0%, #9C27B0 100%)' }} />
                )}

                {/* Icon wrapper */}
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                  active
                    ? 'bg-white/12'
                    : 'group-hover:bg-white/6'
                }`}>
                  <NavIcon name={item.icon} active={active} />
                </span>

                <span className={`text-[13.5px] font-semibold leading-none transition-colors ${
                  active ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Plans upgrade nudge */}
        {!user?.is_premium && (
          <div className="mx-3 mb-3">
            <Link href="/plans"
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.22) 0%, rgba(156,39,176,0.22) 100%)', border: '1px solid rgba(233,30,140,0.25)' }}>
              <span className="text-lg leading-none">👑</span>
              <div className="min-w-0">
                <p className="text-white text-[12px] font-bold leading-tight">Upgrade to VIP</p>
                <p className="text-white/50 text-[10px] leading-tight mt-0.5">Unlock all features</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" className="flex-shrink-0 ml-auto">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>
        )}

        {/* Divider */}
        <div className="mx-5 h-px bg-white/8" />

        {/* User profile */}
        <div className="p-3">
          <Link href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors group">
            <div className="relative flex-shrink-0">
              <Avatar name={user?.name ?? 'U'} src={user?.photo} size="lg" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
                style={{ borderColor: '#1a1235' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-semibold truncate leading-tight">{user?.name ?? 'User'}</p>
              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 leading-tight ${planColor}`}>
                {planLabel}
              </span>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"
              className="flex-shrink-0 group-hover:stroke-white/50 transition-colors">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">

        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            {pageTitle && <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications"
              className="relative p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </Link>
            <Link href="/profile" className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <Avatar name={user?.name ?? 'U'} src={user?.photo} />
              <div className="hidden md:block text-left leading-tight">
                <p className="text-sm font-semibold text-gray-800">{user?.name ?? 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email ?? user?.phone ?? ''}</p>
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
                <p className="text-sm text-gray-500 mt-1 capitalize">{incomingCall.type} call incoming…</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  try { await callApi.decline(token!, incomingCall.id) } catch {}
                  setIncomingCall(null)
                }}
                className="flex-1 py-3.5 rounded-2xl bg-red-50 text-red-500 font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Decline
              </button>
              <button
                onClick={() => {
                  setIncomingCall(null)
                  router.push(`/call/${incomingCall.id}?role=callee&type=${incomingCall.type}`)
                }}
                className="flex-1 py-3.5 rounded-2xl gradient-brand text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ boxShadow: '0 4px 16px rgba(233,30,140,0.35)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

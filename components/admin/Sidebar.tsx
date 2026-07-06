'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/lib/store/auth'

/* ─── Icons (inline SVG paths) ──────────────────────── */
const Icon = ({ path, className = 'w-5 h-5' }: { path: string | string[]; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(path) ? path : [path]).map((d, i) => <path key={i} d={d} />)}
  </svg>
)

const ICONS = {
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  users:    ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75', 'M9 7a4 4 0 100 8 4 4 0 000-8z'],
  card:     ['M3 10h18', 'M7 15h.01', 'M11 15h2', 'M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z'],
  dollar:   ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'],
  calendar: ['M3 9h18', 'M8 3v4', 'M16 3v4', 'M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z'],
  heart:    'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  bell:     ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'],
  file:     ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  search:   ['M21 21l-4.35-4.35', 'M17 11A6 6 0 105 11a6 6 0 0012 0z'],
  megaphone:['M3 11l19-9-9 19-2-8-8-2z'],
  bar:      ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  ticket:   ['M15 5v2', 'M15 11v2', 'M15 17v2', 'M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'],
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  lock:     ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M7 11V7a5 5 0 0110 0v4'],
  phone:    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.1 4 2 2 0 012.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.86 6.86l1.28-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  code:     ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  mic:      ['M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z', 'M19 10v2a7 7 0 01-14 0v-2', 'M12 19v4', 'M8 23h8'],
  gear:     ['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'],
  logout:   ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  chevron:  'M9 18l6-6-6-6',
  menu:     ['M3 12h18', 'M3 6h18', 'M3 18h18'],
}

/* ─── Nav structure ─────────────────────────────────── */
interface NavItem { href: string; label: string; icon: keyof typeof ICONS; badge?: string; soon?: boolean }
interface NavGroup { label: string | null; items: NavItem[] }

// `soon: true` = section not yet wired to the app backend (kept, disabled).
const NAV: NavGroup[] = [
  { label: null, items: [
    { href: '/admin', label: 'Dashboard', icon: 'grid' },
  ]},
  { label: 'Management', items: [
    { href: '/admin/users',          label: 'Users',          icon: 'users' },
    { href: '/admin/companions',     label: 'Companions',     icon: 'heart' },
    { href: '/admin/subscriptions',  label: 'Subscriptions',  icon: 'card' },
    { href: '/admin/payments',       label: 'Payments',       icon: 'dollar' },
    { href: '/admin/events',         label: 'Events',         icon: 'calendar', soon: true },
    { href: '/admin/social',         label: 'Social',         icon: 'heart', soon: true },
  ]},
  { label: 'Content', items: [
    { href: '/admin/content',   label: 'Content CMS', icon: 'file' },
    { href: '/admin/podcasts',  label: 'Podcasts',    icon: 'mic' },
    { href: '/admin/messaging', label: 'Messaging',  icon: 'bell', soon: true },
  ]},
  { label: 'Growth', items: [
    { href: '/admin/seo',       label: 'SEO',       icon: 'search' },
    { href: '/admin/marketing', label: 'Marketing', icon: 'megaphone', soon: true },
    { href: '/admin/analytics', label: 'Analytics', icon: 'bar', soon: true },
  ]},
  { label: 'Operations', items: [
    { href: '/admin/support',  label: 'Support',  icon: 'ticket' },
    { href: '/admin/staff',    label: 'Staff',    icon: 'shield', soon: true },
    { href: '/admin/security', label: 'Security', icon: 'lock', soon: true },
  ]},
  { label: 'Platform', items: [
    { href: '/admin/mobile',   label: 'Mobile App', icon: 'phone', soon: true },
    { href: '/admin/api',      label: 'API',        icon: 'code', soon: true },
    { href: '/admin/settings', label: 'Settings',   icon: 'gear', soon: true },
  ]},
]

/* ─── Component ─────────────────────────────────────── */
interface Props { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore(s => s.user)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const adminName = user?.name ?? 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()
  const logout = () => { clearAuth(); router.replace('/admin-login') }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const sidebarContent = (
    <div className="flex flex-col h-full gradient-sidebar text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center shadow-brand flex-shrink-0">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="font-bold text-lg">zingDates</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-pink-300">Admin</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center shadow-brand mx-auto">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <Icon path={ICONS.menu} className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'pt-2' : ''}>
            {group.label && !collapsed && (
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 px-3 mb-2 mt-3">
                {group.label}
              </p>
            )}
            {group.label && collapsed && gi > 0 && (
              <div className="my-2 mx-3 h-px bg-white/10" />
            )}
            {group.items.map(item => {
              const active = isActive(item.href)

              // Not-yet-wired sections: shown disabled with a "Soon" badge.
              if (item.soon) {
                return (
                  <div
                    key={item.href}
                    title={collapsed ? `${item.label} (coming soon)` : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/25 cursor-not-allowed select-none
                      ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon path={ICONS[item.icon]} className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-white/5 text-white/40 flex-shrink-0">Soon</span>
                      </>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                    ${active
                      ? 'gradient-brand shadow-brand text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon path={ICONS[item.icon]} className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0
                          ${active ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60'}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="border-t border-white/10 p-4">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-sm font-bold">{adminInitial}</div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-sm font-bold flex-shrink-0">{adminInitial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{adminName}</p>
              <p className="text-xs text-white/40 truncate capitalize">{user?.role ?? 'Admin'}</p>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white flex-shrink-0"
              title="Logout"
            >
              <Icon path={ICONS.logout} className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ height: '100vh', position: 'sticky', top: 0 }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 gradient-brand rounded-xl flex items-center justify-center shadow-brand"
        onClick={() => setMobileOpen(v => !v)}
      >
        <Icon path={ICONS.menu} className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}

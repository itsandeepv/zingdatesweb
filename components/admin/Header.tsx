'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const TITLES: Record<string, string> = {
  '/admin':              'Dashboard',
  '/admin/users':        'User Management',
  '/admin/subscriptions':'Subscription Management',
  '/admin/payments':     'Payments & Transactions',
  '/admin/events':       'Event Management',
  '/admin/social':       'Social Networking',
  '/admin/messaging':    'Messaging & Notifications',
  '/admin/content':      'Content Management',
  '/admin/seo':          'SEO Management',
  '/admin/marketing':    'Marketing Automation',
  '/admin/analytics':    'Reports & Analytics',
  '/admin/support':      'Support & Tickets',
  '/admin/staff':        'Staff Management',
  '/admin/security':     'Security & Compliance',
  '/admin/mobile':       'Mobile App Management',
  '/admin/api':          'API Management',
  '/admin/settings':     'Settings',
}

const NOTIFICATIONS = [
  { id: 1, type: 'payment', msg: 'New payment of $599 received', time: '2m ago', dot: 'bg-green-500' },
  { id: 2, type: 'ticket',  msg: 'Support ticket #TK-2891 opened', time: '5m ago', dot: 'bg-red-500' },
  { id: 3, type: 'user',    msg: 'New VIP user: James Wilson', time: '12m ago', dot: 'bg-blue-500' },
  { id: 4, type: 'event',   msg: 'Event "Summer Gala" hit 100% capacity', time: '1h ago', dot: 'bg-purple-500' },
]

export default function AdminHeader() {
  const pathname = usePathname()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [search, setSearch] = useState('')

  const title = TITLES[pathname] ?? 'Admin'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 z-30">
      {/* Title */}
      <div className="flex-1 min-w-0 pl-12 lg:pl-0">
        <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
      </div>

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 w-64">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(v => !v); setShowProfile(false) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors relative"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 gradient-brand rounded-full text-white text-xs flex items-center justify-center font-bold">4</span>
          </button>
          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button className="text-xs font-medium" style={{ color: '#E91E8C' }}>Mark all read</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {NOTIFICATIONS.map(n => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{n.msg}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                  <button className="text-sm font-medium w-full text-center" style={{ color: '#E91E8C' }}>View all notifications</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* View site */}
        <Link href="/" target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Site
        </Link>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false) }}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-xl p-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">R</div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 leading-none">Rahul Mehta</p>
              <p className="text-xs text-gray-500 mt-0.5">Super Admin</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-2">
                {[
                  { label: 'My Profile',    href: '/admin/staff' },
                  { label: 'Settings',      href: '/admin/settings' },
                  { label: 'Security',      href: '/admin/security' },
                  { label: '─────────',    href: '#', divider: true },
                  { label: 'Sign Out',      href: '/login', danger: true },
                ].map((item, i) => item.divider ? (
                  <div key={i} className="my-1 border-t border-gray-100" />
                ) : (
                  <Link key={i} href={item.href}
                    className={`flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${item.danger ? 'text-red-600' : 'text-gray-700'}`}
                    onClick={() => setShowProfile(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

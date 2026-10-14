'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar, { permissionForPath } from '@/components/admin/Sidebar'
import { useAuthStore } from '@/lib/store/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [checked, setChecked] = useState(false)
  const pathname   = usePathname()
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const isAdmin    = useAuthStore(s => s.isAdmin)
  const can        = useAuthStore(s => s.can)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/admin-login'); return }
    if (!isAdmin())    { router.replace('/admin-login'); return }
    setChecked(true)
  }, [])

  // Hiding a sidebar link does not stop anyone typing the URL. Derived during
  // render rather than held in state: it is a pure function of the path and
  // the session, and the layout does not remount between admin pages.
  const requiredPerm = permissionForPath(pathname)
  const denied = checked && requiredPerm !== null && !can(requiredPerm)

  if (!checked) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )

  if (denied) return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">You do not have access to this section</h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Your role does not include it. Ask a Super Admin if you need it added.
          </p>
          <button
            onClick={() => router.replace('/admin')}
            className="mt-5 gradient-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          {/* Spacer for the fixed hamburger button */}
          <div className="w-10 h-10 flex-shrink-0" />
          <div className="flex items-center gap-2 mx-auto">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-xs">Z</span>
            </div>
            <span className="font-bold text-gray-900">Admin Panel</span>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block">
          <AdminDesktopHeader />
        </div>

        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function AdminDesktopHeader() {
  const user = useAuthStore(s => s.user)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 font-medium">Welcome back,</p>
        <p className="text-sm font-bold text-gray-800">{user?.name ?? 'Admin'}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 capitalize border border-pink-100">
          {user?.role ?? 'admin'}
        </span>
        <button
          onClick={() => { clearAuth(); router.replace('/admin-login') }}
          className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
          Sign out
        </button>
      </div>
    </header>
  )
}

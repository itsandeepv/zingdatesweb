'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/Header'
import { useAuthStore } from '@/lib/store/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [checked, setChecked] = useState(false)
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const isAdmin    = useAuthStore(s => s.isAdmin)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/admin-login')
      return
    }
    if (!isAdmin()) {
      router.replace('/admin-login')
      return
    }
    setChecked(true)
  }, [])

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

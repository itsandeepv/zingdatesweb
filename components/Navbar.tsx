'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'

export default function Navbar() {
  const { user, isLoggedIn, clearAuth } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Before mount, always render the logged-out state so the server HTML matches
  const loggedIn = mounted && isLoggedIn()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center shadow-brand">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <span className="text-xl font-bold gradient-brand-text">zingDates</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['features', 'how-it-works', 'testimonials'].map(id => (
            <a key={id} href={`#${id}`} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors capitalize">
              {id === 'how-it-works' ? 'How It Works' : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
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
        </div>
      </div>
    </nav>
  )
}

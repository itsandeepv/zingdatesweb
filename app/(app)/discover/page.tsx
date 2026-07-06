'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { discoverApi, meApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import type { AppUser } from '@/lib/types'

// Resolve coordinates for the nearby query: try the browser, then the user's
// saved profile location, then a sensible default so the feed always loads.
async function resolveCoords(token: string): Promise<{ lat: number; lng: number }> {
  const geo = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 6000, maximumAge: 300000 },
    )
  })
  if (geo) return geo
  try {
    const p: any = await meApi.profile(token)
    const u = p?.user ?? p
    if (u?.lat != null && u?.lng != null) return { lat: Number(u.lat), lng: Number(u.lng) }
  } catch { /* ignore */ }
  return { lat: 28.6139, lng: 77.209 } // New Delhi fallback
}

function ProfileCard({ user, onLike, onSkip, actioning }: {
  user: AppUser
  onLike: () => void
  onSkip: () => void
  actioning: boolean
}) {
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-brand transition-shadow duration-300 group">
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ height: 280 }}>
        {user.photo ? (
          <img src={user.photo} alt={user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full gradient-brand flex items-center justify-center">
            <span className="text-white text-5xl font-bold opacity-40">{initials}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {user.is_premium ? (
            <span className="gradient-brand text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-brand">
              {user.plan_type === 'vip' ? 'VIP' : 'Premium'}
            </span>
          ) : <span />}
          {user.is_online && (
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-700">Online</span>
            </div>
          )}
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg leading-tight">
            {user.name}{user.age ? `, ${user.age}` : ''}
          </h3>
          {user.city && (
            <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {user.city}
            </p>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {user.about && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{user.about}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {user.gender && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 font-medium capitalize">
              {user.gender}
            </span>
          )}
          {user.languages && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
              {user.languages}
            </span>
          )}
          {user.call_rate > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
              ₹{user.call_rate}/min
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            disabled={actioning}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-40">
            Skip
          </button>
          <button
            onClick={onLike}
            disabled={actioning}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Like
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [profiles, setProfiles] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<number | null>(null)
  const [matched, setMatched] = useState<AppUser | null>(null)
  const [skipped, setSkipped] = useState<Set<number>>(new Set())

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const coords = await resolveCoords(token)
      const data = await discoverApi.list(token, coords)
      const list = Array.isArray(data) ? data : (data as any).users ?? []
      setProfiles(list)
      setSkipped(new Set())
    } catch {
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(user: AppUser) {
    if (actioning !== null) return
    setActioning(user.id)
    try {
      const res = await discoverApi.like(token, user.id)
      if (res.matched) {
        setMatched(user)
      } else {
        toast.success(`You liked ${user.name}!`)
      }
      setSkipped(s => new Set([...s, user.id]))
    } catch {
      toast.error('Failed to like')
    } finally {
      setActioning(null)
    }
  }

  function handleSkip(user: AppUser) {
    setSkipped(s => new Set([...s, user.id]))
  }

  const visible = profiles.filter(p => !skipped.has(p.id))

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mt-0.5">{visible.length} profiles near you</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <div className="text-7xl">🌸</div>
          <h2 className="text-xl font-bold text-gray-800">You've seen everyone nearby!</h2>
          <p className="text-gray-500 text-sm max-w-xs">Check back later or refresh to see new profiles in your area.</p>
          <button onClick={load} className="gradient-brand text-white font-semibold px-8 py-3 rounded-xl shadow-brand hover:opacity-90 mt-2">
            Refresh Profiles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visible.map(user => (
            <ProfileCard
              key={user.id}
              user={user}
              onLike={() => handleLike(user)}
              onSkip={() => handleSkip(user)}
              actioning={actioning === user.id}
            />
          ))}
        </div>
      )}

      {/* Match modal */}
      {matched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 text-center space-y-5 shadow-brand-lg w-full max-w-sm">
            <div className="text-6xl animate-float">💖</div>
            <div>
              <h2 className="text-3xl font-extrabold gradient-brand-text">It's a Match!</h2>
              <p className="text-gray-600 text-sm mt-2">You and <strong>{matched.name}</strong> liked each other</p>
            </div>
            {matched.photo && (
              <img src={matched.photo} alt={matched.name} className="w-20 h-20 rounded-full object-cover mx-auto shadow-brand" />
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setMatched(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Keep Browsing
              </button>
              <a href="/chat"
                className="flex-1 py-3 rounded-xl gradient-brand text-white text-sm font-semibold text-center shadow-brand hover:opacity-90 transition-opacity">
                Send Message
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Bell, Video, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { discoverApi, meApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { triggerPlanModal } from '@/components/NoPlanModal'
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
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
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

const APP_NUDGE_KEY = 'zd-app-nudge-v1'

function AppDownloadNudge({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm relative overflow-hidden"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient hero */}
        <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg,#0c0720,#1d0940,#280c3a)' }}>
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: 'radial-gradient(circle,rgba(233,30,140,0.4),transparent 70%)' }} />
          <div className="absolute -bottom-4 left-1/4 w-24 h-24 rounded-full" style={{ background: 'radial-gradient(circle,rgba(156,39,176,0.3),transparent 70%)' }} />
          {/* Phone icon + brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-brand-lg text-2xl">📱</div>
            <div>
              <p className="text-white font-black text-xl leading-none">zingDates</p>
              <p className="text-pink-300 text-xs mt-0.5 font-medium">The App Experience</p>
            </div>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Better on the app</h3>
          <p className="text-gray-500 text-sm text-center mb-5 leading-relaxed">
            Get instant match alerts, faster chats & video calls — all in your pocket.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { Icon: Bell,          label: 'Instant alerts' },
              { Icon: Video,         label: 'Video calls'    },
              { Icon: MessageCircle, label: 'Fast chat'      },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-pink-50">
                <Icon size={20} className="text-pink-600" />
                <span className="text-[10px] font-semibold text-pink-700 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="space-y-2.5">
            <a
              href="#"
              className="flex items-center justify-center gap-2.5 w-full gradient-brand text-white font-bold py-3.5 rounded-2xl shadow-brand hover:opacity-90 active:scale-[.98] transition-all text-sm"
            >
              <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M3.18 23.73c.3.16.66.17.99.04l13.5-7.74-2.85-2.86-11.64 10.56zM.5 1.5C.2 1.83.04 2.3.04 2.83v18.34c0 .53.16 1 .46 1.33l.08.08 10.27-10.26v-.24L.58 1.42.5 1.5zM20.99 10.22l-2.87-1.65-3.18 3.18 3.18 3.18 2.89-1.66c.83-.47.83-1.58-.02-2.05zM3.18.27L16.68 8c.28.16.52.36.71.6L7.12 9.12l-4.02 3.82V3.18c0-.53.16-.99.46-1.33L3.64.77l-.46-.5z"/>
              </svg>
              Download on Google Play
            </a>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Continue on web
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-sm">★</span>)}
            <span className="text-xs text-gray-400 ml-1">4.9 · 50k+ reviews</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const { token, user } = useAuthStore()
  const safeToken = token ?? ''
  const [profiles, setProfiles] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<number | null>(null)
  const [matched, setMatched] = useState<AppUser | null>(null)
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [showAppNudge, setShowAppNudge] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AppUser[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => { if (safeToken) load() }, [safeToken])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(APP_NUDGE_KEY)) return
    const t = setTimeout(() => setShowAppNudge(true), 2500)
    return () => clearTimeout(t)
  }, [])

  // Debounced API search — runs 400ms after user stops typing
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await discoverApi.search(safeToken, q)
        setSearchResults(Array.isArray(results) ? results : [])
      } catch {
        toast.error('Search failed')
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery, safeToken])

  async function load() {
    setLoading(true)
    try {
      const coords = await resolveCoords(safeToken)
      const data = await discoverApi.list(safeToken, coords)
      const list = Array.isArray(data) ? data : (data as any).users ?? []
      setProfiles(list)
      setSkipped(new Set())
    } catch {
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(likedUser: AppUser) {
    // Gate: free users see recharge popup immediately
    if (!user?.is_premium) {
      triggerPlanModal('like')
      return
    }
    if (actioning !== null) return
    setActioning(likedUser.id)
    try {
      const res = await discoverApi.like(safeToken, likedUser.id)
      if (res.matched) {
        setMatched(likedUser)
      } else {
        toast.success(`You liked ${likedUser.name}!`)
      }
      setSkipped(s => new Set([...s, likedUser.id]))
    } catch (err: any) {
      if (err?.status === 402 || err?.message?.toLowerCase().includes('plan')) {
        triggerPlanModal('like')
      } else {
        toast.error('Failed to like')
      }
    } finally {
      setActioning(null)
    }
  }

  function handleSkip(skippedUser: AppUser) {
    setSkipped(s => new Set([...s, skippedUser.id]))
  }

  function dismissNudge() {
    localStorage.setItem(APP_NUDGE_KEY, '1')
    setShowAppNudge(false)
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults(null)
  }

  const isSearchMode = searchQuery.trim().length > 0

  // While API results are loading, show instant local filter as preview
  const visible = (() => {
    if (!isSearchMode) return profiles.filter(p => !skipped.has(p.id))
    const base = searchResults ?? profiles // fallback to local until API responds
    const q = searchQuery.toLowerCase()
    return base.filter(p => {
      if (skipped.has(p.id)) return false
      if (searchResults) return true // API already filtered
      // Local preview filter on name / city / state
      return (
        p.name.toLowerCase().includes(q) ||
        (p.city?.toLowerCase() ?? '').includes(q) ||
        (p.state?.toLowerCase() ?? '').includes(q)
      )
    })
  })()

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Search + refresh bar */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {searching
              ? <div className="w-4 h-4 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
            }
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or city…"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
          />
          {isSearchMode && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={load}
          title="Refresh nearby profiles"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Result count / search label */}
      <p className="text-gray-500 text-sm">
        {isSearchMode
          ? searching
            ? 'Searching…'
            : `${visible.length} result${visible.length !== 1 ? 's' : ''} for "${searchQuery}"`
          : `${visible.length} profiles near you`
        }
      </p>

      {/* Empty state */}
      {visible.length === 0 ? (
        isSearchMode ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <div className="text-6xl">🔍</div>
            <h2 className="text-lg font-bold text-gray-800">No results found</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              No profiles match &ldquo;{searchQuery}&rdquo;. Try a different name or city.
            </p>
            <button onClick={clearSearch} className="gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl shadow-brand hover:opacity-90 text-sm mt-1">
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="text-7xl">🌸</div>
            <h2 className="text-xl font-bold text-gray-800">You&apos;ve seen everyone nearby!</h2>
            <p className="text-gray-500 text-sm max-w-xs">Check back later or refresh to see new profiles in your area.</p>
            <button onClick={load} className="gradient-brand text-white font-semibold px-8 py-3 rounded-xl shadow-brand hover:opacity-90 mt-2">
              Refresh Profiles
            </button>
          </div>
        )
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

      {/* App download nudge — first visit only */}
      {showAppNudge && <AppDownloadNudge onClose={dismissNudge} />}

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

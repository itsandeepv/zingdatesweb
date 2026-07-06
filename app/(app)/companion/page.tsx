'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { companionApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

interface Companion {
  id: number; user_id: number; name: string; age?: number; city?: string
  photo?: string; cover_image?: string; languages?: string; headline?: string; about?: string
  categories?: string[]; coins_per_min: number; rating_avg: number; rating_count: number
  total_sessions: number; is_online: boolean; is_available_now: boolean; is_verified: boolean
}

const QUICK_CATS = [
  { key: '', label: 'All' },
  { key: 'friendship', label: 'Friendship' },
  { key: 'coffee_chat', label: 'Coffee' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'study', label: 'Study' },
  { key: 'language_practice', label: 'Language' },
  { key: 'relationship_advice', label: 'Advice' },
]

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
      <span className="text-xs font-semibold text-gray-600">{Number(value || 0).toFixed(1)}</span>
    </span>
  )
}

function CompanionCard({ c }: { c: Companion }) {
  const from = Math.round((c.coins_per_min || 0) * 15)
  const cover = c.cover_image || c.photo
  const initials = c.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <Link href={`/companion/${c.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-brand transition-shadow duration-300 group block">
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        {cover ? (
          <img src={cover} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full gradient-brand flex items-center justify-center">
            <span className="text-white text-5xl font-bold opacity-40">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {c.is_verified && (
              <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>
                Verified
              </span>
            )}
            {c.is_available_now && (
              <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available
              </span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg leading-tight">{c.name}{c.age ? `, ${c.age}` : ''}</h3>
            <span className={`w-2.5 h-2.5 rounded-full border-2 border-white/70 ${c.is_online ? 'bg-emerald-400' : 'bg-white/40'}`} />
          </div>
          <div className="flex items-center gap-3 mt-1">
            {c.city && <span className="text-white/75 text-xs">{c.city}</span>}
            <Stars value={c.rating_avg} />
          </div>
        </div>
      </div>
      <div className="p-4">
        {c.headline && <p className="text-gray-600 text-sm line-clamp-1 mb-2">{c.headline}</p>}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(c.categories || []).slice(0, 3).map(cat => (
            <span key={cat} className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium capitalize">{cat.replace('_', ' ')}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">from</span>
            <p className="text-lg font-extrabold text-gray-900 leading-none">{from} <span className="text-xs text-purple-600 font-bold">coins</span></p>
          </div>
          <span className="gradient-brand text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-brand group-hover:opacity-90">Book</span>
        </div>
      </div>
    </Link>
  )
}

export default function CompanionFeedPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [items, setItems] = useState<Companion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await companionApi.feed(token, { q: search, category: cat })
      setItems(data.companions ?? [])
    } catch { toast.error('Failed to load companions') }
    finally { setLoading(false) }
  }, [token, search, cat])

  useEffect(() => { load() }, [cat]) // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companions</h1>
          <p className="text-gray-500 text-sm">Book a verified companion for a paid session</p>
        </div>
        <div className="flex gap-2">
          <Link href="/companion/my-bookings" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">My Bookings</Link>
          <Link href="/companion/become" className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand hover:opacity-90">Become a Companion</Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search companions"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUICK_CATS.map(q => (
          <button key={q.key} onClick={() => setCat(q.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${cat === q.key ? 'gradient-brand text-white shadow-brand' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {q.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-72">
          <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center space-y-3">
          <div className="text-6xl">🧑‍🤝‍🧑</div>
          <h2 className="text-lg font-bold text-gray-800">No companions found</h2>
          <p className="text-gray-500 text-sm">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(c => <CompanionCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  )
}

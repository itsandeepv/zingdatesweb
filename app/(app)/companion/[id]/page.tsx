'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { companionApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

const SESSION_TYPES = [
  { key: 'chat', label: 'Chat' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
]
// Rental lengths (value in minutes). Max 5 days.
const DURATIONS = [
  { min: 480,  label: '8 Hours' },
  { min: 1440, label: '1 Day' },
  { min: 2880, label: '2 Days' },
  { min: 4320, label: '3 Days' },
  { min: 5760, label: '4 Days' },
  { min: 7200, label: '5 Days' },
]

function BookingModal({ companion, onClose, onBooked }: { companion: any; onClose: () => void; onBooked: () => void }) {
  const token = useAuthStore(s => s.token) ?? ''
  const router = useRouter()
  const [sessionType, setSessionType] = useState('chat')
  const [duration, setDuration] = useState(1440)
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)

  const fetchQuote = useCallback(async () => {
    setLoading(true)
    try {
      const q = await companionApi.quote(token, companion.id, duration)
      setQuote(q)
    } catch { setQuote(null) }
    finally { setLoading(false) }
  }, [token, companion.id, duration])

  useEffect(() => { fetchQuote() }, [fetchQuote])

  const total = quote?.quote?.coins_total ?? 0
  const balance = quote?.wallet_balance ?? 0
  const canAfford = quote?.can_afford ?? (balance >= total)

  async function confirm() {
    if (!canAfford) return
    setBooking(true)
    try {
      await companionApi.book(token, { companion_id: companion.id, session_type: sessionType, mode: 'instant', duration_min: duration })
      toast.success('Booking confirmed!')
      onBooked()
    } catch (e: any) {
      if (e?.needPlan) {
        toast.error(e?.message ?? 'A Premium or VIP plan is required to book')
        router.push('/plans')
      } else {
        toast.error(e?.message ?? 'Booking failed')
      }
    } finally { setBooking(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Book {companion.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Session type</p>
          <div className="flex gap-2">
            {SESSION_TYPES.map(t => (
              <button key={t.key} onClick={() => setSessionType(t.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${sessionType === t.key ? 'gradient-brand text-white border-transparent shadow-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Duration</p>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map(d => (
              <button key={d.min} onClick={() => setDuration(d.min)}
                className={`py-2.5 rounded-xl text-sm font-bold border ${duration === d.min ? 'gradient-brand text-white border-transparent shadow-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-purple-50 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total cost</span>
            <span className="text-xl font-extrabold text-purple-700">{loading ? '…' : `${total} coins`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Your balance</span>
            <span className={`text-xs font-bold ${canAfford ? 'text-emerald-600' : 'text-red-500'}`}>{balance} coins</span>
          </div>
        </div>

        {!canAfford && !loading && (
          <p className="text-red-500 text-xs text-center">Not enough coins. Please top up your wallet.</p>
        )}

        <button onClick={confirm} disabled={booking || loading || !canAfford}
          className="w-full py-3.5 rounded-2xl gradient-brand text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50">
          {booking ? 'Booking…' : `Confirm & Pay ${total} coins`}
        </button>
        <p className="text-[11px] text-gray-400 text-center leading-snug">
          Coins are held when you book and released to the companion after the session. Cancel before it starts for a full refund.
        </p>
      </div>
    </div>
  )
}

export default function CompanionProfilePage() {
  const params = useParams()
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''
  const id = Number(params?.id)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await companionApi.profile(token, id)
        setData(res)
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    })()
  }, [token, id])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
    </div>
  )
  if (!data?.companion) return <div className="text-center text-gray-500 py-20">Companion not found.</div>

  const c = data.companion
  const reviews = data.reviews ?? []
  const cover = c.cover_image || c.photo

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/companion" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">← Back</Link>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="relative" style={{ height: 260 }}>
          {cover ? <img src={cover} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-brand" />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2">
              <h1 className="text-white text-2xl font-extrabold">{c.name}{c.age ? `, ${c.age}` : ''}</h1>
              {c.is_verified && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
              {c.city && <span>{c.city}</span>}
              <span className="text-amber-400 font-semibold">★ {Number(c.rating_avg || 0).toFixed(1)} ({c.rating_count})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="p-4 text-center"><p className="text-lg font-extrabold text-gray-900">{c.total_sessions || 0}</p><p className="text-xs text-gray-400">Sessions</p></div>
          <div className="p-4 text-center"><p className="text-lg font-extrabold text-gray-900">{c.followers_count || 0}</p><p className="text-xs text-gray-400">Followers</p></div>
          <div className="p-4 text-center"><p className="text-lg font-extrabold text-gray-900">{c.response_time_min || 0}m</p><p className="text-xs text-gray-400">Responds</p></div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pricing</p>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(d => (
                <div key={d.min} className="border border-gray-100 rounded-xl py-2 text-center">
                  <p className="text-xs text-gray-400">{d.label}</p>
                  <p className="text-base font-extrabold text-purple-700">{Math.round((c.coins_per_min || 0) * d.min)}</p>
                </div>
              ))}
            </div>
          </div>

          {c.about && <div><p className="text-xs font-bold text-gray-500 uppercase mb-2">About</p><p className="text-sm text-gray-600 leading-relaxed">{c.about}</p></div>}

          {(c.categories?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Available for</p>
              <div className="flex flex-wrap gap-2">
                {c.categories.map((k: string) => <span key={k} className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-medium capitalize">{k.replace('_', ' ')}</span>)}
              </div>
            </div>
          )}

          {c.languages && <div><p className="text-xs font-bold text-gray-500 uppercase mb-2">Languages</p><p className="text-sm text-gray-600">{c.languages}</p></div>}

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Reviews ({c.rating_count || 0})</p>
            {reviews.length === 0 ? <p className="text-sm text-gray-400">No reviews yet.</p> : (
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{r.user?.name ?? 'User'}</span>
                      <span className="text-amber-500 text-xs font-bold">★ {r.rating}</span>
                    </div>
                    {r.review && <p className="text-sm text-gray-600 mt-1">{r.review}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 bg-white rounded-2xl shadow-brand-lg border border-gray-100 p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-400 uppercase">from / 8 hrs</span>
          <p className="text-xl font-extrabold text-gray-900">{Math.round((c.coins_per_min || 0) * 480)} <span className="text-sm text-purple-600">coins</span></p>
        </div>
        <button onClick={() => setShowBooking(true)} className="gradient-brand text-white font-bold px-8 py-3 rounded-xl shadow-brand hover:opacity-90">Book Now</button>
      </div>

      {showBooking && (
        <BookingModal companion={c} onClose={() => setShowBooking(false)} onBooked={() => { setShowBooking(false); router.push('/companion/my-bookings') }} />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
// What the client wants the companion for.
const PURPOSES = [
  { key: 'friendship', label: 'Friend' },
  { key: 'coffee_chat', label: 'Coffee' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'study', label: 'Study' },
  { key: 'language_practice', label: 'Language' },
  { key: 'relationship_advice', label: 'Advice' },
]
const HOUR_CHOICES = [1, 2, 3, 4, 6, 8]
const DAYS_AHEAD = 14

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type Slot = { start: string; end: string; label: string; available: boolean; reason: string | null }

/**
 * Booking flow: purpose -> hours -> date -> a free time slot -> price with GST.
 * No money moves here; the companion accepts first, then the client is asked to
 * pay from My Bookings.
 */
function BookingModal({ companion, onClose, onBooked }: { companion: any; onClose: () => void; onBooked: () => void }) {
  const token = useAuthStore(s => s.token) ?? ''
  const [sessionType, setSessionType] = useState('chat')
  const [purpose, setPurpose] = useState('friendship')
  const [hours, setHours] = useState(1)
  const [dateStr, setDateStr] = useState(ymd(new Date()))
  const [slot, setSlot] = useState<string | null>(null)

  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)

  const days = useMemo(() => {
    const out: { value: string; dow: string; day: number; isToday: boolean }[] = []
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      out.push({ value: ymd(d), dow: d.toLocaleDateString(undefined, { weekday: 'short' }), day: d.getDate(), isToday: i === 0 })
    }
    return out
  }, [])

  // Free hours for the chosen day.
  const loadSlots = useCallback(async () => {
    setLoadingSlots(true)
    setSlot(null)
    try {
      const r = await companionApi.slots(token, companion.id, dateStr)
      setSlots(r.slots ?? [])
    } catch { setSlots([]) }
    finally { setLoadingSlots(false) }
  }, [token, companion.id, dateStr])

  useEffect(() => { loadSlots() }, [loadSlots])

  const fetchQuote = useCallback(async () => {
    setLoading(true)
    try { setQuote((await companionApi.quote(token, companion.id, hours)).quote) }
    catch { setQuote(null) }
    finally { setLoading(false) }
  }, [token, companion.id, hours])

  useEffect(() => { fetchQuote() }, [fetchQuote])

  // A start time only works if the whole run of `hours` after it is free and contiguous.
  const usable = useCallback((i: number) => {
    for (let k = 0; k < hours; k++) {
      const s = slots[i + k]
      if (!s || !s.available) return false
      if (k > 0 && slots[i + k - 1].end !== s.start) return false
    }
    return true
  }, [slots, hours])

  const money = (n: any) => `₹${Number(n ?? 0).toFixed(2)}`

  async function confirm() {
    if (!slot) return
    setBooking(true)
    try {
      await companionApi.book(token, {
        companion_id: companion.id,
        session_type: sessionType,
        category: purpose,
        starts_at: `${dateStr} ${slot}:00`,
        hours,
      })
      toast.success('Request sent — you will be asked to pay once it is accepted.')
      onBooked()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not send the request')
    } finally { setBooking(false) }
  }

  const chip = (on: boolean) =>
    `py-2.5 px-3 rounded-xl text-sm font-semibold border ${on ? 'gradient-brand text-white border-transparent shadow-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md space-y-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Request a date with {companion.name}</h3>
            <p className="text-sm font-bold text-purple-700">₹{Math.round(companion.price_per_hour ?? 0)} / hour</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">What do you need them for?</p>
          <div className="grid grid-cols-3 gap-2">
            {PURPOSES.map(p => (
              <button key={p.key} onClick={() => setPurpose(p.key)} className={chip(purpose === p.key)}>{p.label}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Session type</p>
          <div className="flex gap-2">
            {SESSION_TYPES.map(t => (
              <button key={t.key} onClick={() => setSessionType(t.key)} className={`flex-1 ${chip(sessionType === t.key)}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">How many hours?</p>
          <div className="grid grid-cols-6 gap-2">
            {HOUR_CHOICES.map(h => (
              <button key={h} onClick={() => setHours(h)} className={chip(hours === h)}>{h}h</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Date</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map(d => (
              <button key={d.value} onClick={() => setDateStr(d.value)}
                className={`shrink-0 w-14 py-2 rounded-xl border text-center ${dateStr === d.value ? 'gradient-brand text-white border-transparent shadow-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <span className="block text-[11px] font-bold">{d.isToday ? 'Today' : d.dow}</span>
                <span className="block text-base font-extrabold">{d.day}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Start time</p>
          {loadingSlots ? (
            <p className="text-sm text-gray-400 py-2">Loading times…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Not available on this day. Try another date.</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s, i) => {
                  const ok = usable(i)
                  return (
                    <button key={s.start} onClick={() => ok && setSlot(s.start)} disabled={!ok}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        slot === s.start ? 'gradient-brand text-white border-transparent shadow-brand'
                        : ok ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        : 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'}`}>
                      {s.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Greyed-out times are booked or too short for {hours}h.</p>
            </>
          )}
        </div>

        <div className="bg-purple-50 rounded-2xl p-4 space-y-1.5">
          <Row label={`₹${Math.round(companion.price_per_hour ?? 0)} × ${hours}h`} value={loading ? '…' : money(quote?.amount)} />
          <Row label={`GST (${quote?.gst_percent ?? 18}%)`} value={loading ? '…' : money(quote?.gst_amount)} />
          <div className="h-px bg-purple-200 my-1" />
          <Row label="Total payable" value={loading ? '…' : money(quote?.total_amount)} strong />
        </div>

        <button onClick={confirm} disabled={booking || !slot}
          className="w-full py-3.5 rounded-2xl gradient-brand text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50">
          {booking ? 'Sending…' : 'Send booking request'}
        </button>
        <p className="text-[11px] text-gray-400 text-center leading-snug">
          You pay nothing now. Once {companion.name} accepts, you&apos;ll be asked to pay {money(quote?.total_amount)} — and you can connect right after.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'text-sm font-bold text-gray-800' : 'text-sm text-gray-600'}>{label}</span>
      <span className={strong ? 'text-lg font-extrabold text-purple-700' : 'text-sm font-semibold text-gray-800'}>{value}</span>
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
              {[1, 2, 4, 8].map(h => (
                <div key={h} className="border border-gray-100 rounded-xl py-2 text-center">
                  <p className="text-xs text-gray-400">{h} {h === 1 ? 'Hour' : 'Hours'}</p>
                  <p className="text-base font-extrabold text-purple-700">₹{Math.round((c.price_per_hour || 0) * h)}</p>
                  <p className="text-[10px] text-gray-400">+ GST</p>
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
          <p className="text-xl font-extrabold text-gray-900">₹{Math.round(c.price_per_hour || 0)} <span className="text-sm text-purple-600">/hour</span></p>
        </div>
        <button onClick={() => setShowBooking(true)} className="gradient-brand text-white font-bold px-8 py-3 rounded-xl shadow-brand hover:opacity-90">Request Date</button>
      </div>

      {showBooking && (
        <BookingModal companion={c} onClose={() => setShowBooking(false)} onBooked={() => { setShowBooking(false); router.push('/companion/my-bookings') }} />
      )}
    </div>
  )
}

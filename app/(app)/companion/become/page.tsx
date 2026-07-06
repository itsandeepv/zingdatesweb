'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { companionApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const BANNER: Record<string, { cls: string; text: string }> = {
  pending: { cls: 'bg-amber-50 text-amber-700', text: 'Your profile is pending admin approval.' },
  approved: { cls: 'bg-emerald-50 text-emerald-700', text: 'Your profile is verified and live.' },
  suspended: { cls: 'bg-red-50 text-red-600', text: 'Your profile is suspended. Contact support.' },
  rejected: { cls: 'bg-red-50 text-red-600', text: 'Your profile was rejected. Update and resubmit.' },
}

export default function BecomeCompanionPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  const [form, setForm] = useState({
    headline: '', about: '', coins_per_min: '1', languages: '',
    categories: [] as string[], available_days: [] as number[],
    working_hours_start: '', working_hours_end: '', max_daily_bookings: '',
    auto_accept: false, is_available_now: false,
  })

  function hydrate(p: any) {
    if (!p) return
    setProfile(p)
    setForm({
      headline: p.headline ?? '', about: p.about ?? '', coins_per_min: String(p.coins_per_min ?? '1'),
      languages: p.languages ?? '', categories: p.categories ?? [], available_days: p.available_days ?? [],
      working_hours_start: p.working_hours_start ? String(p.working_hours_start).slice(0, 5) : '',
      working_hours_end: p.working_hours_end ? String(p.working_hours_end).slice(0, 5) : '',
      max_daily_bookings: p.max_daily_bookings ? String(p.max_daily_bookings) : '',
      auto_accept: !!p.auto_accept, is_available_now: !!p.is_available_now,
    })
  }

  useEffect(() => {
    (async () => {
      try {
        const [me, cats] = await Promise.all([companionApi.me(token), companionApi.categories(token)])
        setCategories(cats.categories ?? [])
        hydrate(me.companion)
      } catch { /* noop */ }
      finally { setLoading(false) }
    })()
  }, [token])

  async function enable() {
    setSaving(true)
    try { const res = await companionApi.enable(token); hydrate(res.companion); toast.success('Companion profile created') }
    catch (e: any) {
      if (e?.needPlan) {
        toast.error(e?.message ?? 'A Premium or VIP plan is required to become a companion')
        router.push('/plans')
      } else { toast.error(e?.message ?? 'Failed') }
    }
    finally { setSaving(false) }
  }

  function toggle<T>(arr: T[], v: T): T[] { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }

  async function save() {
    setSaving(true)
    try {
      const payload: any = {
        headline: form.headline, about: form.about, languages: form.languages,
        coins_per_min: parseFloat(form.coins_per_min) || undefined,
        categories: form.categories, available_days: form.available_days,
        auto_accept: form.auto_accept, is_available_now: form.is_available_now,
      }
      if (form.working_hours_start) payload.working_hours_start = form.working_hours_start
      if (form.working_hours_end) payload.working_hours_end = form.working_hours_end
      if (form.max_daily_bookings !== '') payload.max_daily_bookings = parseInt(form.max_daily_bookings, 10) || 0
      const res = await companionApi.saveSettings(token, payload)
      hydrate(res.companion)
      toast.success('Settings saved')
    } catch (e: any) { toast.error(e?.message ?? 'Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" /></div>

  const banner = profile ? BANNER[profile.status] : null
  const input = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200'
  const label = 'text-xs font-bold text-gray-500 uppercase mb-2 block'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Companion Mode</h1>
        <Link href="/companion" className="text-sm text-gray-500 hover:text-gray-800">← Companions</Link>
      </div>

      {!profile ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <div className="text-5xl">🧑‍🤝‍🧑</div>
          <h2 className="text-xl font-bold text-gray-900">Become a Companion</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">Get booked for paid online sessions — chat, voice/video, gaming, study, language practice, mentoring and more. You set your price and your hours.</p>
          <button onClick={enable} disabled={saving} className="gradient-brand text-white font-bold px-8 py-3 rounded-xl shadow-brand hover:opacity-90 disabled:opacity-50">
            {saving ? 'Creating…' : 'Enable Companion Profile'}
          </button>
        </div>
      ) : (
        <>
          {banner && <div className={`rounded-2xl p-4 text-sm font-semibold ${banner.cls}`}>{banner.text}</div>}
          <Link href="/companion/creator" className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:bg-gray-50">
            <span className="font-bold text-purple-700">Open Creator Dashboard</span>
            <span className="text-gray-400">→</span>
          </Link>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div><label className={label}>Headline</label><input className={input} value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="Friendly gamer & language buddy" /></div>
            <div><label className={label}>About you</label><textarea className={`${input} h-24`} value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} placeholder="What a session with you is like" /></div>
            <div>
              <label className={label}>Price (coins per minute)</label>
              <input className={input} value={form.coins_per_min} onChange={e => setForm(f => ({ ...f, coins_per_min: e.target.value.replace(/[^0-9.]/g, '') }))} inputMode="decimal" />
              <p className="text-xs text-purple-500 mt-1">A 1-day rental costs {Math.round((parseFloat(form.coins_per_min) || 0) * 1440)} coins · 8 hours {Math.round((parseFloat(form.coins_per_min) || 0) * 480)} coins.</p>
            </div>
            <div>
              <label className={label}>Available for</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => {
                  const on = form.categories.includes(c.key)
                  return <button key={c.key} onClick={() => setForm(f => ({ ...f, categories: toggle(f.categories, c.key) }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${on ? 'gradient-brand text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{c.label}</button>
                })}
              </div>
            </div>
            <div><label className={label}>Languages</label><input className={input} value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} placeholder="Hindi, English" /></div>
            <div>
              <label className={label}>Available days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, i) => {
                  const on = form.available_days.includes(i)
                  return <button key={d} onClick={() => setForm(f => ({ ...f, available_days: toggle(f.available_days, i) }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${on ? 'gradient-brand text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{d}</button>
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Start time</label><input className={input} value={form.working_hours_start} onChange={e => setForm(f => ({ ...f, working_hours_start: e.target.value }))} placeholder="09:00" /></div>
              <div><label className={label}>End time</label><input className={input} value={form.working_hours_end} onChange={e => setForm(f => ({ ...f, working_hours_end: e.target.value }))} placeholder="21:00" /></div>
            </div>
            <div><label className={label}>Max bookings/day</label><input className={input} value={form.max_daily_bookings} onChange={e => setForm(f => ({ ...f, max_daily_bookings: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="0 = unlimited" inputMode="numeric" /></div>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-gray-800">Auto-accept bookings</span>
              <input type="checkbox" checked={form.auto_accept} onChange={e => setForm(f => ({ ...f, auto_accept: e.target.checked }))} className="w-5 h-5 accent-purple-600" />
            </label>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-gray-800">Available now</span>
              <input type="checkbox" checked={form.is_available_now} onChange={e => setForm(f => ({ ...f, is_available_now: e.target.checked }))} className="w-5 h-5 accent-purple-600" />
            </label>
            <button onClick={save} disabled={saving} className="w-full py-3 rounded-2xl gradient-brand text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

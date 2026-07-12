'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { meApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

const INTERESTS = [
  'Travel', 'Music', 'Fitness', 'Photography', 'Cooking', 'Movies',
  'Tech', 'Art', 'Sports', 'Reading', 'Gaming', 'Fashion',
]

const STEPS = [
  { label: 'Basic', title: 'Basic Info',    sub: 'Tell us who you are' },
  { label: 'About', title: 'About You',     sub: 'Share a bit more about yourself' },
  { label: 'Vibes', title: 'Your Interests', sub: 'Pick at least 3 that match you' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { token, setAuth, _hasHydrated } = useAuthStore(
    useShallow(s => ({ token: s.token, setAuth: s.setAuth, _hasHydrated: s._hasHydrated }))
  )

  const [step, setStep]       = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    name: '', gender: '', dob: '',
    bio: '', about: '', city: '',
    interests: [] as string[],
  })

  useEffect(() => {
    if (!_hasHydrated) return   // wait for Zustand to rehydrate from localStorage
    if (!token) router.replace('/login')
  }, [_hasHydrated, token, router])

  function set(key: keyof typeof form, val: string | string[]) {
    setForm(f => ({ ...f, [key]: val }))
  }
  function toggleInterest(tag: string) {
    set('interests', form.interests.includes(tag)
      ? form.interests.filter(t => t !== tag)
      : [...form.interests, tag])
  }

  async function next(e: { preventDefault(): void }) {
    e.preventDefault()
    if (step < 3) { setStep(s => (s + 1) as 1 | 2 | 3); return }

    setLoading(true)
    try {
      const res = await meApi.update(token!, {
        name:   form.name   || undefined,
        gender: form.gender ? form.gender.toLowerCase() : undefined,
        dob:    form.dob    || undefined,
        bio:    form.bio    || undefined,
        about:  form.about  || undefined,
        city:   form.city   || undefined,
      })
      setAuth(token!, res.user ?? res)
      toast.success('Welcome to zingDates!')
      window.location.href = '/discover'
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const s = STEPS[step - 1]

  return (
    <div className="space-y-6">

      {/* ── Step indicator ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
        <p className="text-gray-400 text-sm mt-1">{s.sub}</p>

        <div className="flex items-start mt-5">
          {STEPS.map((st, i) => {
            const n     = i + 1
            const done  = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-start flex-1 last:flex-none">
                {/* Circle + label */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: done   ? 'linear-gradient(135deg,#E91E8C,#9C27B0)' : 'transparent',
                      border:     active ? '2px solid #E91E8C' : done ? 'none' : '2px solid #e5e7eb',
                      color:      done   ? '#fff' : active ? '#E91E8C' : '#d1d5db',
                    }}>
                    {done
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      : n}
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: active ? '#E91E8C' : done ? '#9C27B0' : '#d1d5db' }}>
                    {st.label}
                  </span>
                </div>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mt-4 mx-2 rounded-full transition-all"
                       style={{ background: step > n ? 'linear-gradient(to right,#E91E8C,#9C27B0)' : '#f3f4f6' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={next} className="space-y-4">

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <>
            <Field label="Full Name" type="text" value={form.name} onChange={v => set('name', v)}
                   placeholder="Priya Sharma" required />

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Other'].map(g => (
                  <button
                    key={g} type="button" onClick={() => set('gender', g)}
                    className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                    style={{
                      background:   form.gender === g ? 'linear-gradient(135deg,#E91E8C,#9C27B0)' : 'transparent',
                      borderColor:  form.gender === g ? 'transparent' : '#e5e7eb',
                      color:        form.gender === g ? '#fff' : '#6b7280',
                      boxShadow:    form.gender === g ? '0 4px 14px rgba(233,30,140,0.3)' : 'none',
                    }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Date of Birth" type="date" value={form.dob} onChange={v => set('dob', v)} required />
          </>
        )}

        {/* Step 2 — About You */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all resize-none text-gray-900 placeholder:text-gray-300" />
            </div>
            <Field label="Short Tagline" type="text" value={form.about} onChange={v => set('about', v)}
                   placeholder="e.g. Coffee lover, dog dad" />
            <Field label="City" type="text" value={form.city} onChange={v => set('city', v)} placeholder="Mumbai" />

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl gradient-brand-soft flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Profile Photo</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Add photos from your profile settings after signup.</p>
              </div>
            </div>
          </>
        )}

        {/* Step 3 — Interests */}
        {step === 3 && (
          <>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(tag => {
                const selected = form.interests.includes(tag)
                return (
                  <button
                    key={tag} type="button" onClick={() => toggleInterest(tag)}
                    className="px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all"
                    style={{
                      background:  selected ? 'linear-gradient(135deg,#E91E8C,#9C27B0)' : 'transparent',
                      borderColor: selected ? 'transparent' : '#e5e7eb',
                      color:       selected ? '#fff' : '#6b7280',
                      boxShadow:   selected ? '0 2px 10px rgba(233,30,140,0.25)' : 'none',
                    }}>
                    {tag}
                  </button>
                )
              })}
            </div>

            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3 border transition-all"
              style={{
                background:   form.interests.length >= 3 ? 'rgba(16,185,129,0.06)'  : '#f9fafb',
                borderColor:  form.interests.length >= 3 ? 'rgba(16,185,129,0.25)'  : '#f3f4f6',
              }}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{
                  background: form.interests.length >= 3 ? '#10b981' : '#e5e7eb',
                  color:      '#fff',
                }}>
                {form.interests.length >= 3 ? '✓' : form.interests.length}
              </div>
              <p className="text-xs font-medium" style={{ color: form.interests.length >= 3 ? '#065f46' : '#9ca3af' }}>
                {form.interests.length < 3
                  ? `Select ${3 - form.interests.length} more to continue`
                  : `${form.interests.length} interests selected — looking good!`}
              </p>
            </div>
          </>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading || (step === 3 && form.interests.length < 3)}
          className="w-full gradient-brand text-white font-bold py-4 rounded-2xl shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[15px] tracking-wide mt-2">
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </span>
            : step < 3 ? 'Continue →' : 'Finish Setup'}
        </button>

        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2 font-medium">
            ← Back
          </button>
        )}
      </form>

      {/* ── Already set up ── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            Already set up?
          </span>
        </div>
      </div>

      <Link
        href="/discover"
        className="block w-full text-center py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-bold text-gray-500 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 transition-all">
        Go to Discover
      </Link>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, required }: {
  label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-300" />
    </div>
  )
}

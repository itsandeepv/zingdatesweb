'use client'

import { useState, useEffect, useRef } from 'react'
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
  { label: 'Basic', title: 'Basic Info',    sub: 'A photo and a few details so people know who you are' },
  { label: 'About', title: 'About You',     sub: 'Share a bit more about yourself' },
  { label: 'Vibes', title: 'Your Interests', sub: 'Pick at least 3 that match you' },
]

const MIN_AGE      = 18
const MIN_BIO      = 20
const MIN_INTERESTS = 3
const MAX_PHOTO_MB = 5

// ApiError extends Error, so its server message comes through here.
function errMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
}

function calcAge(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

// Latest birth date that still clears the age gate — also caps the native picker.
function maxDob(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE)
  return d.toISOString().slice(0, 10)
}

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

  // The photo goes up as soon as it is picked (same endpoint the profile page
  // uses), so by submit time we only have to save its URL with the rest.
  const [photoUrl, setPhotoUrl]         = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploading, setUploading]       = useState(false)
  const fileRef    = useRef<HTMLInputElement>(null)
  const previewRef = useRef('')

  useEffect(() => {
    if (!_hasHydrated) return   // wait for Zustand to rehydrate from localStorage
    if (!token) router.replace('/login')
  }, [_hasHydrated, token, router])

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])

  function set(key: keyof typeof form, val: string | string[]) {
    setForm(f => ({ ...f, [key]: val }))
  }
  function toggleInterest(tag: string) {
    set('interests', form.interests.includes(tag)
      ? form.interests.filter(t => t !== tag)
      : [...form.interests, tag])
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { toast.error(`Photo must be under ${MAX_PHOTO_MB} MB`); return }

    const preview = URL.createObjectURL(file)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = preview
    setPhotoPreview(preview)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await meApi.uploadPhoto(token!, fd)
      const url = res?.photo ?? res?.url ?? res?.photo_url
      if (!url) throw new Error('Upload did not return a photo')
      setPhotoUrl(url)
      toast.success('Photo uploaded!')
    } catch (err) {
      URL.revokeObjectURL(preview)
      previewRef.current = ''
      setPhotoPreview('')
      setPhotoUrl('')
      toast.error(errMessage(err, 'Failed to upload photo'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const age = calcAge(form.dob)

  /* What is still missing on a given step — drives both the hint line and the
     disabled button, so the two can never disagree. */
  function stepIssue(n: 1 | 2 | 3): string | null {
    if (n === 1) {
      if (uploading)                    return 'Uploading your photo…'
      if (!photoUrl)                    return 'Add a profile photo'
      if (form.name.trim().length < 2)  return 'Enter your full name'
      if (!form.gender)                 return 'Select your gender'
      if (!form.dob)                    return 'Enter your date of birth'
      if (age === null)                 return 'Enter a valid date of birth'
      if (age < MIN_AGE)                return `You must be at least ${MIN_AGE} to join`
      return null
    }
    if (n === 2) {
      const bio = form.bio.trim().length
      if (bio < MIN_BIO)                return `Write ${MIN_BIO - bio} more character${MIN_BIO - bio === 1 ? '' : 's'} in your bio`
      if (form.city.trim().length < 2)  return 'Enter your city'
      return null
    }
    const left = MIN_INTERESTS - form.interests.length
    if (left > 0) return `Select ${left} more interest${left === 1 ? '' : 's'} to continue`
    return null
  }

  const issue = stepIssue(step)

  async function next(e: { preventDefault(): void }) {
    e.preventDefault()
    if (issue) { toast.error(issue); return }
    if (step < 3) { setStep(s => (s + 1) as 1 | 2 | 3); return }

    setLoading(true)
    try {
      const res = await meApi.update(token!, {
        name:      form.name.trim(),
        gender:    form.gender.toLowerCase(),
        dob:       form.dob,
        bio:       form.bio.trim(),
        about:     form.about.trim() || undefined,
        city:      form.city.trim(),
        interests: form.interests,
      })
      setAuth(token!, res.user ?? res)
      toast.success('Welcome to zingDates!')
      window.location.href = '/discover'
    } catch (err) {
      toast.error(errMessage(err, 'Failed to save profile. Please try again.'))
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
            {/* Profile photo */}
            <div className="flex flex-col items-center gap-2 pb-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="relative w-28 h-28 rounded-full overflow-hidden flex items-center justify-center transition-all disabled:cursor-wait group"
                style={{
                  border: photoPreview ? '3px solid #E91E8C' : '2px dashed #e5e7eb',
                  background: photoPreview ? 'transparent' : '#fafafa',
                  boxShadow: photoPreview ? '0 4px 18px rgba(233,30,140,0.25)' : 'none',
                }}
                aria-label={photoPreview ? 'Change profile photo' : 'Add profile photo'}>
                {photoPreview ? (
                  <>
                    {/* Blob / CDN URL, so a plain img rather than next/image. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-black/45 text-white text-[11px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      Change
                    </span>
                  </>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
                {uploading && (
                  <span className="absolute inset-0 bg-white/75 flex items-center justify-center">
                    <svg className="animate-spin w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Profile Photo <span className="text-pink-500">*</span>
              </p>
              <p className="text-[11px] text-gray-400">
                {photoUrl ? 'Looking good — tap the photo to change it' : `A clear face photo, under ${MAX_PHOTO_MB} MB`}
              </p>
            </div>

            <Field label="Full Name" type="text" value={form.name} onChange={v => set('name', v)}
                   placeholder="Priya Sharma" required />

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Gender <span className="text-pink-500">*</span>
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

            <Field label="Date of Birth" type="date" value={form.dob} onChange={v => set('dob', v)}
                   max={maxDob()} hint={`You must be ${MIN_AGE} or older to join`} required />
          </>
        )}

        {/* Step 2 — About You */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Bio <span className="text-pink-500">*</span>
              </label>
              <textarea
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all resize-none text-gray-900 placeholder:text-gray-300" />
              <p className="text-[11px] mt-1.5"
                 style={{ color: form.bio.trim().length >= MIN_BIO ? '#10b981' : '#9ca3af' }}>
                {form.bio.trim().length}/{MIN_BIO} characters minimum
              </p>
            </div>
            <Field label="Short Tagline" type="text" value={form.about} onChange={v => set('about', v)}
                   placeholder="e.g. Coffee lover, dog dad" hint="Optional" />
            <Field label="City" type="text" value={form.city} onChange={v => set('city', v)}
                   placeholder="Mumbai" hint="So we can show you people and events nearby" required />
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
                background:   form.interests.length >= MIN_INTERESTS ? 'rgba(16,185,129,0.06)'  : '#f9fafb',
                borderColor:  form.interests.length >= MIN_INTERESTS ? 'rgba(16,185,129,0.25)'  : '#f3f4f6',
              }}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{
                  background: form.interests.length >= MIN_INTERESTS ? '#10b981' : '#e5e7eb',
                  color:      '#fff',
                }}>
                {form.interests.length >= MIN_INTERESTS ? '✓' : form.interests.length}
              </div>
              <p className="text-xs font-medium" style={{ color: form.interests.length >= MIN_INTERESTS ? '#065f46' : '#9ca3af' }}>
                {issue ?? `${form.interests.length} interests selected — looking good!`}
              </p>
            </div>
          </>
        )}

        {/* What is still needed before this step can be completed. Step 3 says
            it in its own counter card, so it is not repeated here. */}
        {issue && step < 3 && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            {issue}
          </p>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading || !!issue}
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

function Field({ label, type, value, onChange, placeholder, required, max, hint }: {
  label: string; type: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; max?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {label}{required && <span className="text-pink-500"> *</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} max={max}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-300" />
      {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

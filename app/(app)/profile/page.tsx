'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { meApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/* ─── Helpers ─────────────────────────────────────────── */
function completeness(p: any): { pct: number; missing: string[] } {
  const fields = [
    { key: 'photo',     label: 'Profile photo' },
    { key: 'name',      label: 'Full name'      },
    { key: 'bio',       label: 'Bio'            },
    { key: 'about',     label: 'About me'       },
    { key: 'gender',    label: 'Gender'         },
    { key: 'dob',       label: 'Date of birth'  },
    { key: 'languages', label: 'Languages'      },
    { key: 'city',      label: 'City'           },
  ]
  const missing = fields.filter(f => !p?.[f.key]).map(f => f.label)
  const pct = Math.round(((fields.length - missing.length) / fields.length) * 100)
  return { pct, missing }
}

function formatDate(dob: string | null) {
  if (!dob) return ''
  const d = new Date(dob)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function calcAge(dob: string | null) {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

/* ─── Sub-components ──────────────────────────────────── */
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-gray-50 placeholder-gray-400"

/* ─── Page ────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter()
  const { token, user, setAuth, clearAuth } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dndSaving, setDndSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', bio: '', about: '', gender: '', dob: '', languages: '', city: '', state: '',
  })
  const [dnd, setDnd] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const p = await meApi.profile(token!)
      const data = p?.user ?? p
      setProfile(data)
      setForm({
        name:      data.name      ?? '',
        bio:       data.bio       ?? '',
        about:     data.about     ?? '',
        gender:    data.gender    ?? '',
        dob:       data.dob       ?? '',
        languages: data.languages ?? '',
        city:      data.city      ?? '',
        state:     data.state     ?? '',
      })
      setDnd(!!data.dnd)
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function save(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const updated = await meApi.update(token!, { ...form, dnd })
      const data = updated?.user ?? updated
      setProfile((prev: any) => ({ ...prev, ...data }))
      setAuth(token!, { ...user!, name: form.name })
      toast.success('Profile saved!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function toggleDnd(val: boolean) {
    setDnd(val)
    setDndSaving(true)
    try {
      await meApi.update(token!, { dnd: val })
      toast.success(val ? 'DND enabled' : 'DND disabled')
    } catch {
      setDnd(!val)
      toast.error('Failed to update preference')
    } finally {
      setDndSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await meApi.uploadPhoto(token!, fd)
      const photoUrl = res?.photo ?? res?.url ?? res?.photo_url
      setProfile((prev: any) => ({ ...prev, photo: photoUrl }))
      toast.success('Photo updated!')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function logout() {
    clearAuth()
    router.push('/login')
  }

  /* ── Derived ── */
  const comp = profile ? completeness({ ...profile, ...form }) : { pct: 0, missing: [] }
  const age  = calcAge(form.dob || profile?.dob)
  const planLabel = profile?.plan_type === 'vip' ? 'VIP' : profile?.is_premium ? 'Premium' : 'Free'
  const planIcon  = profile?.plan_type === 'vip' ? '👑' : profile?.is_premium ? '⭐' : '🆓'

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
      <p className="text-sm text-gray-400">Loading profile…</p>
    </div>
  )

  return (
    <div className="pb-8 space-y-4 max-w-lg mx-auto">

      {/* ── Hero header ─────────────────────────────── */}
      <div className="relative">
        {/* Banner */}
        <div className="gradient-brand h-36 rounded-b-3xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
        </div>

        {/* Avatar overlapping banner */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -52 }}>
          <div className="relative">
            {profile?.photo ? (
              <img
                src={profile.photo}
                alt={profile.name ?? 'Profile'}
                className="w-28 h-28 rounded-full object-cover border-4 border-white"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full gradient-brand border-4 border-white flex items-center justify-center"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
            {/* Camera button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
              {uploading ? (
                <div className="w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="2.2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>

        {/* Name + details below avatar */}
        <div className="pt-16 pb-2 text-center">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {profile?.name ?? 'Your Name'}
            {age ? <span className="font-normal text-gray-500">, {age}</span> : null}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.phone ?? profile?.email ?? ''}</p>
          {(form.city || profile?.city) && (
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {form.city || profile.city}
              {(form.state || profile?.state) ? `, ${form.state || profile.state}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* ── Profile completeness ─────────────────────── */}
      {comp.pct < 100 && (
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Profile completeness</p>
            <span className="text-sm font-bold text-pink-600">{comp.pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full gradient-brand transition-all duration-700"
              style={{ width: `${comp.pct}%` }}
            />
          </div>
          {comp.missing.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Add: {comp.missing.slice(0, 3).join(', ')}{comp.missing.length > 3 ? ` +${comp.missing.length - 3} more` : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Quick stats ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Plan card */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-xl flex-shrink-0">
            {planIcon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Plan</p>
            <p className="font-bold text-gray-900 text-sm capitalize">{planLabel}</p>
            {profile?.plan_expires_at && (
              <p className="text-[11px] text-gray-400 truncate">
                Until {new Date(profile.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        </div>

        {/* Wallet card */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">💰</div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Wallet</p>
            <p className="font-bold text-gray-900 text-sm">₹{Number(profile?.wallet_balance ?? 0).toFixed(2)}</p>
            <Link href="/plans" className="text-[11px] text-pink-600 font-semibold">Top up →</Link>
          </div>
        </div>
      </div>

      {/* ── Edit personal info ───────────────────────── */}
      <form onSubmit={save} className="space-y-4">
        <SectionCard
          title="Personal Info"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          }
        >
          <div className="space-y-4">
            <Field label="Full Name">
              <input
                type="text" value={form.name} maxLength={60}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className={inputCls}
              />
            </Field>

            <Field label="Bio">
              <input
                type="text" value={form.bio} maxLength={100}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="A short tagline about you"
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{form.bio.length}/100</p>
            </Field>

            <Field label="About Me">
              <textarea
                value={form.about} maxLength={300} rows={3}
                onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
                placeholder="Tell people about yourself, your interests, what you're looking for…"
                className={inputCls + ' resize-none'}
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{form.about.length}/300</p>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Details"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        >
          <div className="space-y-4">
            {/* Gender pills */}
            <Field label="Gender">
              <div className="flex gap-2 flex-wrap">
                {(['male', 'female', 'other'] as const).map(g => (
                  <button
                    key={g} type="button"
                    onClick={() => setForm(f => ({ ...f, gender: f.gender === g ? '' : g }))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize
                      ${form.gender === g
                        ? 'gradient-brand text-white border-transparent shadow-sm'
                        : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-pink-300 hover:text-pink-600'
                      }`}
                  >
                    {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Date of Birth">
              <input
                type="date" value={form.dob}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                className={inputCls}
              />
              {form.dob && <p className="text-[11px] text-gray-400 mt-1">{formatDate(form.dob)}{age ? ` · ${age} years old` : ''}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input
                  type="text" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Mumbai"
                  className={inputCls}
                />
              </Field>
              <Field label="State">
                <input
                  type="text" value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="Maharashtra"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Languages">
              <input
                type="text" value={form.languages}
                onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
                placeholder="Hindi, English, …"
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400 mt-1">Comma-separated</p>
            </Field>
          </div>
        </SectionCard>

        {/* Save button */}
        <button
          type="submit" disabled={saving}
          className="w-full gradient-brand text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[.98]"
          style={{ boxShadow: '0 4px 14px rgba(233,30,140,0.35)' }}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </form>

      {/* ── Preferences ─────────────────────────────── */}
      <SectionCard
        title="Preferences"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        }
      >
        {/* DND toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Do Not Disturb</p>
            <p className="text-xs text-gray-400 mt-0.5">Hide your online status and pause incoming calls</p>
          </div>
          <button
            type="button"
            disabled={dndSaving}
            onClick={() => toggleDnd(!dnd)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${dnd ? 'bg-pink-500' : 'bg-gray-200'} ${dndSaving ? 'opacity-50' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${dnd ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </SectionCard>

      {/* ── Account section ──────────────────────────── */}
      <SectionCard
        title="Account"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
      >
        <div className="space-y-3">
          <Link
            href="/plans"
            className="flex items-center justify-between py-3 border-b border-gray-100 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">⭐</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Upgrade Plan</p>
                <p className="text-xs text-gray-400">Get more likes, calls & features</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-lg">📱</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Phone</p>
                <p className="text-xs text-gray-400">{profile?.phone ?? 'Not set'}</p>
              </div>
            </div>
            <span className="text-xs text-emerald-500 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">🆔</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Member since</p>
                <p className="text-xs text-gray-400">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Logout ───────────────────────────────────── */}
      <button
        onClick={logout}
        className="w-full py-4 rounded-2xl border-2 border-red-100 text-sm font-bold text-red-500 hover:bg-red-50 active:bg-red-100 flex items-center justify-center gap-2 transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Log Out
      </button>

    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { meApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

export default function ProfilePage() {
  const router = useRouter()
  const { token, user, setAuth, clearAuth } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', about: '', gender: '', dob: '', languages: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const p = await meApi.profile(token!)
      setProfile(p)
      setForm({
        name: p.name ?? '',
        bio: p.bio ?? '',
        about: p.about ?? '',
        gender: p.gender ?? '',
        dob: p.dob ?? '',
        languages: p.languages ?? '',
      })
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function save(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await meApi.update(token!, form)
      setProfile(updated)
      setAuth(token!, { ...user!, name: form.name })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await meApi.uploadPhoto(token!, fd)
      setProfile((prev: any) => ({ ...prev, photo: res.photo ?? res.url ?? prev.photo }))
      toast.success('Photo updated')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  function logout() {
    clearAuth()
    router.push('/login')
  }

  const initials = profile?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  )

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="gradient-brand px-4 pt-6 pb-10 text-white text-center relative">
        <h1 className="text-xl font-bold mb-6">My Profile</h1>
        {/* Avatar */}
        <div className="relative inline-block">
          {profile?.photo ? (
            <img src={profile.photo} alt={profile.name} className="w-24 h-24 rounded-full object-cover border-4 border-white/30 mx-auto" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/20 mx-auto">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
            {uploading ? (
              <div className="w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>
        <p className="font-bold text-lg mt-3">{profile?.name}</p>
        <p className="text-pink-100 text-sm">{profile?.phone ?? profile?.email}</p>
      </div>

      {/* Plan badge */}
      <div className="-mt-5 mx-4 mb-4">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white text-lg">
            {profile?.plan_type === 'vip' ? '👑' : profile?.is_premium ? '⭐' : '🆓'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 capitalize">{profile?.plan_type ?? 'Free'} Plan</p>
            <p className="text-xs text-gray-500">
              {profile?.plan_expires_at
                ? `Expires ${new Date(profile.plan_expires_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'No active plan'}
            </p>
          </div>
          <Link href="/plans" className="text-xs font-bold text-pink-600 hover:text-pink-800 flex-shrink-0">
            Upgrade
          </Link>
        </div>
      </div>

      {/* Wallet */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg">💰</div>
          <div>
            <p className="font-semibold text-gray-900">Wallet Balance</p>
            <p className="text-xs text-gray-500">₹{Number(profile?.wallet_balance ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={save} className="mx-4 space-y-4">
        <h2 className="font-bold text-gray-900 text-base">Edit Profile</h2>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bio</label>
          <input type="text" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Short tagline" maxLength={100}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">About Me</label>
          <textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
            placeholder="Tell people about yourself…" rows={3} maxLength={300}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gender</label>
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Birth</label>
            <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Languages</label>
          <input type="text" value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
            placeholder="Hindi, English, …"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full gradient-brand text-white font-semibold py-3.5 rounded-xl disabled:opacity-60"
          style={{ boxShadow: '0 2px 10px rgba(233,30,140,0.35)' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Logout */}
      <div className="mx-4 mt-6">
        <button onClick={logout}
          className="w-full py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  )
}

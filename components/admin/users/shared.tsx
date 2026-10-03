'use client'

// Everything the user list, the user detail page and the user edit page share:
// the API row shape, badges, the photo picker and the media review block.
// Pulled out of app/admin/users/page.tsx when View and Edit became pages of
// their own rather than popups over the list.
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { mediaApi } from '@/lib/api'
import type { AdminMedia } from '@/lib/api'
import type { UserStatus, VerificationStatus } from '@/lib/types'

export interface ApiUser {
  id: number
  name: string
  email: string | null
  phone: string | null
  profile_photo?: string
  subscription_plan?: string
  plan_name?: string | null
  plan_expires_at?: string | null
  plan_active?: boolean
  verification_status: VerificationStatus
  is_verified: boolean
  status: UserStatus
  role: string
  gender?: string
  // Two addresses, kept apart on purpose. `city`/`country`/`entered_*` are what
  // the member TYPED; `current_*` is where their phone last reported them, and
  // means nothing without `location_updated_at`. Mirrors the users table's
  // current_* columns on the API side.
  city?: string
  country?: string
  entered_address?: string | null
  entered_address_line?: string | null
  entered_locality?: string | null
  entered_state?: string | null
  entered_pincode?: string | null
  current_address?: string | null
  current_city?: string | null
  current_state?: string | null
  current_pincode?: string | null
  location_updated_at?: string | null
  has_gps_fix?: boolean
  bio?: string
  created_at: string
  signup_source?: string
  signup_source_label?: string
  last_login_at: string | null
  last_seen?: string | null
  // Judged on the heartbeat, not on a flag that can be left set — see
  // User::isOnlineNow() on the API side.
  is_online?: boolean
  last_active?: string | null
  // null = presence follows the heartbeat. 'online'/'offline' = pinned by an
  // admin, and the heartbeat is ignored.
  presence_override?: 'online' | 'offline' | null
  presence_override_at?: string | null
  plan_started_at?: string | null
}

export interface EditUserForm {
  name: string; email: string; phone: string; role: string; gender: string; status: string
  // The address the member GAVE. The current_* columns are the device's reading
  // and are not editable here — a correction would only last until the next
  // location ping.
  addressLine: string; locality: string; city: string; state: string; pincode: string; country: string
  photoUrl: string
}

// The API stores a single `is_admin` flag, so these are the only two roles it
// can persist. A longer list was rejected with a 422 — nothing in the schema
// backs those other roles.
export const ROLES = [
  { value: 'user',  label: 'User' },
  { value: 'admin', label: 'Admin' },
]

// Must match the API's `in:male,female,other` rule.
export const GENDERS = [
  { value: '',       label: 'Select gender' },
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
]

export const BULK_LABELS: Record<string, string> = {
  suspend: 'suspended', unsuspend: 'unsuspended', verify: 'verified', delete: 'deleted',
  // Presence pins. Worded as what the app now SHOWS, not as what the person is.
  presence_online: 'now shown as online',
  presence_offline: 'now shown as offline',
  presence_auto: 'back to their real status',
}

export function fmtNum(n: number | undefined): string {
  if (n === undefined || n === null) return '—'
  return n.toLocaleString('en-US')
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Badges ──────────────────────────────────────────── */
// Plans are admin-defined (any key, any name), so the badge shows whatever
// the API says the plan is called. The old version only knew "vip" and
// "premium" and printed "Free" for everything else — including the ₹99
// Monthly plan, which made a granted plan look like it never applied.
export function PlanBadge({ plan, name, active, expiresAt }: { plan?: string | null; name?: string | null; active?: boolean; expiresAt?: string | null }) {
  if (!plan) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Free</span>
  const label = name || plan.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const lower = plan.toLowerCase()
  const cls = !active
    ? 'bg-gray-100 text-gray-500 line-through decoration-gray-400'
    : lower.includes('vip') ? 'bg-purple-100 text-purple-700'
    : lower.includes('trial') ? 'bg-amber-100 text-amber-700'
    : 'gradient-brand text-white'
  const title = active
    ? (expiresAt ? `Active until ${fmtDate(expiresAt)}` : 'Active')
    : (expiresAt ? `Expired ${fmtDate(expiresAt)}` : 'Expired')
  return <span title={title} className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>{label}</span>
}

export function VerificationBadge({ status }: { status: VerificationStatus | undefined }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      Verified
    </span>
  )
  if (status === 'pending') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Unverified</span>
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, string> = {
    active:    'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-600',
    deleted:   'bg-gray-200 text-gray-500',
    pending:   'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700',
    admin:       'bg-orange-100 text-orange-700',
    moderator:   'bg-blue-100 text-blue-700',
    support:     'bg-cyan-100 text-cyan-700',
    analyst:     'bg-indigo-100 text-indigo-700',
    marketing:   'bg-violet-100 text-violet-700',
    finance:     'bg-emerald-100 text-emerald-700',
    user:        'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role?.replace('_', ' ')}
    </span>
  )
}

export function Avatar({ name, photo, large }: { name: string; photo?: string; large?: boolean }) {
  const sz = large ? 'w-16 h-16 text-lg' : 'w-9 h-9 text-xs'
  if (photo) return <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`${sz} rounded-full flex-shrink-0 gradient-brand flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  )
}

/* ── Shared form field helpers ────────────────────────── */
export function inputCls(err?: string) {
  return `w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
    err ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-pink-300'
  }`
}


/* ── Profile photo picker (shared by Add + Edit) ─────── */
export type PhotoMode = 'url' | 'upload'
export function PhotoPicker({ mode, onMode, url, onUrl, preview, onFile, current, error }: {
  mode: PhotoMode; onMode: (m: PhotoMode) => void
  url: string; onUrl: (v: string) => void
  preview: string | null; onFile: (f: File | null) => void
  current?: string; error?: string
}) {
  const urlOk = /^https?:\/\//i.test(url.trim())
  // Preview priority: freshly picked file → typed URL → the photo already on file.
  const shown = mode === 'upload' && preview ? preview : mode === 'url' && urlOk ? url.trim() : current || null
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Profile Photo <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-3 w-fit">
        {(['url', 'upload'] as const).map(m => (
          <button key={m} type="button" onClick={() => onMode(m)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {m === 'url' ? 'Paste URL' : 'Upload file'}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {shown ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={shown} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {mode === 'url' ? (
            <input type="url" value={url} onChange={e => onUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg" className={inputCls(error)} />
          ) : (
            <>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => onFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100 cursor-pointer" />
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP · up to 5 MB</p>
            </>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  )
}


/* ── Full-size photo preview ─────────────────────────── */
export function PhotoLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <button onClick={onClose} aria-label="Close preview" className="absolute top-4 right-4 p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onClick={e => e.stopPropagation()}
        className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl" />
      <a href={src} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
        Open original
      </a>
    </div>
  )
}


/* ── A user's uploaded media, for review ─────────────── */
export function UserMediaSection({ userId, token }: { userId: number; token: string }) {
  const [items, setItems] = useState<AdminMedia[] | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [preview, setPreview] = useState<AdminMedia | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await mediaApi.forUser(token, userId)
      setItems(res.media ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Could not load media')
    }
  }, [token, userId])

  useEffect(() => { load() }, [load])

  async function remove(m: AdminMedia) {
    if (!window.confirm('Delete this file for good? It is removed from storage as well as the database.')) return
    setBusyId(m.id)
    try {
      await mediaApi.remove(token, m.id)
      setItems(prev => (prev ?? []).filter(x => x.id !== m.id))
      toast.success('Media deleted.')
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  if (error) return <p className="py-4 text-xs text-red-500">{error}</p>
  if (!items) return <p className="py-4 text-xs text-gray-400">Loading media…</p>

  return (
    <div className="py-5 border-t border-gray-100">
      {preview && preview.url && preview.media_type === 'image' && (
        <PhotoLightbox src={preview.url} alt={preview.original_name ?? 'Media'} onClose={() => setPreview(null)} />
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Uploaded media ({items.length})
        </span>
        <button onClick={load} className="text-xs text-blue-600 hover:underline">Refresh</button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-gray-400">This user has not uploaded anything.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
          {items.map(m => (
            <div key={m.id} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              {/* Videos are exactly what a photo-only panel misses, so they
                  get a real player rather than a broken <img>. */}
              {m.media_type === 'video' && m.url ? (
                <video src={m.url} controls preload="metadata" className="w-full h-24 object-cover bg-black" />
              ) : m.media_type === 'image' && m.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.original_name ?? m.kind} onClick={() => setPreview(m)}
                  className="w-full h-24 object-cover cursor-zoom-in" />
              ) : (
                <div className="w-full h-24 flex items-center justify-center text-[10px] text-gray-400 px-2 text-center">
                  {m.media_type} file
                </div>
              )}

              <div className="px-1.5 py-1">
                <p className="text-[10px] font-semibold text-gray-600 capitalize truncate">{m.kind.replace('_', ' ')}</p>
                <p className="text-[10px] text-gray-400 truncate">{fmtDate(m.uploaded_at)}</p>
                {m.status !== 'approved' && (
                  <p className="text-[10px] font-semibold text-orange-500 capitalize">{m.status.replace('_', ' ')}</p>
                )}
              </div>

              <button onClick={() => remove(m)} disabled={busyId === m.id} title="Delete this file"
                className="absolute top-1 right-1 p-1 rounded-lg bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


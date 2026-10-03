'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usersApi, attentionApi, type PresenceMode } from '@/lib/api'
import GrantPlanModal from '@/components/admin/GrantPlanModal'
import { useAuthStore } from '@/lib/store/auth'
import {
  type ApiUser, ROLES, GENDERS, BULK_LABELS,
  fmtNum, fmtDate, PlanBadge, VerificationBadge, StatusBadge, RoleBadge, Avatar, inputCls, PhotoPicker,
} from '@/components/admin/users/shared'
import { fmtDateTime, fmtTime } from '@/lib/site'

/* ── Types ───────────────────────────────────────────── */
interface Meta {
  total: number
  current_page: number
  last_page: number
  per_page: number
}

interface AddUserForm {
  name: string; email: string; phone: string; password: string; role: string; gender: string
  photoUrl: string
}

const DEFAULT_ADD_FORM: AddUserForm = {
  name: '', email: '', phone: '', password: '', role: 'user', gender: '', photoUrl: '',
}


/* ── KPI card definitions ─────────────────────────────── */
const kpiDefs = [
  {
    label: 'Total Users', key: 'total_users', color: 'text-brand', bg: 'bg-pink-50', change: '+12.4%', up: true,
    icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.356-3.765M9 20H4v-2a4 4 0 015.356-3.765M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>),
  },
  {
    label: 'Active Users', key: 'active_users', color: 'text-green-600', bg: 'bg-green-50', change: '+8.1%', up: true,
    icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    label: 'Verified Users', key: 'verified_users', color: 'text-purple-600', bg: 'bg-purple-50', change: '+5.3%', up: true,
    icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>),
  },
  {
    label: 'Suspended', key: 'suspended_users', color: 'text-red-500', bg: 'bg-red-50', change: '-2.1%', up: false,
    icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>),
  },
]

/* ── Actions dropdown ────────────────────────────────── */
function ActionsMenu({
  user, token, onRefresh, onEdit, onView, onPlan,
}: {
  user: ApiUser; token: string; onRefresh: () => void
  onEdit: (u: ApiUser) => void
  onView: (u: ApiUser) => void
  onPlan: (u: ApiUser) => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleAction(action: 'verify' | 'suspend' | 'unsuspend' | 'delete') {
    setOpen(false)
    if (busy) return
    if (action === 'delete' && !window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      if (action === 'verify')    await usersApi.verify(token, user.id)
      if (action === 'suspend')   await usersApi.suspend(token, user.id, 'Suspended by admin')
      if (action === 'unsuspend') await usersApi.unsuspend(token, user.id)
      if (action === 'delete')    await usersApi.delete(token, user.id)
      toast.success(`${user.name} has been ${BULK_LABELS[action]}.`)
      onRefresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Action failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={busy}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-50"
      >
        {busy ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 text-sm">

            {/* View Details */}
            <button
              onClick={() => { setOpen(false); onView(user) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>

            {/* Edit User */}
            <button
              onClick={() => { setOpen(false); onEdit(user) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit User
            </button>

            {/* Give plan */}
            <button
              onClick={() => { setOpen(false); onPlan(user) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
              {user.plan_active ? 'Change Plan' : 'Give Plan'}
            </button>

            <div className="my-1 border-t border-gray-100" />

            {/* Verify */}
            {!user.is_verified && (
              <button
                onClick={() => handleAction('verify')}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify User
              </button>
            )}

            {/* Suspend / Unsuspend */}
            {user.status === 'suspended' ? (
              <button
                onClick={() => handleAction('unsuspend')}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Unsuspend
              </button>
            ) : (
              <button
                onClick={() => handleAction('suspend')}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Suspend
              </button>
            )}

            <div className="my-1 border-t border-gray-100" />

            {/* Delete */}
            <button
              onClick={() => handleAction('delete')}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-left text-red-600"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete User
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Skeleton row ────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="pl-5 py-3.5"><div className="w-4 h-4 bg-gray-100 rounded" /></td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="w-28 h-3 bg-gray-100 rounded" />
            <div className="w-36 h-2.5 bg-gray-100 rounded" />
          </div>
        </div>
      </td>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5"><div className="w-20 h-3 bg-gray-100 rounded" /></td>
      ))}
      <td className="pr-4 py-3.5"><div className="w-6 h-6 bg-gray-100 rounded-lg" /></td>
    </tr>
  )
}

/* ── Add User Modal ──────────────────────────────────── */
function AddUserModal({ onClose, onSuccess, token }: { onClose: () => void; onSuccess: () => void; token: string }) {
  const [form, setForm]     = useState<AddUserForm>(DEFAULT_ADD_FORM)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // A photo can come from a pasted URL or an uploaded file — never both, so
  // picking one clears the other.
  const [photoMode, setPhotoMode] = useState<'url' | 'upload'>('url')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  function pickFile(f: File | null) {
    setPhotoFile(f)
    setPhotoPreview(p => { if (p) URL.revokeObjectURL(p); return f ? URL.createObjectURL(f) : null })
    setErrors(e => ({ ...e, photo: '' }))
  }

  function set(field: keyof AddUserForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim())  errs.name = 'Name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.'
    if (!form.password)     errs.password = 'Password is required.'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (photoMode === 'url' && form.photoUrl.trim() && !/^https?:\/\/\S+$/i.test(form.photoUrl.trim())) {
      errs.photo = 'Enter a full image URL starting with http:// or https://'
    }
    if (photoMode === 'upload' && photoFile && photoFile.size > 5 * 1024 * 1024) {
      errs.photo = 'Image must be 5 MB or smaller.'
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const payload: Record<string, any> = { name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role }
      if (form.phone.trim()) payload.phone  = form.phone.trim()
      if (form.gender)       payload.gender = form.gender
      // A URL can ride along with the create; a file cannot (that call is JSON),
      // so it is uploaded straight after against the new user's id.
      if (photoMode === 'url' && form.photoUrl.trim()) payload.photo = form.photoUrl.trim()

      const res = await usersApi.create(token, payload)
      const newId = res?.user?.id ?? res?.data?.user?.id

      if (photoMode === 'upload' && photoFile && newId) {
        try {
          await usersApi.setPhoto(token, newId, { file: photoFile })
        } catch {
          // The account exists either way — say so rather than implying it failed.
          toast.error('User created, but the photo upload failed. Add it from Edit.')
          onSuccess()
          return
        }
      }

      toast.success(`User "${form.name}" created successfully.`)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.status === 422 ? 'Validation failed. Check the form fields.' : (err?.message ?? 'Failed to create user.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Add New User" subtitle="Create a new user account manually." onClose={onClose}>
      <form id="add-user-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" className={inputCls(errors.name)} autoFocus />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls()}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-400">*</span></label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" className={inputCls(errors.email)} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender <span className="text-gray-400 font-normal">(optional)</span></label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls()}>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>
        <PhotoPicker mode={photoMode} onMode={m => { setPhotoMode(m); setErrors(e => ({ ...e, photo: '' })) }}
          url={form.photoUrl} onUrl={v => set('photoUrl', v)}
          preview={photoPreview} onFile={pickFile} error={errors.photo} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-400">*</span></label>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" className={inputCls(errors.password)} />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>
      </form>
      <ModalFooter onClose={onClose} formId="add-user-form" loading={loading} label="Create User" />
    </ModalShell>
  )
}

/* ── Shared modal shell ──────────────────────────────── */
function ModalShell({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalFooter({ onClose, formId, loading, label }: { onClose: () => void; formId: string; loading: boolean; label: string }) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
      <button type="button" onClick={onClose}
        className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
        Cancel
      </button>
      <button type="submit" form={formId} disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl gradient-brand shadow-brand hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed">
        {loading && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {loading ? 'Saving...' : label}
      </button>
    </div>
  )
}

/* ── CSV export helper ───────────────────────────────── */
function exportUsersCSV(users: ApiUser[]) {
  const headers = [
    'ID', 'Name', 'Email', 'Phone', 'Role', 'Plan', 'Status', 'Verification',
    'Entered address', 'City', 'Country',
    // Both addresses go out, labelled, with the "as of" the current one needs.
    'Current address (from phone)', 'Location updated',
    'Signed up on', 'Joined', 'Last active',
  ]
  const rows = users.map(u => [
    u.id, u.name || '', u.email || '', u.phone || '', u.role,
    u.subscription_plan || 'Free', u.status, u.verification_status,
    u.entered_address || '', u.city || '', u.country || '',
    u.current_address || '', fmtDateTime(u.location_updated_at),
    u.signup_source_label || 'Unknown',
    fmtDateTime(u.created_at), u.last_active || fmtDateTime(u.last_seen ?? u.last_login_at),
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ── Presence control ────────────────────────────────── */
/**
 * Pins what a group of accounts SHOWS as, regardless of whether their apps are
 * running. 'Auto' is the default and gives each account back to its own
 * heartbeat.
 *
 * Two confirmations' worth of friction on purpose: this changes what every
 * member of the app sees about a whole group of people at once, and there is
 * no per-row undo — only setting it back to Auto.
 */
function PresenceControl({ token, onDone }: { token: string; onDone: () => void }) {
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'all'>('female')
  const [busy, setBusy] = useState<PresenceMode | null>(null)

  const labelFor = (m: PresenceMode) =>
    m === 'auto' ? 'their real status' : `"${m === 'online' ? 'Online' : 'Offline'}"`
  const groupLabel = gender === 'all' ? 'all members' : `all ${gender} members`

  async function apply(mode: PresenceMode) {
    if (!confirm(`Show ${groupLabel} as ${labelFor(mode)} in the app?`)) return
    setBusy(mode)
    try {
      const res = await usersApi.bulkPresence(token, gender, mode)
      toast.success(res.message ?? 'Updated')
      onDone()
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not change presence.')
    } finally {
      setBusy(null)
    }
  }

  const btn = 'px-3.5 py-2 text-sm font-semibold rounded-xl border-2 transition-colors disabled:opacity-50'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="min-w-0 lg:flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Online status</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Overrides what the app shows. Auto follows each account&apos;s own activity.
          </p>
        </div>

        <select value={gender} onChange={e => setGender(e.target.value as typeof gender)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
          <option value="female">All female members</option>
          <option value="male">All male members</option>
          <option value="other">All other members</option>
          <option value="all">Everyone</option>
        </select>

        <div className="flex gap-2">
          <button onClick={() => apply('online')} disabled={busy !== null}
            className={`${btn} border-green-200 text-green-700 hover:bg-green-50`}>
            {busy === 'online' ? 'Setting…' : 'Show online'}
          </button>
          <button onClick={() => apply('offline')} disabled={busy !== null}
            className={`${btn} border-gray-200 text-gray-600 hover:bg-gray-50`}>
            {busy === 'offline' ? 'Setting…' : 'Show offline'}
          </button>
          <button onClick={() => apply('auto')} disabled={busy !== null}
            className={`${btn} border-pink-200 text-pink-600 hover:bg-pink-50`}>
            {busy === 'auto' ? 'Clearing…' : 'Auto'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────── */
/**
 * Where the account was created. Mirrors App\Support\SignupSource — 'unknown'
 * is every account that predates the column, and says so rather than being
 * quietly folded into one of the real buckets.
 */
const SOURCE_STYLE: Record<string, string> = {
  web:     'bg-blue-50 text-blue-700',
  android: 'bg-green-50 text-green-700',
  ios:     'bg-gray-100 text-gray-700',
  unknown: 'bg-gray-50 text-gray-400',
}

function SignupSourceBadge({ source, label }: { source?: string; label?: string }) {
  const key = source ?? 'unknown'
  return (
    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${SOURCE_STYLE[key] ?? SOURCE_STYLE.unknown}`}>
      {label ?? 'Unknown'}
    </span>
  )
}

export default function UsersPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [users, setUsers]         = useState<ApiUser[]>([])
  const [meta, setMeta]           = useState<Meta>({ total: 0, current_page: 1, last_page: 1, per_page: 25 })
  const [kpiValues, setKpiValues] = useState<Record<string, number>>({})
  const [loading, setLoading]     = useState(true)

  const [search, setSearch]                       = useState('')
  const [debouncedSearch, setDebouncedSearch]     = useState('')
  const [statusFilter, setStatusFilter]           = useState('all')
  // Who, where and when — the questions that used to mean paging through
  // everyone. `from`/`to` are plain yyyy-mm-dd, which is what <input type=date>
  // gives and what the API parses.
  const [genderFilter, setGenderFilter]           = useState('all')
  const [onlineFilter, setOnlineFilter]           = useState('all')
  const [cityFilter, setCityFilter]               = useState('')
  const [debouncedCity, setDebouncedCity]         = useState('')
  const [fromDate, setFromDate]                   = useState('')
  const [toDate, setToDate]                       = useState('')
  const [sort, setSort]                           = useState('newest')
  const [sourceFilter, setSourceFilter]           = useState('all')
  const [roleFilter, setRoleFilter]               = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [page, setPage]                           = useState(1)

  const [selectAll, setSelectAll] = useState(false)
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy]   = useState(false)

  const [showAddModal, setShowAddModal]   = useState(false)
  // View and Edit are pages now (/admin/users/[id] and /[id]/edit); only
  // Add and Give Plan stay as popups, since they are quick and return here.
  const router = useRouter()
  const openUser = (u: ApiUser) => router.push(`/admin/users/${u.id}`)
  const editUser = (u: ApiUser) => router.push(`/admin/users/${u.id}/edit`)
  const [planUser, setPlanUser]           = useState<ApiUser | null>(null)
  // When this admin last opened the page, from before we mark it seen now —
  // rows created after it get a "New" tag and the banner below counts them.
  const [lastSeen, setLastSeen] = useState<string | null | undefined>(undefined)
  const [newSinceSeen, setNewSinceSeen] = useState(0)
  useEffect(() => {
    if (!token) return
    let alive = true
    attentionApi.get(token)
      .then(a => { if (!alive) return; setLastSeen(a.seen.users); setNewSinceSeen(a.new_users) })
      .catch(() => { if (alive) setLastSeen(null) })
      .finally(() => { attentionApi.markSeen(token, 'users').catch(() => {}) })
    return () => { alive = false }
  }, [token])
  const isNewUser = (u: ApiUser) => !!lastSeen && new Date(u.created_at) > new Date(lastSeen)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    cityDebounceRef.current = setTimeout(() => { setDebouncedCity(cityFilter); setPage(1) }, 500)
    return () => { if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current) }
  }, [cityFilter])

  useEffect(() => { setPage(1) }, [
    statusFilter, roleFilter, verificationFilter, sourceFilter,
    genderFilter, onlineFilter, fromDate, toDate, sort,
  ])

  const fetchUsers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setSelected(new Set())
    setSelectAll(false)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (debouncedSearch)              params.search              = debouncedSearch
      if (statusFilter !== 'all')       params.status              = statusFilter
      if (roleFilter !== 'all')         params.role                = roleFilter
      if (verificationFilter !== 'all') params.verification_status = verificationFilter
      if (sourceFilter !== 'all')       params.signup_source        = sourceFilter
      if (genderFilter !== 'all')       params.gender              = genderFilter
      if (onlineFilter !== 'all')       params.online              = onlineFilter === 'online' ? '1' : '0'
      if (debouncedCity)                params.city                = debouncedCity
      if (fromDate)                     params.from                = fromDate
      if (toDate)                       params.to                  = toDate
      if (sort !== 'newest')            params.sort                = sort

      const res   = await usersApi.list(token, params)
      const data: ApiUser[] = res.data ?? []
      const m: Meta = res.meta ?? {
        total:        res.total        ?? data.length,
        current_page: res.current_page ?? page,
        last_page:    res.last_page    ?? 1,
        per_page:     res.per_page     ?? 25,
      }
      setUsers(data)
      setMeta(m)
      if (res.stats) {
        setKpiValues({
          total_users:     res.stats.total_users     ?? m.total,
          active_users:    res.stats.active_users    ?? 0,
          verified_users:  res.stats.verified_users  ?? 0,
          suspended_users: res.stats.suspended_users ?? 0,
        })
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [token, page, debouncedSearch, statusFilter, roleFilter, verificationFilter, sourceFilter,
      genderFilter, onlineFilter, debouncedCity, fromDate, toDate, sort])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function toggleSelect(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    if (selectAll) { setSelected(new Set()); setSelectAll(false) }
    else { setSelected(new Set(users.map(u => u.id))); setSelectAll(true) }
  }

  type BulkAction = 'suspend' | 'unsuspend' | 'verify' | 'delete'
    | 'presence_online' | 'presence_offline' | 'presence_auto'

  async function handleBulkAction(action: BulkAction) {
    if (selected.size === 0) return
    if (action === 'delete' && !window.confirm(`Delete ${selected.size} selected user(s)? This cannot be undone.`)) return
    setBulkBusy(true)
    try {
      await usersApi.bulkAction(token, action, Array.from(selected))
      toast.success(`${selected.size} user${selected.size > 1 ? 's' : ''} ${BULK_LABELS[action]}.`)
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.message ?? `Bulk ${action} failed.`)
    } finally {
      setBulkBusy(false)
    }
  }

  const totalPages = meta.last_page
  const from = (meta.current_page - 1) * meta.per_page + 1
  const to   = Math.min(meta.current_page * meta.per_page, meta.total)

  function buildPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <>
      {/* Modals */}
      {showAddModal && (
        <AddUserModal token={token} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchUsers() }} />
      )}
      {planUser && (
        <GrantPlanModal
          user={planUser} token={token}
          onClose={() => setPlanUser(null)}
          onSuccess={() => { setPlanUser(null); fetchUsers() }}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage, verify, and monitor all registered users.</p>
            {newSinceSeen > 0 && (
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-pink-700 bg-pink-50 border border-pink-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse-ring" />
                {newSinceSeen} new {newSinceSeen === 1 ? 'user' : 'users'} since you last looked
                {lastSeen && <span className="font-normal text-pink-500">· {fmtDate(lastSeen)}</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportUsersCSV(users)}
              disabled={users.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-brand shadow-brand hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiDefs.map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
                    {kpiValues[kpi.key] !== undefined ? fmtNum(kpiValues[kpi.key]) : '—'}
                  </p>
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={kpi.up ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                    </svg>
                    {kpi.change} vs last month
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <PresenceControl token={token} onDone={fetchUsers} />

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          {/* The search box keeps a real width no matter how many dropdowns
              sit beside it: it takes the whole first line, and the dropdowns
              wrap underneath instead of squeezing it down to its icons. */}
          <div className="flex flex-wrap gap-3">
            <div className="relative basis-full min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input type="text" placeholder="Search by name, email or phone..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
              <option value="deleted">Deleted</option>
            </select>

            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="support">Support</option>
              <option value="analyst">Analyst</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <select value={verificationFilter} onChange={e => setVerificationFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="unverified">Unverified</option>
            </select>

            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
              <option value="all">Signed up anywhere</option>
              <option value="web">Website</option>
              {/* 'app' is both stores together, because that is how it gets asked. */}
              <option value="app">App (either store)</option>
              <option value="android">Android app</option>
              <option value="ios">iOS app</option>
              <option value="unknown">Unknown (before tracking)</option>
            </select>

            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
              <option value="all">Any gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              {/* Its own answer, not the absence of one — a skewed feed is
                  usually a pile of half-finished sign-ups. */}
              <option value="unset">Not set</option>
            </select>

            <select value={sort} onChange={e => setSort(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="last_active">Recently active</option>
              <option value="name">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="coins">Most coins</option>
            </select>
          </div>

          {/* Second row: the narrower questions — when they joined, where they
              are, and whether they are on the app right now. */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-500 whitespace-nowrap">
              Joined
              <input type="date" value={fromDate} max={toDate || undefined}
                onChange={e => setFromDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700" />
              <span className="text-gray-400">to</span>
              <input type="date" value={toDate} min={fromDate || undefined}
                onChange={e => setToDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700" />
            </label>

            <input type="text" placeholder="City (typed or current)" value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300" />

            <select value={onlineFilter} onChange={e => setOnlineFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-700 cursor-pointer">
              <option value="all">Online or not</option>
              <option value="online">Online now</option>
              <option value="offline">Offline</option>
            </select>

            {(statusFilter !== 'all' || roleFilter !== 'all' || verificationFilter !== 'all' || sourceFilter !== 'all'
              || genderFilter !== 'all' || onlineFilter !== 'all' || cityFilter || fromDate || toDate
              || sort !== 'newest' || search) && (
              <button
                onClick={() => {
                  setSearch(''); setStatusFilter('all'); setRoleFilter('all')
                  setVerificationFilter('all'); setSourceFilter('all')
                  setGenderFilter('all'); setOnlineFilter('all'); setCityFilter('')
                  setFromDate(''); setToDate(''); setSort('newest')
                }}
                className="px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-4 px-6 py-3 bg-pink-50 border-b border-pink-100">
              <span className="text-sm font-medium text-brand">{selected.size} user{selected.size > 1 ? 's' : ''} selected</span>
              <button onClick={() => handleBulkAction('verify')}    disabled={bulkBusy} className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50">Verify All</button>
              <button onClick={() => handleBulkAction('suspend')}   disabled={bulkBusy} className="text-xs font-medium text-orange-600 hover:underline disabled:opacity-50">Suspend All</button>
              <button onClick={() => handleBulkAction('unsuspend')} disabled={bulkBusy} className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50">Unsuspend All</button>
              <button onClick={() => handleBulkAction('delete')}    disabled={bulkBusy} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">Delete All</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => handleBulkAction('presence_online')}  disabled={bulkBusy} className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50">Show Online</button>
              <button onClick={() => handleBulkAction('presence_offline')} disabled={bulkBusy} className="text-xs font-medium text-gray-600 hover:underline disabled:opacity-50">Show Offline</button>
              <button onClick={() => handleBulkAction('presence_auto')}    disabled={bulkBusy} className="text-xs font-medium text-pink-600 hover:underline disabled:opacity-50">Auto</button>
              <button onClick={() => { setSelected(new Set()); setSelectAll(false) }} className="text-xs font-medium text-gray-400 hover:underline ml-auto">Clear</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="w-10 pl-5 py-3">
                    <input type="checkbox" checked={selectAll} onChange={toggleAll}
                      className="rounded border-gray-300 text-brand focus:ring-pink-400" />
                  </th>
                  {['User', 'Phone', 'Location', 'Role', 'Plan', 'Verification', 'Status', 'Joined', 'Last Active', ''].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16 text-gray-400 text-sm">
                      <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.356-3.765M9 20H4v-2a4 4 0 015.356-3.765M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      No users match the current filters.
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}
                      className={`hover:bg-gray-50/60 transition-colors ${selected.has(user.id) ? 'bg-pink-50/40' : ''}`}>

                      <td className="pl-5 py-3.5">
                        <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelect(user.id)}
                          className="rounded border-gray-300 text-brand focus:ring-pink-400" />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openUser(user)} className="flex-shrink-0 focus:outline-none">
                            <Avatar name={user.name || '?'} photo={user.profile_photo} />
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openUser(user)} className="font-semibold text-gray-900 truncate max-w-[130px] hover:text-pink-600 transition-colors text-left">
                                {user.name || '—'}
                              </button>
                              {isNewUser(user) && (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-pink-500 text-white flex-shrink-0">New</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate max-w-[130px]">{user.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">{user.phone || '—'}</td>

                      {/* Both addresses, labelled. The typed one is what they
                          said; the second line is where their phone last was,
                          shown only when it differs — otherwise it is noise. */}
                      <td className="px-4 py-3.5 text-gray-600 text-xs max-w-[190px]">
                        {user.city
                          ? <div className="truncate" title={user.entered_address || undefined}>
                              {user.city}{user.country ? <>, <span className="text-gray-400">{user.country}</span></> : null}
                            </div>
                          : <span className="text-gray-300">—</span>}
                        {user.current_city && user.current_city !== user.city && (
                          <div className="truncate text-[11px] text-gray-400"
                            title={`Phone reported ${user.current_address}${user.location_updated_at ? ` · ${fmtDateTime(user.location_updated_at)}` : ''}`}>
                            <span className="text-gray-300">now:</span> {user.current_city}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5"><RoleBadge role={user.role} /></td>
                      <td className="px-4 py-3.5"><PlanBadge plan={user.subscription_plan} name={user.plan_name} active={user.plan_active} expiresAt={user.plan_expires_at} /></td>
                      <td className="px-4 py-3.5"><VerificationBadge status={user.verification_status} /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={user.status} /></td>

                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs tabular-nums">
                        <div className="flex items-center">
                          {fmtDate(user.created_at)}
                          <SignupSourceBadge source={user.signup_source} label={user.signup_source_label} />
                        </div>
                        {/* The clock, on its own line: two accounts created the
                            same day are otherwise indistinguishable and the
                            order they are listed in looks arbitrary. */}
                        <div className="text-[11px] text-gray-400">{fmtTime(user.created_at)}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs tabular-nums">
                        {user.is_online ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-green-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Online
                          </span>
                        ) : (
                          <span className="text-gray-500" title={fmtDateTime(user.last_seen ?? user.last_login_at)}>
                            {user.last_active ?? (fmtDate(user.last_login_at) || '—')}
                          </span>
                        )}
                        {/* Says so when the status above was set rather than
                            observed — otherwise there is no way to tell a
                            pinned account from one that is genuinely around. */}
                        {user.presence_override && (
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-600"
                            title={`Pinned by an admin${user.presence_override_at ? ` · ${fmtDateTime(user.presence_override_at)}` : ''}`}>
                            Set by admin
                          </div>
                        )}
                      </td>

                      <td className="pr-4 py-3.5">
                        <ActionsMenu
                          user={user} token={token} onRefresh={fetchUsers}
                          onEdit={u => editUser(u)}
                          onView={u => openUser(u)}
                          onPlan={u => setPlanUser(u)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {meta.total > 0
                ? <>Showing <span className="font-semibold text-gray-700 tabular-nums">{fmtNum(from)}–{fmtNum(to)}</span> of <span className="font-semibold text-gray-700 tabular-nums">{fmtNum(meta.total)}</span> users</>
                : 'No users found'}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {buildPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)} disabled={loading}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors tabular-nums ${
                      p === page ? 'gradient-brand text-white shadow-brand' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {p}
                  </button>
                )
              )}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50">
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

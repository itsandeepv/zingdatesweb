'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import type { UserStatus, VerificationStatus } from '@/lib/types'

/* ── Types ───────────────────────────────────────────── */
interface ApiUser {
  id: number
  name: string
  email: string | null
  phone: string | null
  profile_photo?: string
  subscription_plan?: string
  verification_status: VerificationStatus
  is_verified: boolean
  status: UserStatus
  role: string
  gender?: string
  city?: string
  country?: string
  bio?: string
  created_at: string
  last_login_at: string | null
}

interface Meta {
  total: number
  current_page: number
  last_page: number
  per_page: number
}

interface AddUserForm {
  name: string; email: string; phone: string; password: string; role: string; gender: string
}
interface EditUserForm {
  name: string; email: string; phone: string; role: string; gender: string; city: string; status: string
}

const DEFAULT_ADD_FORM: AddUserForm = { name: '', email: '', phone: '', password: '', role: 'user', gender: '' }

const BULK_LABELS: Record<string, string> = {
  suspend: 'suspended', unsuspend: 'unsuspended', verify: 'verified', delete: 'deleted',
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

function fmtNum(n: number | undefined): string {
  if (n === undefined || n === null) return '—'
  return n.toLocaleString('en-US')
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Badges ──────────────────────────────────────────── */
function PlanBadge({ plan }: { plan: string | undefined }) {
  if (!plan) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Free</span>
  const lower = plan.toLowerCase()
  if (lower.includes('vip'))       return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">VIP</span>
  if (lower.includes('premium'))   return <span className="px-2 py-0.5 rounded-full text-xs font-semibold gradient-brand text-white">Premium</span>
  if (lower.includes('corporate')) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-white">Corporate</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Free</span>
}

function VerificationBadge({ status }: { status: VerificationStatus | undefined }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      Verified
    </span>
  )
  if (status === 'pending') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Unverified</span>
}

function StatusBadge({ status }: { status: UserStatus }) {
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

function RoleBadge({ role }: { role: string }) {
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

function Avatar({ name, photo, large }: { name: string; photo?: string; large?: boolean }) {
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
function inputCls(err?: string) {
  return `w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
    err ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-pink-300'
  }`
}

/* ── Actions dropdown ────────────────────────────────── */
function ActionsMenu({
  user, token, onRefresh, onEdit, onView,
}: {
  user: ApiUser; token: string; onRefresh: () => void
  onEdit: (u: ApiUser) => void
  onView: (u: ApiUser) => void
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const payload: Record<string, any> = { name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role }
      if (form.phone.trim()) payload.phone  = form.phone.trim()
      if (form.gender)       payload.gender = form.gender
      await usersApi.create(token, payload)
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
              {['user','moderator','support','analyst','marketing','finance','admin'].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
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
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
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

/* ── Edit User Modal ─────────────────────────────────── */
function EditUserModal({ user, onClose, onSuccess, token }: { user: ApiUser; onClose: () => void; onSuccess: () => void; token: string }) {
  const [form, setForm]     = useState<EditUserForm>({
    name:   user.name   || '',
    email:  user.email  || '',
    phone:  user.phone  || '',
    role:   user.role   || 'user',
    gender: user.gender || '',
    city:   user.city   || '',
    status: user.status || 'active',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})

  function set(field: keyof EditUserForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const payload: Record<string, any> = {
        name:   form.name.trim(),
        role:   form.role,
        status: form.status,
      }
      if (form.email.trim())  payload.email  = form.email.trim()
      if (form.phone.trim())  payload.phone  = form.phone.trim()
      if (form.gender)        payload.gender = form.gender
      if (form.city.trim())   payload.city   = form.city.trim()
      await usersApi.update(token, user.id, payload)
      toast.success(`User "${form.name}" updated successfully.`)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.status === 422 ? 'Validation failed. Check the form fields.' : (err?.message ?? 'Failed to update user.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Edit User" subtitle={`Editing profile for ${user.name || 'user'}`} onClose={onClose}>
      <form id="edit-user-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" className={inputCls(errors.name)} autoFocus />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls()}>
              {['user','moderator','support','analyst','marketing','finance','admin','super_admin'].map(r => (
                <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" className={inputCls(errors.email)} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" className={inputCls()} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls()}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls()}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </form>
      <ModalFooter onClose={onClose} formId="edit-user-form" loading={loading} label="Save Changes" />
    </ModalShell>
  )
}

/* ── View User Modal ─────────────────────────────────── */
function ViewUserModal({ user, onClose, onEdit, token, onRefresh }: {
  user: ApiUser; onClose: () => void; onEdit: (u: ApiUser) => void; token: string; onRefresh: () => void
}) {
  const [busy, setBusy] = useState(false)

  async function doAction(action: 'verify' | 'suspend' | 'unsuspend' | 'delete') {
    if (action === 'delete' && !window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      if (action === 'verify')    await usersApi.verify(token, user.id)
      if (action === 'suspend')   await usersApi.suspend(token, user.id, 'Suspended by admin')
      if (action === 'unsuspend') await usersApi.unsuspend(token, user.id)
      if (action === 'delete')    await usersApi.delete(token, user.id)
      toast.success(`${user.name} has been ${BULK_LABELS[action]}.`)
      onRefresh()
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header banner */}
        <div className="gradient-brand px-6 pt-8 pb-14 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">User Profile</p>
          <h2 className="text-white text-xl font-bold mt-1">{user.name || '—'}</h2>
        </div>

        {/* Avatar overlapping banner */}
        <div className="px-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="ring-4 ring-white rounded-full flex-shrink-0">
              <Avatar name={user.name || '?'} photo={user.profile_photo} large />
            </div>
            <div className="flex gap-2 flex-wrap pb-1">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
              <VerificationBadge status={user.verification_status} />
            </div>
          </div>

          {/* Details grid */}
          <div className="space-y-3 pb-5 border-b border-gray-100">
            {[
              { label: 'Email',       value: user.email },
              { label: 'Phone',       value: user.phone },
              { label: 'Location',    value: [user.city, user.country].filter(Boolean).join(', ') || null },
              { label: 'Plan',        value: user.subscription_plan || 'Free' },
              { label: 'Joined',      value: fmtDate(user.created_at) },
              { label: 'Last Active', value: fmtDate(user.last_login_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <span className="text-sm text-gray-700 font-medium">{value || '—'}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="py-5 flex flex-wrap gap-2">
            <button onClick={() => { onClose(); onEdit(user) }}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            {!user.is_verified && (
              <button onClick={() => doAction('verify')} disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-green-200 text-green-600 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify
              </button>
            )}

            {user.status === 'suspended' ? (
              <button onClick={() => doAction('unsuspend')} disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50">
                Unsuspend
              </button>
            ) : (
              <button onClick={() => doAction('suspend')} disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-50">
                Suspend
              </button>
            )}

            <button onClick={() => doAction('delete')} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 ml-auto">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Plan', 'Status', 'Verification', 'City', 'Country', 'Joined', 'Last Active']
  const rows = users.map(u => [
    u.id, u.name || '', u.email || '', u.phone || '', u.role,
    u.subscription_plan || 'Free', u.status, u.verification_status,
    u.city || '', u.country || '', fmtDate(u.created_at), fmtDate(u.last_login_at),
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

/* ── Main page ───────────────────────────────────────── */
export default function UsersPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [users, setUsers]         = useState<ApiUser[]>([])
  const [meta, setMeta]           = useState<Meta>({ total: 0, current_page: 1, last_page: 1, per_page: 25 })
  const [kpiValues, setKpiValues] = useState<Record<string, number>>({})
  const [loading, setLoading]     = useState(true)

  const [search, setSearch]                       = useState('')
  const [debouncedSearch, setDebouncedSearch]     = useState('')
  const [statusFilter, setStatusFilter]           = useState('all')
  const [roleFilter, setRoleFilter]               = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [page, setPage]                           = useState(1)

  const [selectAll, setSelectAll] = useState(false)
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy]   = useState(false)

  const [showAddModal, setShowAddModal]   = useState(false)
  const [editUser, setEditUser]           = useState<ApiUser | null>(null)
  const [viewUser, setViewUser]           = useState<ApiUser | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  useEffect(() => { setPage(1) }, [statusFilter, roleFilter, verificationFilter])

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
  }, [token, page, debouncedSearch, statusFilter, roleFilter, verificationFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function toggleSelect(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    if (selectAll) { setSelected(new Set()); setSelectAll(false) }
    else { setSelected(new Set(users.map(u => u.id))); setSelectAll(true) }
  }

  async function handleBulkAction(action: 'suspend' | 'unsuspend' | 'verify' | 'delete') {
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
      {editUser && (
        <EditUserModal
          user={editUser} token={token}
          onClose={() => setEditUser(null)}
          onSuccess={() => { setEditUser(null); fetchUsers() }}
        />
      )}
      {viewUser && (
        <ViewUserModal
          user={viewUser} token={token}
          onClose={() => setViewUser(null)}
          onEdit={u => { setViewUser(null); setEditUser(u) }}
          onRefresh={fetchUsers}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage, verify, and monitor all registered users.</p>
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

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
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

            {(statusFilter !== 'all' || roleFilter !== 'all' || verificationFilter !== 'all' || search) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setRoleFilter('all'); setVerificationFilter('all') }}
                className="px-3.5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                Reset
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
                          <button onClick={() => setViewUser(user)} className="flex-shrink-0 focus:outline-none">
                            <Avatar name={user.name || '?'} photo={user.profile_photo} />
                          </button>
                          <div className="min-w-0">
                            <button onClick={() => setViewUser(user)} className="font-semibold text-gray-900 truncate max-w-[130px] hover:text-pink-600 transition-colors text-left">
                              {user.name || '—'}
                            </button>
                            <p className="text-xs text-gray-400 truncate max-w-[130px]">{user.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">{user.phone || '—'}</td>

                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">
                        {user.city ? <>{user.city}, <span className="text-gray-400">{user.country}</span></> : <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3.5"><RoleBadge role={user.role} /></td>
                      <td className="px-4 py-3.5"><PlanBadge plan={user.subscription_plan} /></td>
                      <td className="px-4 py-3.5"><VerificationBadge status={user.verification_status} /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={user.status} /></td>

                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs tabular-nums">{fmtDate(user.created_at)}</td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs tabular-nums">{fmtDate(user.last_login_at)}</td>

                      <td className="pr-4 py-3.5">
                        <ActionsMenu
                          user={user} token={token} onRefresh={fetchUsers}
                          onEdit={u => setEditUser(u)}
                          onView={u => setViewUser(u)}
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

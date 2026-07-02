'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { staffApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import type { StaffMember, AdminRole } from '@/lib/types'

/* ─── Role helpers ──────────────────────────────────────────────────────── */
const ROLE_META: Record<AdminRole, { label: string; badgeCls: string; desc: string }> = {
  super_admin:       { label: 'Super Admin',       badgeCls: 'gradient-brand text-white',             desc: 'Full system access, all permissions' },
  admin:             { label: 'Admin',              badgeCls: 'bg-purple-100 text-purple-700',         desc: 'Users, events, payments management' },
  moderator:         { label: 'Moderator',          badgeCls: 'bg-blue-100 text-blue-700',             desc: 'Content review, user moderation' },
  event_manager:     { label: 'Event Manager',      badgeCls: 'bg-orange-100 text-orange-700',         desc: 'Create and manage events' },
  support_agent:     { label: 'Support Agent',      badgeCls: 'bg-green-100 text-green-700',           desc: 'Handle support tickets' },
  marketing_manager: { label: 'Marketing Manager',  badgeCls: 'bg-pink-100 text-pink-700',             desc: 'Campaigns, coupons, SEO' },
  finance_manager:   { label: 'Finance Manager',    badgeCls: 'bg-yellow-100 text-yellow-700',         desc: 'Payments, invoices, reports' },
}

const ALL_PERMISSIONS = ['users', 'events', 'payments', 'subscriptions', 'tickets', 'campaigns', 'coupons', 'seo', 'invoices', 'reports', 'api_keys', 'staff']

/* ─── Avatar ────────────────────────────────────────────────────────────── */
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

/* ─── Role Badge ────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: AdminRole }) {
  const m = ROLE_META[role]
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.badgeCls}`}>{m.label}</span>
}

/* ─── Status Badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: StaffMember['status'] }) {
  const cls = status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>{status}</span>
}

/* ─── Spinner ───────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin w-7 h-7 text-pink-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function StaffPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState<AdminRole>('support_agent')
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [inviting, setInviting] = useState(false)

  async function loadStaff() {
    setLoading(true)
    try {
      const res = await staffApi.list(token)
      setStaff(Array.isArray(res) ? res : (res.data ?? res.staff ?? []))
    } catch {
      toast.error('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const totalStaff = staff.length
  const active = staff.filter(s => s.status === 'active').length
  const twoFA = staff.filter(s => s.is2FAEnabled).length
  const roles = new Set(staff.map(s => s.role)).size

  // Derive roles overview from live data
  const rolesOverview = (Object.keys(ROLE_META) as AdminRole[]).map(role => ({
    role,
    count: staff.filter(s => s.role === role).length,
  }))

  function togglePerm(p: string) {
    setSelectedPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Name and email are required')
      return
    }
    setInviting(true)
    try {
      await staffApi.invite(token, { name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole })
      toast.success(`Invite sent to ${inviteEmail}`)
      setShowInvite(false)
      setInviteName('')
      setInviteEmail('')
      setInviteRole('support_agent')
      setSelectedPerms([])
      await loadStaff()
    } catch {
      toast.error('Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  async function handleSuspend(id: string, name: string) {
    setActionLoading(`suspend-${id}`)
    try {
      await staffApi.suspend(token, id)
      toast.success(`${name} has been suspended`)
      await loadStaff()
    } catch {
      toast.error('Failed to suspend staff member')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from staff? This action cannot be undone.`)) return
    setActionLoading(`remove-${id}`)
    try {
      await staffApi.remove(token, id)
      toast.success(`${name} has been removed`)
      await loadStaff()
    } catch {
      toast.error('Failed to remove staff member')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage admin roles, permissions and access control</p>
        </div>
        <button
          onClick={() => setShowInvite(v => !v)}
          className="gradient-brand text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2"
          style={{ boxShadow: '0 2px 8px rgba(233,30,140,0.35)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Invite Staff Member
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: totalStaff, icon: '👥' },
          { label: 'Active', value: active, icon: '✅' },
          { label: 'Roles', value: roles, icon: '🏷' },
          { label: '2FA Enabled', value: twoFA, icon: '🔐' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
            <div className="text-2xl">{k.icon}</div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Roles Overview Grid */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <h2 className="text-base font-bold text-gray-900 mb-4">Roles Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {rolesOverview.map(r => {
            const m = ROLE_META[r.role]
            return (
              <div key={r.role} className="border border-gray-100 rounded-xl p-4 hover:border-pink-200 hover:shadow-sm transition-all">
                <p className="text-xl font-extrabold text-gray-900">{r.count}</p>
                <p className="text-xs font-bold text-gray-700 mt-1 leading-tight">{m.label}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{m.desc}</p>
                <button className="mt-2 text-xs gradient-brand-text font-semibold hover:underline">Edit Permissions</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Staff Members</h2>
        </div>
        {loading ? (
          <Spinner />
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
            <p className="text-sm font-medium">No staff members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">Member</th>
                  <th className="px-6 py-3 text-left font-semibold">Role</th>
                  <th className="px-6 py-3 text-left font-semibold">Permissions</th>
                  <th className="px-6 py-3 text-center font-semibold">2FA</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Last Login</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} />
                        <div>
                          <p className="font-semibold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><RoleBadge role={s.role} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-700">{(s.permissions ?? []).includes('*') ? 'All' : (s.permissions ?? []).length}</span>
                        <span className="text-xs text-gray-400">permissions</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.is2FAEnabled
                        ? <span title="2FA Enabled"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mx-auto text-emerald-500" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></span>
                        : <span title="2FA Disabled"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mx-auto text-red-400" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></span>
                      }
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-4 text-xs text-gray-500">{s.lastLoginAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                        <button
                          onClick={() => handleSuspend(s.id, s.name)}
                          disabled={actionLoading === `suspend-${s.id}`}
                          className="text-xs font-semibold text-orange-500 hover:text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === `suspend-${s.id}` ? 'Suspending…' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleRemove(s.id, s.name)}
                          disabled={actionLoading === `remove-${s.id}`}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === `remove-${s.id}` ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Form */}
      {showInvite && (
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)', border: '1px solid #fce7f3' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Invite Staff Member</h2>
            <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="jane@zingdates.app"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as AdminRole)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                {Object.keys(ROLE_META).map(r => (
                  <option key={r} value={r}>{ROLE_META[r as AdminRole].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">Custom Permissions</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {ALL_PERMISSIONS.map(p => (
                <label key={p} className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(p)}
                    onChange={() => togglePerm(p)}
                    className="rounded border-gray-300 text-pink-500 focus:ring-pink-400"
                  />
                  <span className="text-xs text-gray-600 capitalize group-hover:text-gray-900">{p.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="gradient-brand text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 2px 8px rgba(233,30,140,0.35)' }}
            >
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { usersApi } from '@/lib/api'
import GrantPlanModal from '@/components/admin/GrantPlanModal'
import {
  type ApiUser, BULK_LABELS, fmtDate,
  RoleBadge, StatusBadge, VerificationBadge, PhotoLightbox, UserMediaSection,
} from './shared'
import { fmtDateTime } from '@/lib/site'

/**
 * One user, in full, as a page. `onChanged` re-fetches after an action that
 * alters the row; `onDeleted` leaves the page, since there is nothing left.
 */
export default function UserDetail({ user, token, onChanged, onDeleted }: {
  user: ApiUser; token: string; onChanged: () => void; onDeleted: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

  async function doAction(action: 'verify' | 'suspend' | 'unsuspend' | 'delete') {
    if (action === 'delete' && !window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      if (action === 'verify')    await usersApi.verify(token, user.id)
      if (action === 'suspend')   await usersApi.suspend(token, user.id, 'Suspended by admin')
      if (action === 'unsuspend') await usersApi.unsuspend(token, user.id)
      if (action === 'delete')    await usersApi.delete(token, user.id)
      toast.success(`${user.name} has been ${BULK_LABELS[action]}.`)
      if (action === 'delete') onDeleted()
      else onChanged()
    } catch (err: any) {
      toast.error(err?.message ?? 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {preview && user.profile_photo && (
        <PhotoLightbox src={user.profile_photo} alt={user.name || 'Profile photo'} onClose={() => setPreview(false)} />
      )}
      {planOpen && (
        <GrantPlanModal user={user} token={token} onClose={() => setPlanOpen(false)} onSuccess={() => { setPlanOpen(false); onChanged() }} />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header: photo, name and badges together. */}
        <div className="gradient-brand px-6 py-6 relative">
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-4">
            {user.profile_photo ? (
              <button type="button" onClick={() => setPreview(true)} title="View photo"
                className="group relative flex-shrink-0 rounded-full ring-4 ring-white/40 hover:ring-white transition-all focus:outline-none focus:ring-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.profile_photo} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 8v6m-3-3h6m5 0a8 8 0 11-16 0 8 8 0 0116 0z" />
                  </svg>
                </span>
              </button>
            ) : (
              <div className="w-20 h-20 rounded-full flex-shrink-0 bg-white/20 ring-4 ring-white/40 flex items-center justify-center text-white text-2xl font-bold">
                {(user.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider">User #{user.id}</p>
              <h2 className="text-white text-xl font-bold leading-tight truncate">{user.name || '—'}</h2>
              <div className="flex gap-1.5 flex-wrap mt-2">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
                <VerificationBadge status={user.verification_status} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-x-10">
          {/* Details grid */}
          <div className="space-y-3 pb-5 lg:pb-0 border-b lg:border-b-0 border-gray-100">
            {[
              { label: 'Email',       value: user.email },
              { label: 'Phone',       value: user.phone },
              { label: 'Gender',      value: user.gender ? user.gender.replace(/_/g, ' ') : null },
              // Two addresses, labelled as what they are. Reading one as the
              // other is how an admin ends up sending a companion to the wrong
              // city, so neither is called just "Location".
              { label: 'Address given', value: user.entered_address
                  || [user.city, user.country].filter(Boolean).join(', ') || null },
              { label: 'Last known location', value: user.current_address
                  ? `${user.current_address}${user.location_updated_at ? ` · ${fmtDateTime(user.location_updated_at)}` : ''}`
                  : (user.has_gps_fix ? 'Coordinates only, no address' : 'Never shared') },
              { label: 'Plan',        value: user.plan_active && user.plan_expires_at
                  ? `${user.plan_name ?? user.subscription_plan} · until ${fmtDate(user.plan_expires_at)}`
                  : (user.subscription_plan ? `${user.plan_name ?? user.subscription_plan} (expired)` : 'Free') },
              ...(user.plan_started_at
                ? [{ label: 'Plan started', value: fmtDateTime(user.plan_started_at) }]
                : []),
              // With the time: two accounts created the same day are otherwise
              // indistinguishable.
              { label: 'Joined',      value: fmtDateTime(user.created_at) },
              { label: 'Signed up on', value: user.signup_source_label ?? 'Unknown' },
              { label: 'Last active', value: user.is_online
                  ? 'Online now'
                  : (user.last_active ?? fmtDateTime(user.last_seen ?? user.last_login_at)) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs text-gray-400 font-medium flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-700 font-medium text-right break-words min-w-0 ">{value || '—'}</span>
              </div>
            ))}
            {user.bio && (
              <div className="pt-1">
                <span className="text-xs text-gray-400 font-medium">Bio</span>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-line">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Everything this person has uploaded — profile, gallery and what
              they sent in chats — so it can be reviewed in one place. */}
          <div className="lg:border-l lg:border-gray-100 lg:pl-10">
            <UserMediaSection userId={user.id} token={token} />
          </div>
        </div>

        <div className="px-6">
          {/* Action buttons */}
          <div className="py-5 border-t border-gray-100 flex flex-wrap gap-2">
            <Link href={`/admin/users/${user.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>

            <button onClick={() => setPlanOpen(true)} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
              {user.plan_active ? 'Change Plan' : 'Give Plan'}
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


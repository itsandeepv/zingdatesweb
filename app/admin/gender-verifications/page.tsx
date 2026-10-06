'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { genderVerificationApi, type GenderVerificationRow } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/**
 * Admin > live selfies.
 *
 * A sibling of the KYC queue rather than a tab inside it: that one compares a
 * document to a typed name and can be re-run automatically, this one is a
 * person looking at a face. Folding both into one component would mean a row
 * where half the columns are meaningless.
 *
 * The job is one glance. Is this a woman, and is she doing the thing the
 * server asked for a moment before the camera opened? The gesture is printed
 * beside the picture, because without it the selfie says nothing about when
 * it was taken.
 *
 * The picture is gone as soon as a decision is made — approve or reject. A
 * missing image on a decided row is the system working.
 */
export default function GenderVerificationsPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [rows, setRows] = useState<GenderVerificationRow[]>([])
  const [pending, setPending] = useState(0)
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState<number | null>(null)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await genderVerificationApi.list(token, status)
      setRows(res.rows ?? [])
      setPending(res.pending ?? 0)
    } catch {
      toast.error('Could not load the queue')
    } finally {
      setLoading(false)
    }
  }, [token, status])

  useEffect(() => { load() }, [load])

  async function approve(row: GenderVerificationRow) {
    setBusy(row.id)
    try {
      await genderVerificationApi.approve(token, row.id)
      toast.success(`${row.user?.name ?? 'She'} is verified`)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not approve')
    } finally {
      setBusy(null)
    }
  }

  async function reject(row: GenderVerificationRow) {
    setBusy(row.id)
    try {
      await genderVerificationApi.reject(token, row.id, reason.trim())
      toast.success('Rejected — she can try again')
      setRejecting(null)
      setReason('')
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not reject')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Live selfies
          {pending > 0 && (
            <span className="ml-2 rounded-full bg-pink-100 px-2.5 py-0.5 text-sm font-bold text-pink-700">
              {pending} waiting
            </span>
          )}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Women are asked for a live selfie holding a pose we name a moment earlier. Check the
          face matches the pose, then approve. Approving adds the badge and settles their gender;
          rejecting lets them try again.
        </p>
      </div>

      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(t => (
          <button key={t} onClick={() => setStatus(t)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              status === t
                ? 'border-pink-500 bg-pink-500 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">
          {status === 'pending' ? 'Nothing waiting. ' : 'Nothing here.'}
          {status === 'pending' && <span className="text-gray-400">The queue is clear.</span>}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(row => (
            <div key={row.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {row.selfie_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.selfie_url} alt="" className="h-72 w-full bg-gray-100 object-cover" />
              ) : (
                <div className="flex h-72 w-full items-center justify-center bg-gray-50 px-6 text-center text-xs text-gray-400">
                  Deleted — the selfie is erased as soon as a decision is made.
                </div>
              )}

              <div className="p-4">
                {/* The whole point of the row. Printed first, because a face
                    on its own proves nothing about when it was taken. */}
                <p className="rounded-lg bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700">
                  Asked: {row.instruction}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {row.user?.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.user.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{row.user?.name ?? '—'}</p>
                    <p className="truncate text-xs text-gray-500">
                      {[row.user?.city, row.user?.joined && `joined ${row.user.joined}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                {row.status !== 'pending' ? (
                  <p className={`mt-3 text-xs font-bold uppercase ${
                    row.status === 'approved' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {row.status}
                    {row.review_note && <span className="ml-1 font-normal normal-case text-gray-500">· {row.review_note}</span>}
                  </p>
                ) : rejecting === row.id ? (
                  <div className="mt-3 space-y-2">
                    <input
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Why? (she will see this)"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => reject(row)} disabled={busy === row.id}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        Confirm reject
                      </button>
                      <button onClick={() => { setRejecting(null); setReason('') }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => approve(row)} disabled={busy === row.id}
                      className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                      {busy === row.id ? '…' : 'Approve'}
                    </button>
                    <button onClick={() => setRejecting(row.id)}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { mediaApi, type AdminMedia } from '@/lib/api'

/**
 * Everything one user has uploaded — profile, gallery, and what they sent in
 * chats and booking chats — with its moderation status and the two decisions
 * an admin can make.
 *
 * Pending and under-review items are shown here and NOWHERE else: the API
 * refuses to serve them to other users until they are approved. Rejecting
 * erases the file from storage; deleting removes file and record together.
 */
export default function UserMediaPanel({ userId, token }: { userId: number; token: string }) {
  const [items, setItems] = useState<AdminMedia[] | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await mediaApi.forUser(token, userId)
      setItems(res.media ?? [])
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not load media')
    }
  }, [token, userId])

  useEffect(() => { if (token) load() }, [token, load])

  async function decide(m: AdminMedia, status: AdminMedia['status']) {
    if (status === 'rejected' && !window.confirm('Reject this file? The file itself is deleted from storage.')) return
    setBusyId(m.id)
    try {
      await mediaApi.setStatus(token, m.id, status)
      setItems(prev => (prev ?? []).map(x => (x.id === m.id ? { ...x, status } : x)))
      toast.success(status === 'approved' ? 'Media approved.' : 'Media rejected.')
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Could not update media.')
    } finally {
      setBusyId(null)
    }
  }

  async function setHold(m: AdminMedia, hold: boolean) {
    const reason = hold
      ? window.prompt('Why is this being held? (shown in the admin trail)', 'Reported — possible illegal content')
      : null
    if (hold && reason === null) return

    setBusyId(m.id)
    try {
      await mediaApi.setLegalHold(token, m.id, hold, reason ?? undefined)
      setItems(prev => (prev ?? []).map(x => (x.id === m.id ? { ...x, legal_hold: hold, status: hold ? 'rejected' : x.status } : x)))
      toast.success(hold ? 'Held — this file can no longer be deleted.' : 'Hold released.')
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Could not change the hold.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(m: AdminMedia) {
    if (!window.confirm('Delete this file for good? It is removed from storage as well as the database.')) return
    setBusyId(m.id)
    try {
      await mediaApi.remove(token, m.id)
      setItems(prev => (prev ?? []).filter(x => x.id !== m.id))
      toast.success('Media deleted.')
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  const statusClass = (s: AdminMedia['status']) =>
    s === 'approved' ? 'text-green-600' : s === 'rejected' ? 'text-red-500' : 'text-orange-500'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Uploaded media</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Profile, gallery and files sent in chats. Anything not approved is hidden from other users.
          </p>
        </div>
        <button onClick={load} className="text-xs text-pink-600 hover:underline">Refresh</button>
      </div>

      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : !items ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400">This user has not uploaded anything.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map(m => (
            <div key={m.id} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              {/* A video is exactly what a photo-only panel misses, so it gets
                  a real player rather than a broken <img>. */}
              {m.media_type === 'video' && m.url ? (
                <video src={m.url} controls preload="metadata" className="w-full h-28 object-cover bg-black" />
              ) : m.media_type === 'image' && m.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.original_name ?? m.kind} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center text-[11px] text-gray-400 px-2 text-center">
                  {m.status === 'rejected' ? 'file deleted' : `${m.media_type} file`}
                </div>
              )}

              <div className="px-2 py-1.5">
                <p className="text-[11px] font-semibold text-gray-700 capitalize truncate">{m.kind.replace('_', ' ')}</p>
                <p className="text-[10px] text-gray-400 truncate">{new Date(m.uploaded_at).toLocaleString()}</p>
                <p className={`text-[10px] font-semibold capitalize ${statusClass(m.status)}`}>
                  {m.status.replace('_', ' ')}
                </p>
                {m.legal_hold && (
                  <p className="text-[10px] font-semibold text-purple-600" title={m.legal_hold_reason ?? ''}>
                    ⚖ On legal hold — kept as evidence
                  </p>
                )}

                <div className="flex gap-1 mt-1.5">
                  {m.legal_hold ? (
                    <button onClick={() => setHold(m, false)} disabled={busyId === m.id}
                      className="flex-1 text-[10px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md py-1 disabled:opacity-40">
                      Release hold
                    </button>
                  ) : (
                    <button onClick={() => setHold(m, true)} disabled={busyId === m.id}
                      title="Keep this file as evidence — nothing will be able to delete it"
                      className="px-2 text-[10px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md py-1 disabled:opacity-40">
                      ⚖
                    </button>
                  )}
                  {!m.legal_hold && m.status !== 'approved' && (
                    <button onClick={() => decide(m, 'approved')} disabled={busyId === m.id}
                      className="flex-1 text-[10px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-md py-1 disabled:opacity-40">
                      Approve
                    </button>
                  )}
                  {!m.legal_hold && m.status !== 'rejected' && (
                    <button onClick={() => decide(m, 'rejected')} disabled={busyId === m.id}
                      className="flex-1 text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-md py-1 disabled:opacity-40">
                      Reject
                    </button>
                  )}
                  <button onClick={() => remove(m)} disabled={busyId === m.id || m.legal_hold}
                    title={m.legal_hold ? 'On legal hold — release it first' : 'Delete permanently'}
                    className="px-2 text-[10px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md py-1 disabled:opacity-40">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

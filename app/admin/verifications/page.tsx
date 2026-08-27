'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { kycApi } from '@/lib/api'

const STATUS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

const DOC_LABEL: Record<string, string> = {
  aadhaar: 'Aadhaar', pan: 'PAN', passport: 'Passport', dl: 'Driving licence', voter: 'Voter ID',
}

/**
 * KYC review. The decision is one comparison: does the name on the document
 * belong to the person claiming it? Everything on the row serves that.
 */
export default function AdminVerificationsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [busy, setBusy] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await kycApi.list(token, status === 'all' ? {} : { status })
      setRows(res.data ?? [])
    } catch (e: any) { toast.error(e?.message ?? 'Failed to load') }
    finally { setLoading(false) }
  }, [token, status])

  useEffect(() => { load() }, [load])

  async function act(id: number, fn: () => Promise<any>, msg: string) {
    setBusy(id)
    try { await fn(); toast.success(msg); setRejecting(null); setReason(''); await load() }
    catch (e: any) { toast.error(e?.message ?? 'Action failed') }
    finally { setBusy(null) }
  }

  // The document is behind admin auth, so it cannot be loaded by <img src>
  // directly — fetch it with the bearer token and show it as a blob.
  async function openDoc(url: string) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Could not load document')
      setPreview(URL.createObjectURL(await res.blob()))
    } catch (e: any) { toast.error(e?.message ?? 'Could not load document') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ID Verification</h1>
        <p className="text-gray-500 text-sm">
          Approve creators so they can withdraw earnings. A confident name match verifies automatically —
          these are the ones that need a human.
        </p>
      </div>

      <div className="flex gap-2">
        {['pending', 'verified', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
              status === s ? 'gradient-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-60 items-center">
          <div className="w-9 h-9 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          Nothing to review.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const score = r.match_score
            const scoreCls = score == null ? 'text-gray-400'
              : score >= 85 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{r.user}</p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS[r.status]}`}>{r.status}</span>
                      {r.auto_verified && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">auto</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{r.phone} · {DOC_LABEL[r.document_type] ?? r.document_type}</p>
                  </div>

                  {/* The comparison the whole decision rests on */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Entered</p>
                      <p className="font-semibold text-gray-800">{r.entered_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">On document</p>
                      <p className="font-semibold text-gray-800">
                        {r.extracted_name ?? <span className="text-gray-400 font-normal">could not read</span>}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Match</p>
                      <p className={`font-extrabold ${scoreCls}`}>{score == null ? '—' : `${score}%`}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => openDoc(r.document_url)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                      View document
                    </button>
                    <button disabled={busy === r.id} onClick={() => act(r.id, () => kycApi.recheck(token, r.id), 'Re-checked')}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold hover:bg-blue-100">
                      Re-check
                    </button>
                    {r.status !== 'verified' && (
                      <button disabled={busy === r.id} onClick={() => act(r.id, () => kycApi.approve(token, r.id), 'Verified')}
                        className="px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 font-bold hover:bg-green-200">
                        Approve
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button disabled={busy === r.id} onClick={() => { setRejecting(rejecting === r.id ? null : r.id); setReason('') }}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-600 font-bold hover:bg-red-200">
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {r.review_note && r.status === 'rejected' && (
                  <p className="text-xs text-red-600 mt-2">Reason: {r.review_note}</p>
                )}

                {rejecting === r.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="Why? The user sees this, so say what to fix."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <button
                      disabled={!reason.trim() || busy === r.id}
                      onClick={() => act(r.id, () => kycApi.reject(token, r.id, reason.trim()), 'Rejected')}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50">
                      Confirm reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => { URL.revokeObjectURL(preview); setPreview(null) }}>
          <img src={preview} alt="ID document" className="max-h-[85vh] max-w-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  )
}

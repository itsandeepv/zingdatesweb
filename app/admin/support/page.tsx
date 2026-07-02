'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { supportApi } from '@/lib/api'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: 'bg-blue-50 text-blue-600',
    medium: 'bg-yellow-50 text-yellow-700',
    high: 'bg-orange-50 text-orange-700',
    urgent: 'bg-red-50 text-red-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[priority] ?? 'bg-gray-50 text-gray-500'}`}>{priority}</span>
}

export default function SupportPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [tickets, setTickets] = useState<any[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await supportApi.list(token, params)
      setTickets(res.data ?? res ?? [])
      if (res.meta) setMeta(res.meta)
    } catch (err: any) { toast.error(err.message || 'Failed to load tickets') }
    finally { setLoading(false) }
  }, [token, page, statusFilter])

  useEffect(() => { loadTickets() }, [loadTickets])

  async function handleReply(id: number) {
    if (!replyText.trim()) return
    setActionLoading(id)
    try {
      await supportApi.reply(token, id, replyText)
      toast.success('Reply sent')
      setReplyingTo(null)
      setReplyText('')
      loadTickets()
    } catch (err: any) { toast.error(err.message || 'Failed to send reply') }
    finally { setActionLoading(null) }
  }

  async function handleResolve(id: number) {
    setActionLoading(id)
    try {
      await supportApi.resolve(token, id)
      toast.success('Ticket resolved')
      loadTickets()
    } catch (err: any) { toast.error(err.message || 'Failed to resolve') }
    finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and respond to user support requests</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          {['open','pending','resolved','all'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${statusFilter === s ? 'gradient-brand text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">No tickets found.</div>
          ) : tickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">#{ticket.ticket_number ?? ticket.id}</span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority ?? 'medium'} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1">{ticket.subject}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.message ?? ticket.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{ticket.user_name ?? ticket.userName ?? 'Unknown User'}</span>
                    <span>·</span>
                    <span>{ticket.created_at ?? ticket.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setReplyingTo(replyingTo === ticket.id ? null : ticket.id); setReplyText('') }}
                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-medium">
                    Reply
                  </button>
                  {ticket.status !== 'resolved' && (
                    <button onClick={() => handleResolve(ticket.id)} disabled={actionLoading === ticket.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-medium disabled:opacity-50">
                      {actionLoading === ticket.id ? '...' : 'Resolve'}
                    </button>
                  )}
                </div>
              </div>
              {replyingTo === ticket.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..." rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    <button onClick={() => handleReply(ticket.id)} disabled={!replyText.trim() || actionLoading === ticket.id}
                      className="px-4 py-1.5 text-xs rounded-lg gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
                      {actionLoading === ticket.id ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {meta.last_page} · {meta.total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => Math.min(meta.last_page,p+1))} disabled={page===meta.last_page}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

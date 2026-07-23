'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { contactApi } from '@/lib/api'

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}

const STATUS_TABS = ['all', 'new', 'read', 'replied', 'archived'] as const

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new:      'bg-pink-100 text-pink-700',
    read:     'bg-blue-100 text-blue-700',
    replied:  'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

function fmtDate(s: string) {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminContactPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadMessages = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      const res = await contactApi.list(token, params)
      setMessages(res.data ?? [])
      if (res.meta) setMeta(res.meta)
      if (res.counts) setCounts(res.counts)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [token, page, statusFilter, search])

  useEffect(() => { loadMessages() }, [loadMessages])

  async function setStatus(m: ContactMessage, status: string) {
    setActionLoading(m.id)
    try {
      await contactApi.updateStatus(token, m.id, status)
      toast.success(`Marked as ${status}`)
      loadMessages()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  async function remove(m: ContactMessage) {
    if (!confirm(`Delete the message from ${m.name}? This cannot be undone.`)) return
    setActionLoading(m.id)
    try {
      await contactApi.remove(token, m.id)
      toast.success('Message deleted')
      loadMessages()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleExpand(m: ContactMessage) {
    if (expanded === m.id) { setExpanded(null); return }
    setExpanded(m.id)
    // Opening a 'new' message marks it read (backend does the same on show()).
    if (m.status === 'new') {
      try {
        await contactApi.updateStatus(token, m.id, 'read')
        setMessages(prev => prev.map(x => x.id === m.id ? { ...x, status: 'read' } : x))
        setCounts(c => ({ ...c, new: Math.max(0, (c.new ?? 1) - 1), read: (c.read ?? 0) + 1 }))
      } catch { /* non-critical */ }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enquiries submitted through the website contact form</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, email, subject…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 10-12 0 6 6 0 0012 0z" /></svg>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${statusFilter === s ? 'gradient-brand text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {s}
            {counts[s] != null && (
              <span className={`ml-1.5 text-xs ${statusFilter === s ? 'text-white/80' : 'text-gray-400'}`}>{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">No messages found.</div>
      ) : (
        <div className="space-y-3">
          {messages.map(m => {
            const isOpen = expanded === m.id
            return (
              <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-colors ${m.status === 'new' ? 'border-pink-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => toggleExpand(m)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">#{m.id}</span>
                      <StatusBadge status={m.status} />
                      <span className="text-xs text-gray-400">{fmtDate(m.created_at)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1">{m.subject}</h3>
                    <p className={`text-sm text-gray-600 mt-1 ${isOpen ? '' : 'line-clamp-2'}`}>{m.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{m.name}</span>
                      <span>·</span>
                      <span>{m.email}</span>
                    </div>
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}
                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-medium">
                    Reply by email
                  </a>
                  {m.status !== 'replied' && (
                    <button onClick={() => setStatus(m, 'replied')} disabled={actionLoading === m.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-medium disabled:opacity-50">
                      Mark replied
                    </button>
                  )}
                  {m.status !== 'archived' ? (
                    <button onClick={() => setStatus(m, 'archived')} disabled={actionLoading === m.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium disabled:opacity-50">
                      Archive
                    </button>
                  ) : (
                    <button onClick={() => setStatus(m, 'read')} disabled={actionLoading === m.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium disabled:opacity-50">
                      Unarchive
                    </button>
                  )}
                  <button onClick={() => remove(m)} disabled={actionLoading === m.id}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium disabled:opacity-50 ml-auto">
                    {actionLoading === m.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {meta.last_page} · {meta.total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { userSupportApi } from '@/lib/api'

const STATUS: Record<string, { label: string; cls: string }> = {
  open:      { label: 'Open',      cls: 'bg-amber-100 text-amber-700' },
  pending:   { label: 'In review', cls: 'bg-blue-100 text-blue-700' },
  escalated: { label: 'Escalated', cls: 'bg-pink-100 text-pink-700' },
  resolved:  { label: 'Resolved',  cls: 'bg-green-100 text-green-700' },
}

/**
 * Support page for browser users. Mirrors the in-app screen: raise a query and
 * follow the reply thread. App users get the in-app form instead, which keeps
 * their session and attaches device details automatically.
 */
export default function SupportPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [categories, setCategories] = useState<any[]>([])
  const [category, setCategory] = useState('app_issue')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<any>(null)
  const [replyText, setReplyText] = useState('')

  const load = useCallback(async () => {
    try {
      const [c, t] = await Promise.all([userSupportApi.categories(token), userSupportApi.list(token)])
      setCategories(c.categories ?? [])
      setTickets(t.tickets ?? [])
    } catch {
      setTickets([])           // a failed list must not block raising a query
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  async function submit() {
    if (message.trim().length < 10) {
      toast.error('Please describe the issue in a little more detail')
      return
    }
    setSending(true)
    try {
      const res = await userSupportApi.create(token, {
        message: message.trim(),
        category,
        device_info: typeof navigator !== 'undefined' ? `web · ${navigator.userAgent.slice(0, 160)}` : 'web',
      })
      setMessage('')
      toast.success(res.message ?? 'Query submitted')
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not submit your query')
    } finally { setSending(false) }
  }

  async function openTicket(t: any) {
    try {
      const res = await userSupportApi.get(token, t.id)
      setOpen({ ticket: res.ticket, replies: res.replies ?? [] })
    } catch { toast.error('Could not open this query') }
  }

  async function sendReply() {
    if (!replyText.trim() || !open) return
    setSending(true)
    try {
      await userSupportApi.reply(token, open.ticket.id, replyText.trim())
      setReplyText('')
      await openTicket(open.ticket)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not send your reply')
    } finally { setSending(false) }
  }

  // ── Conversation ──
  if (open) {
    const meta = STATUS[open.ticket.status] ?? STATUS.open
    const closed = open.ticket.status === 'resolved'

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <button onClick={() => setOpen(null)} className="text-sm font-semibold text-purple-600 hover:underline">
          ← Back to support
        </button>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">{open.ticket.subject}</h1>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
        </div>

        <div className="space-y-3">
          <div className="bg-purple-50 rounded-2xl p-4 ml-auto max-w-[92%]">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{open.ticket.message}</p>
          </div>
          {open.replies.map((r: any) => (
            <div key={r.id}
              className={`rounded-2xl p-4 max-w-[92%] ${r.is_admin ? 'bg-white border border-gray-100' : 'bg-purple-50 ml-auto'}`}>
              {r.is_admin && <p className="text-[11px] font-bold text-pink-600 uppercase mb-1">ZingDates Support</p>}
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}
        </div>

        {closed ? (
          <p className="text-sm text-gray-400 text-center">
            This query is marked resolved. Still stuck? Raise a new one from the support page.
          </p>
        ) : (
          <div className="flex gap-2">
            <textarea
              value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Add more details…" rows={2}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <button onClick={sendReply} disabled={sending || !replyText.trim()}
              className="px-5 rounded-2xl gradient-brand text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50">
              Send
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Form + my queries ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help &amp; Support</h1>
        <p className="text-gray-500 text-sm">Tell us what went wrong and we&apos;ll get back to you.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">What is it about?</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                  category === c.key ? 'gradient-brand text-white border-transparent shadow-brand'
                                     : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Describe the issue</label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)} rows={5} maxLength={5000}
            placeholder="What happened? What were you doing at the time?"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <button onClick={submit} disabled={sending}
          className="w-full py-3 rounded-2xl gradient-brand text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50">
          {sending ? 'Submitting…' : 'Submit query'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
        </div>
      ) : tickets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase">Your queries</h2>
          {tickets.map(t => {
            const meta = STATUS[t.status] ?? STATUS.open
            return (
              <button key={t.id} onClick={() => openTicket(t)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-brand transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-gray-900 truncate">{t.subject}</p>
                  <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{t.message}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                  <span>{new Date(t.created_at).toDateString()}</span>
                  {t.replies_count > 0 && (
                    <span className="font-semibold text-pink-600">
                      {t.replies_count} repl{t.replies_count === 1 ? 'y' : 'ies'}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

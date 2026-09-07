'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { contactApi } from '@/lib/api'

const SUBJECTS = [
  'Account & sign-in',
  'Payments, plans & refunds',
  'Companion bookings',
  'Report a user or safety concern',
  'Delete my account',
  'Bug report',
  'Something else',
]

export default function SupportForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  /** Mirrors the API's own rules so people are told before a round trip. */
  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Please tell us your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address'
    if (form.message.trim().length < 10) e.message = 'Please describe the issue in at least 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (sending || !validate()) return
    setSending(true)
    try {
      await contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      })
      setSent(true)
    } catch (err) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Could not send your message. Please email us instead.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message received</h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Our support team replies within 2 working days, to the email address you gave us.
        </p>
        <button
          onClick={() => { setSent(false); setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' }) }}
          className="mt-6 text-sm font-semibold text-pink-600 hover:text-pink-700"
        >
          Send another message
        </button>
      </div>
    )
  }

  const inputCls = (bad?: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-all ${
      bad ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-pink-200 focus:border-transparent'
    }`

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="s-name" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Your name</label>
          <input id="s-name" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Full name" className={inputCls(errors.name)} />
          {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="s-email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email</label>
          <input id="s-email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="you@example.com" className={inputCls(errors.email)} />
          {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="s-subject" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What is this about?</label>
        <select id="s-subject" value={form.subject} onChange={e => set('subject', e.target.value)} className={inputCls()}>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="s-message" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">How can we help?</label>
        <textarea id="s-message" rows={6} value={form.message} onChange={e => set('message', e.target.value)}
          placeholder="Tell us what happened. If it is about a payment or booking, include the date and amount so we can find it faster."
          className={`${inputCls(errors.message)} resize-y leading-relaxed`} />
        {errors.message && <p className="text-xs text-red-500 mt-1.5">{errors.message}</p>}
      </div>

      <button type="submit" disabled={sending}
        className="w-full gradient-brand text-white font-bold py-3.5 rounded-2xl shadow-brand hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {sending && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
        {sending ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        You can also email us directly at{' '}
        <a href="mailto:zingdates2026@gmail.com" className="text-pink-600 font-semibold">zingdates2026@gmail.com</a>
      </p>
    </form>
  )
}

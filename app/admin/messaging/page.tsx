'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { messagingApi } from '@/lib/api'

export default function MessagingPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setSending] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    target_type: 'all',
    target_id: '',
    image_url: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSend(e: { preventDefault(): void }) {
    e.preventDefault()
    setSending(true)
    try {
      await messagingApi.sendPush(token, {
        title: form.title,
        body: form.body,
        target_type: form.target_type,
        ...(form.target_id && { target_id: form.target_id }),
        ...(form.image_url && { image_url: form.image_url }),
      })
      toast.success('Push notification sent successfully')
      setForm({ title: '', body: '', target_type: 'all', target_id: '', image_url: '' })
    } catch (err: any) { toast.error(err.message || 'Failed to send notification') }
    finally { setSending(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Push Messaging</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send push notifications to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Send Push Notification</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Special Offer!" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea value={form.body} onChange={e => set('body', e.target.value)}
                placeholder="Your notification message..." rows={3} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select value={form.target_type} onChange={e => set('target_type', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="all">All Users</option>
                <option value="premium">Premium Subscribers</option>
                <option value="free">Free Users</option>
                <option value="inactive">Inactive Users (30+ days)</option>
                <option value="new">New Users (last 7 days)</option>
                <option value="user">Specific User</option>
              </select>
            </div>
            {form.target_type === 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input type="text" value={form.target_id} onChange={e => set('target_id', e.target.value)}
                  placeholder="Enter user ID" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
              <input type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                  Sending...
                </span>
              ) : 'Send Notification'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="bg-gray-900 rounded-2xl p-4 text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{form.title || 'Notification Title'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{form.body || 'Your message will appear here...'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-right">now · zingDates</p>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-gray-50 space-y-2">
            <p className="text-xs font-medium text-gray-700">Target: <span className="font-normal text-gray-500 capitalize">{form.target_type === 'all' ? 'All Users' : form.target_type}</span></p>
            <p className="text-xs font-medium text-gray-700">Title length: <span className={`font-normal ${form.title.length > 50 ? 'text-red-500' : 'text-gray-500'}`}>{form.title.length}/65</span></p>
            <p className="text-xs font-medium text-gray-700">Body length: <span className={`font-normal ${form.body.length > 120 ? 'text-red-500' : 'text-gray-500'}`}>{form.body.length}/120</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { marketingApi } from '@/lib/api'

export default function MarketingPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percent', discount_value: '', expires_at: '' })

  useEffect(() => {
    async function load() {
      try {
        const [c, cp] = await Promise.all([marketingApi.campaigns(token), marketingApi.coupons(token)])
        setCampaigns(c.data ?? c ?? [])
        setCoupons(cp.data ?? cp ?? [])
      } catch (err: any) { toast.error(err.message || 'Failed to load') }
      finally { setLoading(false) }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  async function handleSendCampaign(id: number) {
    if (!confirm('Send this campaign now?')) return
    setActionLoading(id)
    try {
      await marketingApi.sendCampaign(token, id)
      toast.success('Campaign sent successfully')
    } catch (err: any) { toast.error(err.message || 'Failed to send') }
    finally { setActionLoading(null) }
  }

  async function handleDeleteCoupon(id: number) {
    if (!confirm('Delete this coupon?')) return
    setActionLoading(id)
    try {
      await marketingApi.deleteCoupon(token, id)
      toast.success('Coupon deleted')
      setCoupons(c => c.filter(cp => cp.id !== id))
    } catch (err: any) { toast.error(err.message || 'Failed to delete') }
    finally { setActionLoading(null) }
  }

  async function handleCreateCoupon(e: { preventDefault(): void }) {
    e.preventDefault()
    try {
      const res = await marketingApi.createCoupon(token, couponForm)
      toast.success('Coupon created')
      setCoupons(c => [...c, res.data ?? res])
      setShowCouponForm(false)
      setCouponForm({ code: '', discount_type: 'percent', discount_value: '', expires_at: '' })
    } catch (err: any) { toast.error(err.message || 'Failed to create coupon') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage campaigns, coupons, and promotions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Campaigns</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {campaigns.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No campaigns yet.</p>
          ) : campaigns.map(c => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{c.name ?? c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.type ?? c.campaign_type} · {c.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'sent' ? 'bg-green-100 text-green-700' : c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                {c.status !== 'sent' && (
                  <button onClick={() => handleSendCampaign(c.id)} disabled={actionLoading === c.id}
                    className="px-3 py-1.5 text-xs rounded-lg gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
                    {actionLoading === c.id ? 'Sending...' : 'Send Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Coupons</h2>
          <button onClick={() => setShowCouponForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-brand shadow-brand hover:opacity-90">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Create Coupon
          </button>
        </div>

        {showCouponForm && (
          <form onSubmit={handleCreateCoupon} className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input type="text" placeholder="Coupon Code" value={couponForm.code} onChange={e => setCouponForm(f => ({...f, code: e.target.value}))}
                required className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <select value={couponForm.discount_type} onChange={e => setCouponForm(f => ({...f, discount_type: e.target.value}))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input type="number" placeholder="Discount Value" value={couponForm.discount_value} onChange={e => setCouponForm(f => ({...f, discount_value: e.target.value}))}
                required className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <input type="date" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({...f, expires_at: e.target.value}))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button type="button" onClick={() => setShowCouponForm(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-sm rounded-lg gradient-brand text-white font-medium hover:opacity-90">Create</button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-50">
          {coupons.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No coupons yet.</p>
          ) : coupons.map(cp => (
            <div key={cp.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold font-mono text-gray-900">{cp.code}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {cp.discount_type === 'percent' ? `${cp.discount_value}% off` : `$${cp.discount_value} off`}
                  {cp.expires_at ? ` · Expires ${cp.expires_at}` : ''}
                </p>
              </div>
              <button onClick={() => handleDeleteCoupon(cp.id)} disabled={actionLoading === cp.id}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50">
                {actionLoading === cp.id ? '...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

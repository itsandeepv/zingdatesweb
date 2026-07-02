'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { analyticsApi } from '@/lib/api'

const PERIODS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

function StatCard({ label, value, change, up }: { label: string; value: string; change?: string; up?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {change && <p className={`text-xs font-semibold mt-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>{up ? '▲' : '▼'} {change}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await analyticsApi.overview(token, period)
        setData(res)
      } catch (err: any) { toast.error(err.message || 'Failed to load analytics') }
      finally { setLoading(false) }
    }
    if (token) load()
    else setLoading(false)
  }, [token, period])

  function fmt(n: number) { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n ?? 0) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform performance overview</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p.value ? 'gradient-brand text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">No analytics data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={fmt(data.total_users ?? data.totalUsers ?? 0)} change={`${data.user_growth ?? data.userGrowth ?? 0}%`} up={(data.user_growth ?? data.userGrowth ?? 0) >= 0} />
            <StatCard label="New Users" value={fmt(data.new_users ?? data.newUsers ?? 0)} change={`${data.new_user_growth ?? 0}%`} up={(data.new_user_growth ?? 0) >= 0} />
            <StatCard label="Revenue" value={`$${((data.revenue ?? 0)/100).toLocaleString()}`} change={`${data.revenue_growth ?? data.revenueGrowth ?? 0}%`} up={(data.revenue_growth ?? 0) >= 0} />
            <StatCard label="Active Events" value={fmt(data.active_events ?? data.activeEvents ?? 0)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">User Engagement</h2>
              <div className="space-y-3">
                {[
                  { label: 'Daily Active Users', value: fmt(data.dau ?? data.daily_active_users ?? 0) },
                  { label: 'Weekly Active Users', value: fmt(data.wau ?? data.weekly_active_users ?? 0) },
                  { label: 'Monthly Active Users', value: fmt(data.mau ?? data.monthly_active_users ?? 0) },
                  { label: 'Avg. Session Duration', value: `${data.avg_session_duration ?? data.avgSessionDuration ?? 0} min` },
                  { label: 'Messages Sent', value: fmt(data.messages_sent ?? data.messagesSent ?? 0) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
              <div className="space-y-3">
                {[
                  { label: 'Subscriptions', value: `$${((data.subscription_revenue ?? data.subscriptionRevenue ?? 0)/100).toLocaleString()}` },
                  { label: 'Events', value: `$${((data.event_revenue ?? data.eventRevenue ?? 0)/100).toLocaleString()}` },
                  { label: 'Coin Purchases', value: `$${((data.coin_revenue ?? data.coinRevenue ?? 0)/100).toLocaleString()}` },
                  { label: 'Total Transactions', value: fmt(data.total_transactions ?? data.totalTransactions ?? 0) },
                  { label: 'Avg. Revenue Per User', value: `$${((data.arpu ?? 0)/100).toFixed(2)}` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

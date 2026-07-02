'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { dashboardApi } from '@/lib/api'

/* ─── KPI Card ── */
function KpiCard({ title, value, trend, icon, accent = '#E91E8C' }: {
  title: string; value: string; trend: number; icon: React.ReactNode; accent?: string
}) {
  const up = trend >= 0
  return (
    <div className="bg-white rounded-2xl p-5 flex gap-4 items-start" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)', borderLeft: `4px solid ${accent}` }}>
      <div className="gradient-brand-soft rounded-xl flex items-center justify-center shrink-0" style={{ width: 48, height: 48 }}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
        <p className={`text-xs font-semibold mt-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>{up ? '▲' : '▼'} {Math.abs(trend)}% vs last month</p>
      </div>
    </div>
  )
}

function UserGrowthChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data?.length) return null
  const chartH = 160, chartW = 580, barGap = 8
  const totalBars = data.length
  const barW = Math.floor((chartW - barGap * (totalBars - 1)) / totalBars)
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH + 28}`} width="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E91E8C" stopOpacity="1" />
            <stop offset="100%" stopColor="#9C27B0" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {[0,0.25,0.5,0.75,1].map((f,i) => <line key={i} x1={0} y1={chartH - f*chartH} x2={chartW} y2={chartH - f*chartH} stroke="#f0f0f0" strokeWidth={1} />)}
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / maxVal) * chartH)
          const x = i * (barW + barGap), y = chartH - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill="url(#barGrad)" />
              <text x={x + barW/2} y={chartH + 18} textAnchor="middle" fontSize={10} fill="#9ca3af">{d.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function RevenueDonut({ subscriptions = 68, events = 22, coins = 10 }: { subscriptions?: number; events?: number; coins?: number }) {
  const segments = [
    { label: 'Subscriptions', pct: subscriptions, color: '#E91E8C' },
    { label: 'Events', pct: events, color: '#9C27B0' },
    { label: 'Coins', pct: coins, color: '#f59e0b' },
  ]
  const cx = 80, cy = 80, r = 60, innerR = 40
  let cumPct = 0
  const slices = segments.map(seg => {
    const startPct = cumPct; cumPct += seg.pct
    const startAngle = (startPct / 100) * 2 * Math.PI - Math.PI / 2
    const endAngle = (cumPct / 100) * 2 * Math.PI - Math.PI / 2
    const largeArc = seg.pct > 50 ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(endAngle), iy1 = cy + innerR * Math.sin(endAngle)
    const ix2 = cx + innerR * Math.cos(startAngle), iy2 = cy + innerR * Math.sin(startAngle)
    return { ...seg, d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z` }
  })
  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 160 160" width={160} height={160}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth={2} />)}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="#6b7280" fontWeight={500}>Revenue</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#9ca3af">Mix</text>
      </svg>
      <div className="w-full space-y-2">
        {slices.map(s => (
          <div key={s.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} /><span className="text-gray-600 text-xs">{s.label}</span></div>
            <span className="font-semibold text-gray-800 text-xs">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function fmt(n: number) { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n) }
function fmtCurrency(n: number) { return '$' + (n/100).toLocaleString('en-US', { minimumFractionDigits: 0 }) }

export default function AdminDashboardPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [stats, setStats] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, a] = await Promise.all([
          dashboardApi.stats(token),
          dashboardApi.recentActivity(token),
        ])
        setStats(s)
        setActivity(a?.data ?? a ?? [])
      } catch {}
      finally { setLoading(false) }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
    </div>
  )

  const totalUsers = stats?.total_users ?? stats?.totalUsers ?? 0
  const revenue = stats?.revenue_this_month ?? stats?.revenueThisMonth ?? 0
  const revenueGrowth = stats?.revenue_growth ?? stats?.revenueGrowth ?? 0
  const activeEvents = stats?.active_events ?? stats?.activeEvents ?? 0
  const pendingTickets = stats?.pending_tickets ?? stats?.pendingTickets ?? 0
  const newUsersToday = stats?.new_users_today ?? stats?.newUsersToday ?? 0
  const newUsersThisMonth = stats?.new_users_this_month ?? stats?.newUsersThisMonth ?? 0
  const activeUsers = stats?.active_users ?? stats?.activeUsers ?? 0
  const chartData = stats?.user_growth_data ?? stats?.userGrowthData ?? []
  const topCountries = stats?.top_countries ?? stats?.topCountries ?? []

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here is what is happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-gray-500">Live data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Users" value={fmt(totalUsers)} trend={8.4} accent="#E91E8C"
          icon={<svg width="22" height="22" fill="none" stroke="#E91E8C" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
        <KpiCard title="Monthly Revenue" value={fmtCurrency(revenue)} trend={revenueGrowth} accent="#9C27B0"
          icon={<svg width="22" height="22" fill="none" stroke="#9C27B0" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
        <KpiCard title="Active Events" value={activeEvents.toLocaleString()} trend={12.1} accent="#8b5cf6"
          icon={<svg width="22" height="22" fill="none" stroke="#8b5cf6" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
        <KpiCard title="Open Tickets" value={pendingTickets.toLocaleString()} trend={-5.2} accent="#f59e0b"
          icon={<svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">User Growth</h2>
              <p className="text-xs text-gray-500 mt-0.5">Monthly registered users — last 12 months</p>
            </div>
            <span className="text-xs font-bold gradient-brand-text">{fmt(totalUsers)} total</span>
          </div>
          <UserGrowthChart data={chartData} />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-800">Revenue This Month</h2>
            <p className="text-xs text-gray-500 mt-0.5">Breakdown by source</p>
          </div>
          <div className="flex flex-col items-center">
            <RevenueDonut />
            <div className="mt-4 w-full pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">{fmtCurrency(revenue)}</span></div>
              <div className="flex justify-between text-xs mt-1"><span className="text-gray-500">Growth MoM</span><span className="font-semibold text-emerald-600">+{revenueGrowth}%</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Real-time Activity</h2>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-gray-400">Live</span></span>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 8).map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full shrink-0 bg-pink-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{item.message ?? item.description}</p>
                    <span className="text-xs text-gray-400">{item.at ?? item.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Platform Stats</h2>
            <span className="text-xs text-gray-400 font-medium">Across all platforms</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl p-4 gradient-brand-soft">
              <p className="text-xl font-bold text-gray-900 leading-tight">{fmt(newUsersToday)}</p>
              <p className="text-xs text-gray-500">New today</p>
            </div>
            <div className="rounded-xl p-4 gradient-brand-soft">
              <p className="text-xl font-bold text-gray-900 leading-tight">{fmt(newUsersThisMonth)}</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <div className="rounded-xl p-4 gradient-brand-soft">
              <p className="text-xl font-bold text-gray-900 leading-tight">{fmt(activeUsers)}</p>
              <p className="text-xs text-gray-500">Active users</p>
            </div>
          </div>
          {topCountries.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Top Countries</p>
              {topCountries.slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5"><span className="text-xs font-medium text-gray-700">{c.country}</span><span className="text-xs text-gray-500">{fmt(c.count)}</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: 'linear-gradient(90deg,#E91E8C,#9C27B0)' }} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

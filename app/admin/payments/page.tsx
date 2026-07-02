'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { paymentsApi } from '@/lib/api'

/* ─── Types ─────────────────────────────────────────────── */
type TxStatus  = 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed'
type TxType    = 'subscription' | 'coin_purchase' | 'event_ticket' | 'refund'
type CoinType  = 'credit' | 'debit'
type ActiveTab = 'payments' | 'coins'

interface Transaction {
  id: number
  user_id: number
  transaction_id: string
  type: TxType
  amount: number | string
  currency: string
  status: TxStatus
  payment_gateway: string
  gateway_transaction_id: string | null
  gateway_order_id: string | null
  description: string | null
  failure_reason: string | null
  refund_amount: number | string | null
  refunded_at: string | null
  ip_address: string | null
  created_at: string
  user?: { id: number; name: string; email: string }
}

interface CoinEntry {
  id: number
  user_id: number
  amount: number | string
  type: CoinType
  source: string
  balance_after: number | string
  description: string | null
  created_at: string
  user?: { id: number; name: string; email: string }
}

interface Stats {
  total_revenue: number
  completed_count: number
  pending_count: number
  failed_count: number
  refunded_count: number
  refunded_amount: number
  monthly_revenue: { month: number; revenue: number }[]
}

/* ─── Helpers ────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmtINR = (v: number | string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v))

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const fmtDateShort = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

/* ─── Status Badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-500'  },
    failed:    { label: 'Failed',    cls: 'bg-red-100 text-red-600',        dot: 'bg-red-500'     },
    refunded:  { label: 'Refunded',  cls: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500'    },
    disputed:  { label: 'Disputed',  cls: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500'  },
  }
  const e = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${e.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    subscription:  { label: 'Subscription',  cls: 'bg-purple-100 text-purple-700' },
    coin_purchase: { label: 'Coins',          cls: 'bg-blue-100 text-blue-700'    },
    event_ticket:  { label: 'Event Ticket',   cls: 'bg-green-100 text-green-700'  },
    refund:        { label: 'Refund',         cls: 'bg-red-100 text-red-600'      },
  }
  const e = map[type] ?? { label: type, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.cls}`}>{e.label}</span>
}

function GatewayBadge({ gateway }: { gateway: string }) {
  const map: Record<string, string> = {
    razorpay: 'bg-sky-100 text-sky-700',
    stripe:   'bg-violet-100 text-violet-700',
    paypal:   'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[gateway] ?? 'bg-gray-100 text-gray-600'}`}>
      {gateway}
    </span>
  )
}

function CoinTypeBadge({ type }: { type: string }) {
  return type === 'credit'
    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">▲ Credit</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">▼ Debit</span>
}

/* ─── Spinner ────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

/* ─── KPI Card ───────────────────────────────────────────── */
function KpiCard({ label, value, sub, subColor, icon, loading }:
  { label: string; value: string; sub?: string; subColor?: string; icon: React.ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 shadow-brand">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        {loading
          ? <div className="h-6 w-24 rounded animate-shimmer mt-1" />
          : <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>}
        {sub && <p className={`text-xs mt-0.5 font-medium ${subColor ?? 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Transaction Detail Modal ───────────────────────────── */
function TxDetailModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Transaction Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <StatusBadge status={tx.status} />
          </div>
          <Row label="Customer"          value={`${tx.user?.name ?? '—'} · ${tx.user?.email ?? '—'}`} />
          <Row label="Transaction ID"    value={tx.transaction_id} mono />
          <Row label="Type"              value={tx.type} />
          <Row label="Gateway"           value={tx.payment_gateway} />
          {tx.gateway_transaction_id && <Row label="Gateway Txn ID"  value={tx.gateway_transaction_id} mono />}
          {tx.gateway_order_id        && <Row label="Gateway Order ID" value={tx.gateway_order_id} mono />}
          <Row label="Amount"            value={`${fmtINR(tx.amount)} ${tx.currency}`} />
          {tx.description && <Row label="Description" value={tx.description} />}
          {tx.failure_reason && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600 font-medium">Failure reason: {tx.failure_reason}</p>
            </div>
          )}
          {tx.status === 'refunded' && tx.refund_amount && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
              <Row label="Refund Amount" value={fmtINR(tx.refund_amount)} />
              {tx.refunded_at && <Row label="Refunded At" value={fmtDate(tx.refunded_at)} />}
            </div>
          )}
          {tx.ip_address && <Row label="IP Address" value={tx.ip_address} mono />}
          <Row label="Date" value={fmtDate(tx.created_at)} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-gray-900 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

/* ─── Refund Modal ───────────────────────────────────────── */
function RefundModal({ tx, onClose, onConfirm }:
  { tx: Transaction; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason]   = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!reason.trim()) { toast.error('Please provide a refund reason.'); return }
    setLoading(true)
    try { await onConfirm(reason.trim()) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Confirm Refund</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4">
            Issue refund of <span className="font-semibold text-gray-900">{fmtINR(tx.amount)}</span> to{' '}
            <span className="font-semibold text-gray-900">{tx.user?.name ?? 'user'}</span>
            {' '}for <span className="font-mono text-xs text-gray-600">{tx.transaction_id}</span>.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Reason *</label>
              <textarea
                value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder="Describe the reason for this refund…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl gradient-brand shadow-brand hover:opacity-90 disabled:opacity-60">
                {loading && <Spinner />}
                {loading ? 'Processing…' : 'Issue Refund'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ─── Revenue Bar Chart ──────────────────────────────────── */
function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const max   = Math.max(...data.map(d => d.value), 1)
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Monthly Revenue</h2>
          <p className="text-sm text-gray-400 mt-0.5">Completed transactions — {new Date().getFullYear()}</p>
        </div>
        <span className="text-sm font-bold gradient-brand-text">{fmtINR(total)} total</span>
      </div>
      <div style={{ height: 160 }} className="flex items-end gap-1.5 px-1">
        {data.map(m => {
          const pct = (m.value / max) * 100
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {fmtINR(m.value)}
              </span>
              <div className="w-full rounded-t-md relative overflow-hidden" style={{ height: `${(pct / 100) * 120}px`, minHeight: m.value > 0 ? 8 : 2 }}>
                <div className="absolute inset-0 rounded-t-md" style={{ background: 'linear-gradient(180deg,#E91E8C 0%,#9C27B0 100%)' }} />
              </div>
              <span className="text-[10px] text-gray-500 font-medium">{m.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Pagination ─────────────────────────────────────────── */
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  const pages = Array.from({ length: Math.min(5, total) }, (_, i) => {
    const start = Math.max(1, Math.min(page - 2, total - 4))
    return start + i
  })
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-400">Page {page} of {total}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          Prev
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${p === page ? 'gradient-brand text-white border-transparent shadow-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(Math.min(total, page + 1))} disabled={page === total}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function PaymentsPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [activeTab, setActiveTab] = useState<ActiveTab>('payments')

  /* ── Payments state ── */
  const [payments, setPayments]         = useState<Transaction[]>([])
  const [payMeta, setPayMeta]           = useState<{ total: number; last_page: number } | null>(null)
  const [payPage, setPayPage]           = useState(1)
  const [payStatus, setPayStatus]       = useState('')
  const [payType, setPayType]           = useState('')
  const [payGateway, setPayGateway]     = useState('')
  const [paySearch, setPaySearch]       = useState('')
  const [payLoading, setPayLoading]     = useState(true)

  /* ── Coin ledger state ── */
  const [coins, setCoins]               = useState<CoinEntry[]>([])
  const [coinMeta, setCoinMeta]         = useState<{ total: number; last_page: number } | null>(null)
  const [coinPage, setCoinPage]         = useState(1)
  const [coinType, setCoinType]         = useState('')
  const [coinSource, setCoinSource]     = useState('')
  const [coinSearch, setCoinSearch]     = useState('')
  const [coinLoading, setCoinLoading]   = useState(true)

  /* ── Stats ── */
  const [stats, setStats]               = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  /* ── Modals ── */
  const [detailTx, setDetailTx]         = useState<Transaction | null>(null)
  const [refundTx, setRefundTx]         = useState<Transaction | null>(null)
  const [actionIds, setActionIds]       = useState<Set<number>>(new Set())

  /* ── Debounce ── */
  const paySearchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coinSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debPaySearch, setDebPaySearch]   = useState('')
  const [debCoinSearch, setDebCoinSearch] = useState('')

  useEffect(() => {
    if (paySearchTimer.current) clearTimeout(paySearchTimer.current)
    paySearchTimer.current = setTimeout(() => { setDebPaySearch(paySearch); setPayPage(1) }, 350)
    return () => { if (paySearchTimer.current) clearTimeout(paySearchTimer.current) }
  }, [paySearch])

  useEffect(() => {
    if (coinSearchTimer.current) clearTimeout(coinSearchTimer.current)
    coinSearchTimer.current = setTimeout(() => { setDebCoinSearch(coinSearch); setCoinPage(1) }, 350)
    return () => { if (coinSearchTimer.current) clearTimeout(coinSearchTimer.current) }
  }, [coinSearch])

  /* ── Load payments ── */
  const loadPayments = useCallback(async () => {
    setPayLoading(true)
    try {
      const p: Record<string, string> = { page: String(payPage) }
      if (payStatus)    p.status  = payStatus
      if (payType)      p.type    = payType
      if (payGateway)   p.gateway = payGateway
      if (debPaySearch) p.search  = debPaySearch
      const res = await paymentsApi.list(token, p)
      setPayments(Array.isArray(res) ? res : (res.data ?? []))
      setPayMeta(res.meta ?? null)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load payments.')
    } finally {
      setPayLoading(false)
    }
  }, [token, payPage, payStatus, payType, payGateway, debPaySearch])

  /* ── Load coin ledger ── */
  const loadCoins = useCallback(async () => {
    setCoinLoading(true)
    try {
      const p: Record<string, string> = { page: String(coinPage) }
      if (coinType)      p.type   = coinType
      if (coinSource)    p.source = coinSource
      if (debCoinSearch) p.search = debCoinSearch
      const res = await paymentsApi.transactions(token, p)
      setCoins(Array.isArray(res) ? res : (res.data ?? []))
      setCoinMeta(res.meta ?? null)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load coin ledger.')
    } finally {
      setCoinLoading(false)
    }
  }, [token, coinPage, coinType, coinSource, debCoinSearch])

  /* ── Load stats ── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const s = await paymentsApi.stats(token)
      setStats(s)
    } catch {
      // silently ignore — KPI cards will show 0
    } finally {
      setStatsLoading(false)
    }
  }, [token])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadPayments() }, [loadPayments])
  useEffect(() => { loadCoins() }, [loadCoins])

  /* ── Chart data ── */
  const chartData = stats?.monthly_revenue?.map(m => ({
    label: MONTHS[m.month - 1],
    value: m.revenue,
  })) ?? MONTHS.map(l => ({ label: l, value: 0 }))

  /* ── Export ── */
  async function handleExport() {
    try {
      toast.info('Preparing export…')
      await paymentsApi.export(token)
      toast.success('Export queued — you will receive an email with the download link.')
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed.')
    }
  }

  /* ── Refund ── */
  async function handleRefund(reason: string) {
    if (!refundTx) return
    setActionIds(prev => new Set(prev).add(refundTx.id))
    try {
      await paymentsApi.refund(token, refundTx.id, reason)
      toast.success(`Refund issued for ${refundTx.user?.name ?? 'user'}.`)
      setRefundTx(null)
      loadPayments()
      loadStats()
    } catch (err: any) {
      toast.error(err?.message ?? 'Refund failed. Please try again.')
    } finally {
      setActionIds(prev => { const n = new Set(prev); n.delete(refundTx!.id); return n })
    }
  }

  /* ── Type distribution from current page ── */
  const txTypes: { key: TxType; label: string; color: string }[] = [
    { key: 'subscription',  label: 'Subscription',  color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { key: 'coin_purchase', label: 'Coins',          color: 'bg-blue-50 border-blue-200 text-blue-700'     },
    { key: 'event_ticket',  label: 'Event Tickets',  color: 'bg-green-50 border-green-200 text-green-700'  },
  ]

  return (
    <>
      {detailTx && <TxDetailModal tx={detailTx} onClose={() => setDetailTx(null)} />}
      {refundTx && <RefundModal tx={refundTx} onClose={() => setRefundTx(null)} onConfirm={handleRefund} />}

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments &amp; Coin Ledger</h1>
            <p className="text-sm text-gray-500 mt-0.5">Transaction records, revenue overview &amp; coin credit/debit history</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard loading={statsLoading} label="Total Revenue"
            value={fmtINR(stats?.total_revenue ?? 0)}
            sub="completed transactions"
            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <KpiCard loading={statsLoading} label="Completed"
            value={(stats?.completed_count ?? 0).toLocaleString()}
            sub="successful payments"
            subColor="text-emerald-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <KpiCard loading={statsLoading} label="Pending"
            value={(stats?.pending_count ?? 0).toLocaleString()}
            sub="awaiting payment"
            subColor="text-yellow-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <KpiCard loading={statsLoading} label="Refunded"
            value={fmtINR(stats?.refunded_amount ?? 0)}
            sub={`${(stats?.refunded_count ?? 0)} transactions`}
            subColor="text-blue-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>} />
        </div>

        {/* ── Revenue Chart ── */}
        <RevenueChart data={chartData} />

        {/* ── Type Distribution ── */}
        <div className="grid grid-cols-3 gap-4">
          {txTypes.map(({ key, label, color }) => {
            const rows   = payments.filter(p => p.type === key && p.status === 'completed')
            const count  = rows.length
            const amount = rows.reduce((s, p) => s + Number(p.amount), 0)
            return (
              <div key={key} className={`rounded-xl border p-4 ${color}`}>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmtINR(amount)} revenue</p>
              </div>
            )
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {/* Tab headers */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'payments'
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              Payments{payMeta?.total != null ? ` (${payMeta.total})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('coins')}
              className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'coins'
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              Coin Ledger{coinMeta?.total != null ? ` (${coinMeta.total})` : ''}
            </button>
          </div>

          {/* ── PAYMENTS TAB ── */}
          {activeTab === 'payments' && (
            <>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
                <select value={payStatus} onChange={e => { setPayStatus(e.target.value); setPayPage(1) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 text-gray-700">
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="disputed">Disputed</option>
                </select>
                <select value={payType} onChange={e => { setPayType(e.target.value); setPayPage(1) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 text-gray-700">
                  <option value="">All Types</option>
                  <option value="subscription">Subscription</option>
                  <option value="coin_purchase">Coin Purchase</option>
                  <option value="event_ticket">Event Ticket</option>
                  <option value="refund">Refund</option>
                </select>
                <select value={payGateway} onChange={e => { setPayGateway(e.target.value); setPayPage(1) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 text-gray-700">
                  <option value="">All Gateways</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
                <div className="relative flex-1 min-w-[200px]">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search by transaction ID, description, or user…" value={paySearch}
                    onChange={e => setPaySearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 w-full" />
                </div>
                {(payStatus || payType || payGateway || paySearch) && (
                  <button onClick={() => { setPayStatus(''); setPayType(''); setPayGateway(''); setPaySearch(''); setPayPage(1) }}
                    className="text-xs text-pink-600 font-semibold hover:text-pink-800 whitespace-nowrap">
                    Clear filters
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['#', 'Customer', 'Transaction ID', 'Type', 'Gateway', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payLoading ? (
                      <tr><td colSpan={9} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm"><Spinner /> Loading payments…</div>
                      </td></tr>
                    ) : payments.length === 0 ? (
                      <tr><td colSpan={9} className="py-16 text-center text-gray-400 text-sm">No payments found.</td></tr>
                    ) : payments.map((tx, i) => (
                      <tr key={tx.id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${i % 2 !== 0 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-3 text-xs text-gray-500">{tx.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-gray-900 text-sm">{tx.user?.name ?? `User #${tx.user_id}`}</p>
                          <p className="text-xs text-gray-400">{tx.user?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{tx.transaction_id}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap"><TypeBadge type={tx.type} /></td>
                        <td className="px-4 py-3 whitespace-nowrap"><GatewayBadge gateway={tx.payment_gateway} /></td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">{fmtINR(tx.amount)}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={tx.status} /></td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{fmtDateShort(tx.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setDetailTx(tx)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                              Details
                            </button>
                            {tx.status === 'completed' && (
                              <button
                                onClick={() => setRefundTx(tx)}
                                disabled={actionIds.has(tx.id)}
                                className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40">
                                {actionIds.has(tx.id) ? '…' : 'Refund'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={payPage} total={payMeta?.last_page ?? 1} onChange={setPayPage} />
            </>
          )}

          {/* ── COIN LEDGER TAB ── */}
          {activeTab === 'coins' && (
            <>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
                <select value={coinType} onChange={e => { setCoinType(e.target.value); setCoinPage(1) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 text-gray-700">
                  <option value="">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
                <select value={coinSource} onChange={e => { setCoinSource(e.target.value); setCoinPage(1) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 text-gray-700">
                  <option value="">All Sources</option>
                  <option value="subscription">Subscription</option>
                  <option value="purchase">Purchase</option>
                  <option value="audio_call">Audio Call</option>
                  <option value="video_call">Video Call</option>
                  <option value="gift">Gift</option>
                  <option value="referral">Referral</option>
                  <option value="admin_adjustment">Admin Adjustment</option>
                </select>
                <div className="relative flex-1 min-w-[200px]">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search by description or user…" value={coinSearch}
                    onChange={e => setCoinSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 w-full" />
                </div>
                {(coinType || coinSource || coinSearch) && (
                  <button onClick={() => { setCoinType(''); setCoinSource(''); setCoinSearch(''); setCoinPage(1) }}
                    className="text-xs text-pink-600 font-semibold hover:text-pink-800 whitespace-nowrap">
                    Clear filters
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['#', 'Customer', 'Type', 'Coins', 'Source', 'Balance After', 'Description', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coinLoading ? (
                      <tr><td colSpan={8} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm"><Spinner /> Loading coin ledger…</div>
                      </td></tr>
                    ) : coins.length === 0 ? (
                      <tr><td colSpan={8} className="py-16 text-center text-gray-400 text-sm">No coin entries found.</td></tr>
                    ) : coins.map((c, i) => (
                      <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${i % 2 !== 0 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-gray-900 text-sm">{c.user?.name ?? `User #${c.user_id}`}</p>
                          <p className="text-xs text-gray-400">{c.user?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap"><CoinTypeBadge type={c.type} /></td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`font-semibold ${c.type === 'credit' ? 'text-emerald-700' : 'text-red-600'}`}>
                            {c.type === 'credit' ? '+' : '−'}{Number(c.amount).toLocaleString()} coins
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
                            {c.source?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                          {Number(c.balance_after).toLocaleString()} coins
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{c.description ?? '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{fmtDateShort(c.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={coinPage} total={coinMeta?.last_page ?? 1} onChange={setCoinPage} />
            </>
          )}
        </div>

      </div>
    </>
  )
}

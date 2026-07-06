'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { orderApi, plansApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

declare global {
  interface Window { Razorpay: any }
}

// Feature copy + presentation per plan id. Price / period come from the
// backend so the card always reflects the amount that will actually be charged.
const PLAN_META: Record<string, { badge: string | null; features: string[] }> = {
  trial: {
    badge: null,
    features: ['Browse all profiles', 'Send messages', 'View matches', 'Audio calls'],
  },
  monthly: {
    badge: 'Popular',
    features: ['Everything in Trial', 'Video calls', 'Priority matching', 'Read receipts', 'Profile boost once/week'],
  },
  vip: {
    badge: 'Best Value',
    features: ['Everything in Monthly', 'Audio & video calls', 'Companion bookings covered', 'VIP badge', 'See who liked you', 'Priority support'],
  },
}

const PLAN_ORDER = ['trial', 'monthly', 'vip']

type PlanCard = { id: string; name: string; price: number; period: string; badge: string | null; features: string[] }

// Fallback used only if the backend plan list can't be reached.
const FALLBACK_PLANS: PlanCard[] = [
  { id: 'trial', name: '1 Day Free Trial', price: 1, period: '1 day', ...PLAN_META.trial },
  { id: 'monthly', name: 'Monthly Premium', price: 99, period: '30 days', ...PLAN_META.monthly },
  { id: 'vip', name: 'VIP Plan', price: 199, period: '30 days', ...PLAN_META.vip },
]

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PlansPage() {
  const router = useRouter()
  const { token, user, setAuth } = useAuthStore()
  const [paying, setPaying] = useState<string | null>(null)
  const [plans, setPlans] = useState<PlanCard[]>(FALLBACK_PLANS)
  const [status, setStatus] = useState<{ is_premium: boolean; plan_type: string | null; expiry: string | null } | null>(null)

  useEffect(() => {
    if (!token) return
    plansApi.info(token).then((res: any) => {
      const p = res?.plans
      if (p && typeof p === 'object') {
        const cards = PLAN_ORDER.filter(id => p[id]).map<PlanCard>(id => ({
          id,
          name: p[id].label ?? id,
          price: Number(p[id].amount ?? 0),
          period: p[id].days ? `${p[id].days} day${p[id].days > 1 ? 's' : ''}` : '',
          badge: PLAN_META[id]?.badge ?? null,
          features: PLAN_META[id]?.features ?? [],
        }))
        if (cards.length) setPlans(cards)
      }
      setStatus({ is_premium: !!res?.is_premium, plan_type: res?.plan_type ?? null, expiry: res?.expiry ?? null })
    }).catch(() => { /* keep fallback */ })
  }, [token])

  async function handlePurchase(planId: string) {
    if (paying) return
    setPaying(planId)

    try {
      const ok = await loadRazorpay()
      if (!ok) { toast.error('Payment service unavailable'); return }

      const order = await orderApi.create(token!, planId)

      const options = {
        key: order.key,
        amount: Number(order.amount) * 100, // backend returns rupees; Razorpay wants paise
        currency: order.currency ?? 'INR',
        name: 'zingDates',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        order_id: order.order_id,
        prefill: {
          name: user?.name ?? '',
          contact: user?.phone ?? '',
          email: user?.email ?? '',
        },
        theme: { color: '#E91E8C' },
        handler: async (response: any) => {
          try {
            const res = await orderApi.verify(token!, {
              order_id: order.order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan: planId,
            })
            if (res.user) {
              setAuth(token!, { ...user!, ...res.user })
            }
            toast.success('Payment successful! Plan activated.')
            router.push('/discover')
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
      }

      const rz = new window.Razorpay(options)
      rz.on('payment.failed', () => toast.error('Payment failed. Please try again.'))
      rz.open()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to initiate payment')
    } finally {
      setPaying(null)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl font-extrabold gradient-brand-text">Upgrade Your Plan</h1>
        <p className="text-sm text-gray-500">Unlock premium features and find your perfect match faster</p>
      </div>

      {/* Current plan banner */}
      {status?.is_premium && (
        <div className="rounded-2xl p-4 gradient-brand text-white flex items-center justify-between" style={{ boxShadow: '0 4px 20px rgba(233,30,140,0.25)' }}>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">{status.plan_type} plan active</p>
            {status.expiry && <p className="text-xs text-white/80 mt-0.5">Renews / expires {new Date(status.expiry).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
          </div>
          <span className="text-2xl">👑</span>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl p-5 border-2 transition-all ${plan.badge === 'Best Value' ? 'border-purple-500' : plan.badge === 'Popular' ? 'border-pink-400' : 'border-gray-200'}`}
            style={{ boxShadow: plan.badge ? '0 4px 20px rgba(233,30,140,0.12)' : '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                  {plan.badge && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.badge === 'Best Value' ? 'bg-purple-100 text-purple-700' : 'gradient-brand text-white'}`}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{plan.period}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-gray-900">₹{plan.price}</p>
              </div>
            </div>

            <ul className="space-y-1.5 mb-4">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="2.5" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase(plan.id)}
              disabled={!!paying || (status?.is_premium && status.plan_type === plan.id)}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                plan.badge ? 'gradient-brand text-white' : 'border border-gray-300 text-gray-700 hover:border-pink-400 hover:text-pink-600'
              }`}
              style={plan.badge ? { boxShadow: '0 2px 10px rgba(233,30,140,0.3)' } : {}}>
              {status?.is_premium && status.plan_type === plan.id ? 'Current Plan' : paying === plan.id ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing…
                </span>
              ) : `Get ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Secure payments via Razorpay. Cancel anytime.
      </div>
    </div>
  )
}

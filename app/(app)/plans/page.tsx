'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { orderApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

declare global {
  interface Window { Razorpay: any }
}

const PLANS = [
  {
    id: 'trial',
    name: '1 Day Trial',
    price: 1,
    period: '1 day',
    badge: null,
    color: 'border-gray-200',
    features: ['Browse all profiles', 'Send messages', 'Audio calls', 'View matches'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 299,
    period: 'per month',
    badge: 'Popular',
    color: 'border-pink-400',
    features: ['Everything in Trial', 'Video calls', 'Priority matching', 'Read receipts', 'Profile boost once/week'],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 1999,
    period: 'per year',
    badge: 'Best Value',
    color: 'border-purple-500',
    features: ['Everything in Monthly', 'Unlimited profile boosts', 'Super likes (5/day)', 'VIP badge', 'See who liked you', 'Priority support'],
  },
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

  async function handlePurchase(planId: string) {
    if (paying) return
    setPaying(planId)

    try {
      const ok = await loadRazorpay()
      if (!ok) { toast.error('Payment service unavailable'); return }

      const order = await orderApi.create(token!, planId)

      const options = {
        key: order.key,
        amount: order.amount,
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

      {/* Plans */}
      <div className="space-y-4">
        {PLANS.map(plan => (
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
              disabled={!!paying}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                plan.badge ? 'gradient-brand text-white' : 'border border-gray-300 text-gray-700 hover:border-pink-400 hover:text-pink-600'
              }`}
              style={plan.badge ? { boxShadow: '0 2px 10px rgba(233,30,140,0.3)' } : {}}>
              {paying === plan.id ? (
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

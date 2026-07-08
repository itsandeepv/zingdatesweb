'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth'

const SESSION_KEY = 'zd-plan-modal-v1'
export const PLAN_MODAL_EVT = 'zd:plan-required'

export function triggerPlanModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PLAN_MODAL_EVT))
  }
}

export default function NoPlanModal() {
  const { user, _hasHydrated } = useAuthStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!_hasHydrated || !user || user.is_premium) return

    const onTrigger = () => setShow(true)
    window.addEventListener(PLAN_MODAL_EVT, onTrigger)

    let timer: ReturnType<typeof setTimeout> | null = null
    if (!sessionStorage.getItem(SESSION_KEY)) {
      timer = setTimeout(() => setShow(true), 2500)
    }

    return () => {
      window.removeEventListener(PLAN_MODAL_EVT, onTrigger)
      if (timer) clearTimeout(timer)
    }
  }, [_hasHydrated, user?.is_premium])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[49] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="w-full sm:max-w-[390px] bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 -8px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient hero */}
        <div className="gradient-brand relative px-6 pt-8 pb-14 text-center overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="text-5xl mb-3 relative z-10" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>👑</div>
          <h2 className="text-[22px] font-extrabold text-white leading-tight relative z-10">Upgrade to Premium</h2>
          <p className="text-white/80 text-sm mt-1.5 relative z-10">Unlock everything zingDates has to offer</p>
        </div>

        {/* Starting price badge — overlaps hero */}
        <div className="flex justify-center -mt-5 relative z-10">
          <span
            className="gradient-brand text-white text-xs font-bold px-5 py-2 rounded-full"
            style={{ boxShadow: '0 4px 14px rgba(233,30,140,0.45)' }}
          >
            Plans starting at just ₹1
          </span>
        </div>

        {/* Feature list */}
        <div className="px-6 pt-5 pb-2 space-y-3.5">
          {[
            { icon: '💬', text: 'Send & receive unlimited messages' },
            { icon: '📹', text: 'Crystal-clear audio & video calls' },
            { icon: '❤️', text: 'See exactly who liked your profile' },
            { icon: '🚀', text: 'Priority matching & weekly profile boost' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(156,39,176,0.1))' }}>
                {icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pt-5 pb-8 space-y-3">
          <Link
            href="/plans"
            onClick={dismiss}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl gradient-brand text-white font-bold text-[15px] active:scale-[.98] transition-transform"
            style={{ boxShadow: '0 6px 24px rgba(233,30,140,0.4)' }}
          >
            <span>✨</span>
            View Plans & Upgrade
          </Link>
          <button
            onClick={dismiss}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-500 transition-colors py-1.5 font-medium"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Phone, Video, Smartphone, X, ArrowRight, Ticket } from 'lucide-react'
import { PLAY_STORE_URL } from '@/lib/site'

/**
 * Shown when someone tries to do something the website cannot — today that
 * is audio and video calling, which only the mobile app supports. Triggered
 * from anywhere with `triggerDownloadApp('audio' | 'video')`; mounted once in
 * the app layout, like NoPlanModal.
 */
export const DOWNLOAD_APP_EVT = 'zd:download-app'

export type DownloadAppReason = 'audio' | 'video' | 'event'

export function triggerDownloadApp(reason: DownloadAppReason) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DOWNLOAD_APP_EVT, { detail: { reason } }))
  }
}

const COPY: Record<DownloadAppReason, { Icon: typeof Phone; title: string; sub: string }> = {
  audio: { Icon: Phone, title: 'Voice calls are in the app', sub: 'Calling is not available on the website yet. Download the ZingDates app to make voice calls.' },
  video: { Icon: Video, title: 'Video calls are in the app', sub: 'Calling is not available on the website yet. Download the ZingDates app to make video calls.' },
  event: { Icon: Ticket, title: 'Join events in the app', sub: 'Joining an event happens in the ZingDates app. Install it on your phone, open this event, and grab your spot.' },
}

export default function DownloadAppModal() {
  const [reason, setReason] = useState<DownloadAppReason | null>(null)

  useEffect(() => {
    const onTrigger = (e: Event) => setReason((e as CustomEvent).detail?.reason ?? 'audio')
    window.addEventListener(DOWNLOAD_APP_EVT, onTrigger)
    return () => window.removeEventListener(DOWNLOAD_APP_EVT, onTrigger)
  }, [])

  if (!reason) return null

  const { Icon, title, sub } = COPY[reason]
  const dismiss = () => setReason(null)

  return (
    <div
      className="fixed inset-0 z-[49] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-app-title"
    >
      <div
        className="w-full sm:max-w-[390px] bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 -8px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="gradient-brand relative px-6 pt-8 pb-10 text-center overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <button onClick={dismiss} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors z-10">
            <X size={15} strokeWidth={2.5} />
          </button>
          <div className="mb-3 relative z-10 flex justify-center" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
            <Icon size={46} strokeWidth={2} className="text-white" />
          </div>
          <h2 id="download-app-title" className="text-[22px] font-extrabold text-white leading-tight relative z-10">{title}</h2>
          <p className="text-white/80 text-sm mt-1.5 relative z-10">{sub}</p>
        </div>

        <div className="px-6 pt-6 pb-8 space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-pink-50/70 border border-pink-100 px-4 py-3">
            <Smartphone size={20} className="text-pink-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              Your chats, matches and profile stay in sync. Sign in with the same number and pick up right here.
            </p>
          </div>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener"
            onClick={dismiss}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl gradient-brand text-white font-bold text-[15px] active:scale-[.98] transition-transform"
            style={{ boxShadow: '0 6px 24px rgba(233,30,140,0.4)' }}
          >
            Get it on Google Play
            <ArrowRight size={17} />
          </a>
          <button
            onClick={dismiss}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-500 transition-colors py-1.5 font-medium"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

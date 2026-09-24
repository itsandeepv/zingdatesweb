'use client'

import { useEffect, useRef } from 'react'
import DownloadAppModal, { triggerDownloadApp } from '@/components/DownloadAppModal'
import { PLAY_STORE_URL } from '@/lib/site'

/**
 * "Join in the app" on a public event page.
 *
 * A bare `zingdates://` link is a dead button everywhere the app is not: a
 * desktop browser ignores the scheme outright, and a phone without the app
 * does nothing visible. So the link is attempted, and if nothing takes the
 * page away within a moment we assume the app is missing and send Android to
 * the Play Store, and everyone else to a "get the app" prompt.
 */
export default function JoinInAppButton({ eventId, className }: { eventId: number | string; className?: string }) {
  const deepLink = `zingdates://events/${eventId}`
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // If the app did open, this page goes to the background: cancel the fallback.
  useEffect(() => {
    const cancel = () => { if (timer.current && document.visibilityState === 'hidden') { clearTimeout(timer.current); timer.current = null } }
    document.addEventListener('visibilitychange', cancel)
    window.addEventListener('pagehide', cancel)
    return () => { document.removeEventListener('visibilitychange', cancel); window.removeEventListener('pagehide', cancel) }
  }, [])

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const ua = navigator.userAgent
    const android = /Android/i.test(ua)
    const ios = /iPhone|iPad|iPod/i.test(ua)

    if (!android && !ios) {
      // Desktop: nothing to open here. Tell them where the app lives.
      triggerDownloadApp('event')
      return
    }

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      if (document.visibilityState === 'hidden') return   // the app took over after all
      if (android) window.location.href = PLAY_STORE_URL
      else triggerDownloadApp('event')
    }, 1600)

    window.location.href = deepLink
  }

  return (
    <>
      <a href={deepLink} onClick={onClick} className={className}>
        Join in the app
      </a>
      {/* Listens for the "get the app" prompt; only this page needs it. */}
      <DownloadAppModal />
    </>
  )
}

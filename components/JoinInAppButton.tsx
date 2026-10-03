'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import DownloadAppModal, { triggerDownloadApp } from '@/components/DownloadAppModal'
import { userEventsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { PLAY_STORE_URL } from '@/lib/site'

/**
 * The join button on a public event page — which is what a shared link opens.
 *
 * Two quite different visitors land here, so the button is two buttons:
 *
 *   signed in on the web → joins straight away, no app needed. This page is
 *     the share target, and sending someone who already has an account off to
 *     an app store to do something the website can do is absurd.
 *
 *   everyone else → the app. A bare `zingdates://` link is a dead button
 *     wherever the app is not: a desktop browser ignores the scheme outright
 *     and a phone without the app does nothing visible. So the link is
 *     attempted, and if nothing takes the page away within a moment we assume
 *     the app is missing — Android to the Play Store, everyone else to a "get
 *     the app" prompt.
 */
export default function JoinInAppButton({ eventId, className }: { eventId: number | string; className?: string }) {
  const deepLink = `zingdates://events/${eventId}`
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const token = useAuthStore(s => s.token)
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  // If the app did open, this page goes to the background: cancel the fallback.
  useEffect(() => {
    const cancel = () => { if (timer.current && document.visibilityState === 'hidden') { clearTimeout(timer.current); timer.current = null } }
    document.addEventListener('visibilitychange', cancel)
    window.addEventListener('pagehide', cancel)
    return () => { document.removeEventListener('visibilitychange', cancel); window.removeEventListener('pagehide', cancel) }
  }, [])

  async function joinHere() {
    if (joining || !token) return
    setJoining(true)
    try {
      await userEventsApi.join(token, eventId)
      setJoined(true)
      toast.success("You're going!")
      router.refresh()
    } catch (err: any) {
      // A 402 carries the plan that would unlock it; its message already says
      // so, which is more use than anything this button could invent.
      toast.error(err?.message ?? 'Could not join this event')
    } finally {
      setJoining(false)
    }
  }

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()

    // Signed in here? Then there is nothing to open.
    if (token) { joinHere(); return }

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
      <a href={deepLink} onClick={onClick} className={className} aria-disabled={joining || joined}>
        {joined ? "You're going" : joining ? 'Joining…' : token ? 'Join this event' : 'Join in the app'}
      </a>
      {/* Listens for the "get the app" prompt; only this page needs it. */}
      <DownloadAppModal />
    </>
  )
}

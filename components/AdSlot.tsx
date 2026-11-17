'use client'

import { useEffect, useRef, useState } from 'react'
import { adsApi, type AdConfig } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/**
 * A Google AdSense slot that only exists when the admin says so.
 *
 * The decision is the server's — whether ads are on at all, whether the web
 * surface is on, whether a unit is configured, and whether this viewer is a
 * paying member. Nothing renders until that answer arrives, so turning ads off
 * in the admin panel takes effect on the next page load with no deploy.
 *
 * Renders nothing at all when ads are off: no heading, no reserved space, no
 * empty bordered box. A placeholder where an ad should be looks like something
 * broken.
 */
export default function AdSlot({
  className = '',
  format = 'auto',
  label = true,
}: {
  className?: string
  /** AdSense data-ad-format. 'auto' fills the width it is given. */
  format?: string
  /** The small "Advertisement" caption. Required by AdSense policy to be honest about what the block is. */
  label?: boolean
}) {
  const token = useAuthStore(s => s.token)
  const [cfg, setCfg] = useState<AdConfig | null>(null)
  const pushed = useRef(false)

  useEffect(() => {
    let alive = true
    adsApi.config(token).then(c => { if (alive) setCfg(c) })
    return () => { alive = false }
  }, [token])

  // Load the AdSense script on demand, with the publisher id the server gave
  // us. Putting it in the root layout would pull Google's script onto every
  // page for every visitor even with ads switched off.
  useEffect(() => {
    const client = cfg?.units.client
    if (!cfg?.show || !client) return
    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
    if (document.querySelector(`script[src="${src}"]`)) return
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.crossOrigin = 'anonymous'
    document.head.appendChild(el)
  }, [cfg?.show, cfg?.units.client])

  // AdSense is told to fill the slot once, after the <ins> is in the DOM.
  // Pushing twice throws "All ins elements already have ads in them".
  useEffect(() => {
    if (!cfg?.show || pushed.current) return
    pushed.current = true
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    } catch {
      // A blocked or not-yet-loaded script is not worth an error to the user.
    }
  }, [cfg?.show])

  if (!cfg?.show || !cfg.units.client || !cfg.units.slot) return null

  return (
    <div className={className}>
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 text-center mb-1.5">
          Advertisement
        </p>
      )}
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={cfg.units.client}
        data-ad-slot={cfg.units.slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { SCREENS, type Screen } from '@/lib/screens'

/**
 * One phone frame wrapping a real app screenshot.
 *
 * The screenshots live in /public/screens and may not be committed yet, so a
 * failed load falls back to a branded panel instead of a broken-image icon.
 */
export function PhoneFrame({
  screen,
  width = 260,
  className = '',
  style,
}: {
  screen: Screen
  width?: number
  className?: string
  style?: React.CSSProperties
}) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width, ...style }}>
      <div
        className="relative rounded-[38px] overflow-hidden border-[6px] border-white/15"
        style={{
          background: '#0f0828',
          aspectRatio: '9 / 19.5',
          boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* Notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-4 rounded-b-2xl bg-black z-10" />

        {failed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center"
               style={{ background: 'linear-gradient(160deg,#0c0720,#1d0940 55%,#280c3a)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="w-14 h-14 object-contain opacity-80" />
            <p className="text-white/80 text-sm font-bold">{screen.label}</p>
            <p className="text-white/40 text-[11px] leading-snug">{screen.caption}</p>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={screen.src}
            alt={`ZingDates app — ${screen.label} screen`}
            onError={() => setFailed(true)}
            loading="lazy"
            className="w-full h-full object-cover object-top"
          />
        )}
      </div>
    </div>
  )
}

/**
 * A staggered row of app screens. Middle phone sits forward so the row reads as
 * a single product shot rather than four separate images.
 */
export default function AppScreens({ screens = SCREENS }: { screens?: readonly Screen[] }) {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5 overflow-x-auto pb-4 px-2 -mx-2">
      {screens.map((s, i) => (
        <div key={s.src} className="flex flex-col items-center gap-3">
          <PhoneFrame
            screen={s}
            width={200}
            className={i % 2 === 1 ? 'sm:-translate-y-6' : ''}
          />
          <p className="text-white/45 text-[11px] font-medium text-center max-w-[180px] leading-snug">
            {s.caption}
          </p>
        </div>
      ))}
    </div>
  )
}

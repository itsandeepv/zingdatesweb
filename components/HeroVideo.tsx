'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Muted, looping background video for the landing hero. Fades in once it can
 * actually play, so the poster underneath never jumps to a black first frame.
 * Autoplay is attempted explicitly because some browsers ignore the attribute
 * until a play() call.
 */
export default function HeroVideo({ src, poster, className = '' }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const play = v.play()
    if (play && typeof play.catch === 'function') play.catch(() => { /* autoplay blocked: poster stays */ })
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      onCanPlay={() => setReady(true)}
      className={`hero-video absolute inset-0 w-full h-full object-cover ${ready ? 'is-ready' : ''} ${className}`}
    />
  )
}

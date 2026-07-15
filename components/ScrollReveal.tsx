'use client'

import { ReactNode, useEffect, useRef, type JSX } from 'react'

interface Props {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
  threshold?: number
  as?: keyof JSX.IntrinsicElements
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.12,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = delay ? `${delay}ms` : ''
          el.classList.add('visible')
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay, threshold])

  return (
    // @ts-ignore – dynamic tag
    <Tag ref={ref} className={`reveal reveal-${direction} ${className}`}>
      {children}
    </Tag>
  )
}

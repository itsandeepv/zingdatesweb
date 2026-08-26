import Image from 'next/image'
import Link from 'next/link'

/**
 * The brand lockup. Always renders the real logo mark from /public rather than
 * a hand-drawn "Z" tile, so every surface (site, app shell, admin, modals)
 * shows the same artwork.
 *
 * `tone` picks the wordmark colour for light vs dark backgrounds.
 * `wordmark={false}` renders the mark alone (tight spaces, avatars, favicons).
 */
export default function Logo({
  size = 36,
  wordmark = true,
  tagline = false,
  tone = 'dark',
  href = '/',
  className = '',
}: {
  size?: number
  wordmark?: boolean
  tagline?: boolean
  tone?: 'light' | 'dark'
  href?: string | null
  className?: string
}) {
  const wordCls = tone === 'light' ? 'text-white' : 'text-gray-900'
  const tagCls = tone === 'light' ? 'text-white/50' : 'text-gray-400'

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-mark.png"
        alt="ZingDates"
        width={size}
        height={size}
        priority={size >= 40}
        className="object-contain flex-shrink-0"
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <span className="flex flex-col leading-none">
          <span className={`font-black tracking-tight ${wordCls}`} style={{ fontSize: size * 0.62 }}>
            Zing<span className="gradient-brand-text">Dates</span>
          </span>
          {tagline && (
            <span className={`uppercase tracking-[0.18em] mt-1 ${tagCls}`} style={{ fontSize: Math.max(7, size * 0.2) }}>
              Real people, real connections
            </span>
          )}
        </span>
      )}
    </span>
  )

  if (!href) return inner
  return <Link href={href} className="inline-flex items-center group">{inner}</Link>
}

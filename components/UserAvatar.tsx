'use client'

interface Props {
  src?: string | null
  name?: string
  size?: number   // px — default 48
  className?: string
  online?: boolean
}

export default function UserAvatar({ src, name, size = 48, className = '', online }: Props) {
  const rounded = 'rounded-full'
  const style = { width: size, height: size, minWidth: size, minHeight: size }

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={style}>
      {src ? (
        <img
          src={src}
          alt={name ?? 'User'}
          className={`w-full h-full object-cover ${rounded}`}
        />
      ) : (
        <div
          className={`w-full h-full gradient-brand ${rounded} flex items-center justify-center`}>
          {/* Person silhouette icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: size * 0.52, height: size * 0.52 }}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
      )}

      {/* Online dot */}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-emerald-400 border-2 border-white"
          style={{ width: Math.max(10, size * 0.22), height: Math.max(10, size * 0.22) }}
        />
      )}
    </div>
  )
}

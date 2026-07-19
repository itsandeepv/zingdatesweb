'use client'

import { getAvatarUri } from '@/lib/avatars'

interface Props {
  src?: string | null
  name?: string
  gender?: string | null   // drives the default avatar when there's no photo
  size?: number   // px — default 48
  className?: string
  online?: boolean
}

export default function UserAvatar({ src, name, gender, size = 48, className = '', online }: Props) {
  const rounded = 'rounded-full'
  const style = { width: size, height: size, minWidth: size, minHeight: size }

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={style}>
      <img
        src={getAvatarUri({ photo: src, gender })}
        alt={name ?? 'User'}
        className={`w-full h-full object-cover ${rounded}`}
      />

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

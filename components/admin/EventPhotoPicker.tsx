'use client'

import { useEffect, useRef, useState } from 'react'
import { MAX_EVENT_PHOTOS } from '@/lib/api'

export type ExistingPhoto = { id: number; url: string }

/**
 * Pick up to MAX_EVENT_PHOTOS pictures, and actually see them.
 *
 * The field this replaced showed a filename and nothing else, so there was no
 * way to tell you had attached the wrong image until the event was live.
 *
 * Handles two cases with one component: an event that does not exist yet
 * (files held locally, uploaded after it is created) and one that does
 * (pictures already on the server, removed through `onRemove`).
 */
export default function EventPhotoPicker({
  files,
  onFilesChange,
  existing = [],
  onRemoveExisting,
  required = false,
}: {
  files: File[]
  onFilesChange: (files: File[]) => void
  existing?: ExistingPhoto[]
  onRemoveExisting?: (id: number) => void
  required?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  // Object URLs are revoked when the selection changes, or the tab leaks a
  // blob for every image the person ever previewed.
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [files])

  const total = existing.length + files.length
  const room = MAX_EVENT_PHOTOS - total

  function add(picked: FileList | null) {
    if (!picked) return
    // Silently taking the first N of a larger selection would look like the
    // rest failed, so the cap is stated rather than applied quietly.
    onFilesChange([...files, ...Array.from(picked).slice(0, Math.max(0, room))])
    if (input.current) input.current.value = ''
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Pictures{required && <span className="text-pink-600"> *</span>}
      </label>
      <p className="text-xs text-gray-400 mb-3">
        Up to {MAX_EVENT_PHOTOS}. The first one is the cover people see on the card.
      </p>

      <div className="flex flex-wrap gap-3">
        {existing.map((p, i) => (
          <div key={p.id} className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] text-center py-0.5">Cover</span>
            )}
            {onRemoveExisting && (
              <button type="button" onClick={() => onRemoveExisting(p.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove picture">×</button>
            )}
          </div>
        ))}

        {previews.map((src, i) => (
          <div key={src} className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
            {existing.length === 0 && i === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] text-center py-0.5">Cover</span>
            )}
            <button type="button" onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove picture">×</button>
          </div>
        ))}

        {room > 0 && (
          <button type="button" onClick={() => input.current?.click()}
            className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-pink-300 hover:text-pink-500 transition-colors flex flex-col items-center justify-center gap-1">
            <span className="text-2xl leading-none">+</span>
            <span className="text-[11px]">Add</span>
          </button>
        )}
      </div>

      <input ref={input} type="file" accept="image/*" multiple hidden
        onChange={e => add(e.target.files)} />

      <p className="text-xs text-gray-400 mt-2">
        {total === 0
          ? `No pictures yet${required ? ' — at least one is needed' : ''}.`
          : `${total} of ${MAX_EVENT_PHOTOS} added.`}
      </p>
    </div>
  )
}

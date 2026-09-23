'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { placesApi, type CitySuggestion } from '@/lib/api'

/**
 * A city field that suggests as you type, the way the app's does.
 *
 * Typing freely still works — someone whose town Google has never heard of
 * must not be stuck — the list is a convenience, not a gate. Google is
 * reached through our own server, so no key ships to the browser.
 */
export default function CityInput({
  value,
  onChange,
  placeholder = 'Start typing your city…',
  className = '',
  id,
  required = false,
}: {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  className?: string
  id?: string
  required?: boolean
}) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)

  // Bumped on every keystroke so a slow reply cannot overwrite a newer one.
  const seq = useRef(0)
  // Set when a suggestion is picked, so the value we just wrote does not
  // immediately trigger a search for itself.
  const skip = useRef(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (skip.current) { skip.current = false; return }

    const q = value.trim()
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }

    const mine = ++seq.current
    setLoading(true)

    const t = setTimeout(async () => {
      try {
        const res = await placesApi.cities(q)
        if (mine !== seq.current) return
        setSuggestions(res.places ?? [])
        setOpen((res.places ?? []).length > 0)
      } catch {
        if (mine === seq.current) { setSuggestions([]); setOpen(false) }
      } finally {
        if (mine === seq.current) setLoading(false)
      }
    }, 300)

    return () => clearTimeout(t)
  }, [value])

  // A click anywhere else closes the list.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const pick = useCallback((s: CitySuggestion) => {
    skip.current = true
    onChange(s.main)
    setSuggestions([])
    setOpen(false)
    setActive(-1)
  }, [onChange])

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i <= 0 ? suggestions.length : i) - 1)
    } else if (e.key === 'Enter' && active >= 0) {
      // Only swallow Enter when a suggestion is highlighted, so Enter still
      // submits the form when the person has simply typed a name.
      e.preventDefault()
      pick(suggestions[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={box} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        required={required}
        autoComplete="off"
        placeholder={placeholder}
        onChange={e => { setActive(-1); onChange(e.target.value) }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        className={className}
      />

      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={s.place_id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
                className={`w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 ${
                  i === active ? 'bg-pink-50' : 'hover:bg-pink-50'
                }`}
              >
                <span className="block text-sm font-medium text-gray-900">{s.main}</span>
                {s.secondary && <span className="block text-xs text-gray-500 mt-0.5">{s.secondary}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

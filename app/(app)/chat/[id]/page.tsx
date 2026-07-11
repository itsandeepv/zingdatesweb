'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { chatApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { triggerPlanModal } from '@/components/NoPlanModal'
import type { Chat, ChatMessage } from '@/lib/types'

/* ── Helpers ──────────────────────────────────────────────── */

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })
}

function isDifferentDay(a: string, b: string) {
  return new Date(a).toDateString() !== new Date(b).toDateString()
}

/* ── Typing indicator ─────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm w-16">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-300"
          style={{
            animation: 'typing-bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Message bubble ───────────────────────────────────────── */
function Bubble({ msg, isMine, showAvatar, otherPhoto, otherName }: {
  msg: ChatMessage
  isMine: boolean
  showAvatar: boolean
  otherPhoto?: string | null
  otherName?: string
}) {
  const [imgOpen, setImgOpen] = useState(false)

  if (msg.type === 'image' && msg.file_url) {
    return (
      <>
        <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
          {!isMine && (
            <div className="w-7 h-7 flex-shrink-0">
              {showAvatar && (
                otherPhoto
                  ? <img src={otherPhoto} alt={otherName} className="w-7 h-7 rounded-full object-cover" />
                  : <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] text-white font-bold">{otherName?.[0]}</div>
              )}
            </div>
          )}
          <button onClick={() => setImgOpen(true)} className="block rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform">
            <img src={msg.file_url} alt="image" className={`max-w-[220px] max-h-[280px] object-cover ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} />
          </button>
        </div>
        {/* Lightbox */}
        {imgOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setImgOpen(false)}>
            <img src={msg.file_url!} alt="full" className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
        )}
      </>
    )
  }

  if ((msg.type === 'voice_note' || msg.type === 'audio') && msg.file_url) {
    return (
      <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <div className="w-7 h-7 flex-shrink-0">
            {showAvatar && (
              otherPhoto
                ? <img src={otherPhoto} alt={otherName} className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] text-white font-bold">{otherName?.[0]}</div>
            )}
          </div>
        )}
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl shadow-sm ${isMine ? 'gradient-brand rounded-tr-sm' : 'bg-white rounded-tl-sm'}`}>
          <svg className={`w-4 h-4 flex-shrink-0 ${isMine ? 'text-white' : 'text-pink-500'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <audio controls src={msg.file_url} className="h-8 max-w-[180px]" style={{ filter: isMine ? 'invert(1)' : 'none' }} />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <div className="w-7 h-7 flex-shrink-0 mb-0.5">
          {showAvatar && (
            otherPhoto
              ? <img src={otherPhoto} alt={otherName} className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] text-white font-bold">{otherName?.[0]}</div>
          )}
        </div>
      )}

      <div className={`max-w-[72%] group relative`}>
        <div className={`px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm ${
          isMine
            ? 'gradient-brand text-white rounded-2xl rounded-tr-sm'
            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm'
        }`}>
          {msg.message}
        </div>
        {/* Time tooltip on hover */}
        <div className={`absolute -bottom-4 ${isMine ? 'right-0' : 'left-0'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(msg.created_at)}</span>
          {isMine && (
            <svg className={`w-3 h-3 ${msg.is_read ? 'text-pink-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 8l3.5 3.5 4-4M6 8l3.5 3.5 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */
export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = Number(params.id)
  const { token, user } = useAuthStore()

  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const lastMsgIdRef = useRef<number>(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  function onType(value: string) {
    setText(value)
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
    if (!isTypingRef.current) {
      isTypingRef.current = true
      chatApi.setTyping(token!, chatId, true).catch(() => {})
    }
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false
      chatApi.setTyping(token!, chatId, false).catch(() => {})
    }, 2000)
  }

  useEffect(() => {
    if (!token) return
    loadMessages(1, true)
    const iv = setInterval(pollNew, 3000)
    return () => clearInterval(iv)
  }, [chatId, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleScroll() {
    const el = messagesRef.current
    if (!el) return
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200)
  }

  async function loadMessages(p = 1, initial = false) {
    try {
      const res = await chatApi.messages(token!, chatId, p)
      const msgs: ChatMessage[] = res.messages ?? (Array.isArray(res) ? res : [])
      if (initial) {
        setMessages(msgs)
        if (res.other_user) setChat({ id: chatId, other_user: res.other_user } as any)
        if (msgs.length > 0) lastMsgIdRef.current = Math.max(...msgs.map(m => m.id))
      } else {
        setMessages(prev => [...msgs, ...prev])
      }
      setHasMore(Boolean(res.has_more))
    } catch {
      if (initial) toast.error('Failed to load messages')
    } finally {
      if (initial) setLoading(false)
    }
  }

  async function pollNew() {
    try {
      const res = await chatApi.messages(token!, chatId, 1)
      const msgs: ChatMessage[] = res.messages ?? (Array.isArray(res) ? res : [])
      const newMsgs = msgs.filter(m => m.id > lastMsgIdRef.current)
      if (newMsgs.length > 0) {
        lastMsgIdRef.current = Math.max(...newMsgs.map(m => m.id))
        setMessages(prev => [...prev, ...newMsgs])
      }
      try {
        const t = await chatApi.typingStatus(token!, chatId)
        setOtherTyping(Boolean(t?.is_typing))
      } catch {}
    } catch {}
  }

  async function sendMessage(e?: { preventDefault(): void }) {
    e?.preventDefault()
    if (!text.trim() || sending) return
    // Gate: free users see recharge popup before any network call
    if (!user?.is_premium) {
      triggerPlanModal('message')
      return
    }
    const msg = text.trim()
    setText('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setSending(true)
    try {
      const sent = await chatApi.send(token!, chatId, { message: msg, type: 'text' })
      setMessages(prev => [...prev, sent])
      lastMsgIdRef.current = sent.id
    } catch (err: any) {
      if (err?.status === 402) {
        triggerPlanModal('message')
      } else {
        toast.error('Failed to send')
        setText(msg)
      }
    } finally {
      setSending(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || sending) return
    if (!user?.is_premium) {
      triggerPlanModal('message')
      return
    }
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'image')
      const sent = await chatApi.sendFile(token!, chatId, fd)
      setMessages(prev => [...prev, sent])
      lastMsgIdRef.current = sent.id
    } catch (err: any) {
      if (err?.status === 402) triggerPlanModal('message')
      else toast.error('Failed to send image')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const other = chat?.other_user
  const myId = user?.id

  /* ── Loading skeleton ─────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header skeleton */}
        <div className="h-[68px] gradient-brand flex items-center px-4 gap-3">
          <div className="w-5 h-5 rounded bg-white/20" />
          <div className="w-10 h-10 rounded-full bg-white/20" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-white/20 rounded-full w-28" />
            <div className="h-2.5 bg-white/20 rounded-full w-16" />
          </div>
        </div>
        {/* Message skeletons */}
        <div className="flex-1 bg-[#f7f2f9] px-4 py-4 space-y-4">
          {[false, true, false, true, false].map((isMine, i) => (
            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-pulse`}>
              <div className={`h-9 rounded-2xl bg-gray-200 ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} style={{ width: `${[140, 200, 100, 180, 120][i]}px` }} />
            </div>
          ))}
        </div>
        {/* Input skeleton */}
        <div className="h-16 bg-white border-t border-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Top bar ──────────────────────────────── */}
      <header
        className="gradient-brand text-white px-3 py-2.5 flex items-center gap-3 sticky top-0 z-10"
        style={{ boxShadow: '0 2px 16px rgba(233,30,140,0.3)' }}
      >
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-white/15 transition-colors active:scale-90">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {other?.photo ? (
            <img src={other.photo} alt={other.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
          )}
          {other?.is_online && (
            <span className="absolute bottom-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-300 opacity-60" />
              <span className="relative w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
            </span>
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{other?.name ?? 'Chat'}</p>
          <p className="text-[11px] text-white/75 leading-tight mt-0.5">
            {otherTyping
              ? <span className="text-white animate-pulse">typing…</span>
              : other?.is_online ? '● Online now' : 'Offline'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Link
            href={`/call/new?to=${other?.id}&type=audio`}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all"
            title="Voice call"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 10.8 19.79 19.79 0 0 1 .22 2.18 2 2 0 0 1 2.18 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L6.91 7.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </Link>
          <Link
            href={`/call/new?to=${other?.id}&type=video`}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all"
            title="Video call"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </Link>
        </div>
      </header>

      {/* ── Messages ─────────────────────────────── */}
      <div
        ref={messagesRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-1"
        style={{
          background: 'linear-gradient(180deg, #fdf4ff 0%, #fff5f8 100%)',
        }}
      >
        {hasMore && (
          <button
            onClick={() => { const p = page + 1; setPage(p); loadMessages(p) }}
            className="block mx-auto text-xs text-pink-600 font-semibold py-1.5 px-4 rounded-full bg-white shadow-sm border border-pink-100 mb-2 hover:shadow-md transition-shadow"
          >
            Load older messages
          </button>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === myId
          const prevMsg = messages[i - 1]
          const nextMsg = messages[i + 1]
          const showDay = i === 0 || isDifferentDay(prevMsg.created_at, msg.created_at)
          const showAvatar = !isMine && (!nextMsg || nextMsg.sender_id !== msg.sender_id || isDifferentDay(msg.created_at, nextMsg.created_at))
          const isGrouped = !showDay && prevMsg && prevMsg.sender_id === msg.sender_id &&
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 60_000

          return (
            <div key={msg.id}>
              {/* Day separator */}
              {showDay && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200/60" />
                  <span className="text-[11px] font-semibold text-gray-400 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                    {dayLabel(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200/60" />
                </div>
              )}

              {/* Bubble with spacing */}
              <div className={`${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
                <Bubble
                  msg={msg}
                  isMine={isMine}
                  showAvatar={showAvatar}
                  otherPhoto={other?.photo}
                  otherName={other?.name}
                />
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex items-end gap-2 mt-3">
            <div className="w-7 h-7 flex-shrink-0">
              {other?.photo
                ? <img src={other.photo} alt={other.name} className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] text-white font-bold">{other?.name?.[0]}</div>
              }
            </div>
            <TypingDots />
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Scroll-to-bottom FAB ──────────────────── */}
      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-[76px] right-4 w-10 h-10 rounded-full gradient-brand shadow-brand flex items-center justify-center z-20 active:scale-90 transition-transform"
          style={{ boxShadow: '0 4px 20px rgba(233,30,140,0.4)' }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* ── Input bar ────────────────────────────── */}
      <div className="bg-white border-t border-gray-100 px-3 py-2.5" style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}>
        <div className="flex items-end gap-2">
          {/* Attach image */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-pink-50 text-gray-400 hover:text-pink-500 flex items-center justify-center transition-colors disabled:opacity-40 active:scale-90"
            title="Send image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Text input */}
          <div className="flex-1 relative bg-gray-100 rounded-3xl px-4 py-2.5 flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={e => onType(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed max-h-28 overflow-y-auto"
              style={{ minHeight: '22px' }}
            />
          </div>

          {/* Send / mic */}
          {text.trim() ? (
            <button
              onClick={() => sendMessage()}
              disabled={sending}
              className="flex-shrink-0 w-10 h-10 rounded-full gradient-brand flex items-center justify-center shadow-brand active:scale-90 transition-all disabled:opacity-50"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" />
                </svg>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={sending}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-50 flex items-center justify-center text-gray-400 hover:text-pink-500 transition-colors active:scale-90 disabled:opacity-40"
              title="Voice note (coming soon)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Typing dots keyframe */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

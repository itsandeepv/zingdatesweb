'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { chatApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import type { Chat, ChatMessage } from '@/lib/types'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })
}

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
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgIdRef = useRef<number>(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadMessages(1, true)
    const iv = setInterval(pollNew, 3000)
    return () => clearInterval(iv)
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages(p = 1, initial = false) {
    try {
      const res = await chatApi.messages(token!, chatId, p)
      const msgs: ChatMessage[] = Array.isArray(res) ? res : (res.data ?? [])
      if (initial) {
        setMessages(msgs)
        setChat(res.chat ?? null)
        if (msgs.length > 0) lastMsgIdRef.current = Math.max(...msgs.map(m => m.id))
      } else {
        setMessages(prev => [...msgs, ...prev])
      }
      setHasMore(res.current_page < Math.ceil(res.total / 20))
    } catch {
      if (initial) toast.error('Failed to load messages')
    } finally {
      if (initial) setLoading(false)
    }
  }

  async function pollNew() {
    try {
      const res = await chatApi.messages(token!, chatId, 1)
      const msgs: ChatMessage[] = Array.isArray(res) ? res : (res.data ?? [])
      const newMsgs = msgs.filter(m => m.id > lastMsgIdRef.current)
      if (newMsgs.length > 0) {
        lastMsgIdRef.current = Math.max(...newMsgs.map(m => m.id))
        setMessages(prev => [...prev, ...newMsgs])
      }
    } catch {}
  }

  async function sendMessage(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)
    try {
      const sent = await chatApi.send(token!, chatId, { message: msg, type: 'text' })
      setMessages(prev => [...prev, sent])
      lastMsgIdRef.current = sent.id
    } catch {
      toast.error('Failed to send')
      setText(msg)
    } finally {
      setSending(false)
    }
  }

  const other = chat?.other_user
  const myId = user?.id

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Top bar */}
      <header className="gradient-brand text-white px-3 py-3 flex items-center gap-3 sticky top-0 z-10" style={{ boxShadow: '0 2px 8px rgba(233,30,140,0.25)' }}>
        <button onClick={() => router.back()} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="relative flex-shrink-0">
          {other?.photo ? (
            <img src={other.photo} alt={other.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              {other?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          {other?.is_online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{other?.name ?? 'Chat'}</p>
          <p className="text-[11px] text-pink-100">{other?.is_online ? 'Online now' : 'Offline'}</p>
        </div>
        {/* Call buttons */}
        <div className="flex items-center gap-1">
          <Link href={`/call/new?to=${other?.id}&type=audio`} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 10.8 19.79 19.79 0 0 1 .22 2.18 2 2 0 0 1 2.18 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L6.91 7.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </Link>
          <Link href={`/call/new?to=${other?.id}&type=video`} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-gray-50">
        {hasMore && (
          <button onClick={() => { const p = page + 1; setPage(p); loadMessages(p) }}
            className="block mx-auto text-xs text-pink-600 font-semibold py-1 px-3 rounded-full bg-pink-50">
            Load older messages
          </button>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === myId
          const showTime = i === 0 || new Date(messages[i].created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000
          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[11px] text-gray-400 my-2">{formatTime(msg.created_at)}</p>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'image' && msg.file_url ? (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                    <img src={msg.file_url} alt="image" className={`rounded-2xl max-w-[240px] max-h-[320px] object-cover ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} />
                  </a>
                ) : (
                  <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine
                    ? 'gradient-brand text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.message}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="p-2 rounded-full text-gray-400 hover:text-pink-500 flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { chatApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import type { Chat } from '@/lib/types'

function timeAgo(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

function ChatItem({ chat }: { chat: Chat }) {
  const u = chat.other_user
  const initials = u?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const lastMsg = chat.last_message
  const preview = lastMsg
    ? (lastMsg.type !== 'text' ? `📎 ${lastMsg.type}` : (lastMsg.message ?? ''))
    : 'Start a conversation'

  return (
    <Link href={`/chat/${chat.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100">
      <div className="relative flex-shrink-0">
        {u?.photo ? (
          <img src={u.photo} alt={u.name} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-lg">
            {initials}
          </div>
        )}
        {u?.is_online && (
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-900 truncate">{u?.name ?? 'Unknown'}</p>
          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(chat.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-sm truncate ${chat.unread_count ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {preview}
          </p>
          {(chat.unread_count ?? 0) > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center">
              {chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function ChatListPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [])

  async function load() {
    try {
      const data = await chatApi.list(token)
      setChats(data)
    } catch {
      if (loading) toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-6">
          <div className="text-5xl">💬</div>
          <p className="font-bold text-gray-800 text-lg">No conversations yet</p>
          <p className="text-sm text-gray-500">Match with someone to start chatting</p>
          <Link href="/discover" className="gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl text-sm mt-1">
            Discover People
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {chats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
        </div>
      )}
    </div>
  )
}

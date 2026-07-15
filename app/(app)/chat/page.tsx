'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, CheckCheck, Globe, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { chatApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { triggerPlanModal } from '@/components/NoPlanModal'
import type { Chat } from '@/lib/types'
import UserAvatar from '@/components/UserAvatar'

function timeAgo(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  const days = Math.floor(diff / 86400)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="h-3.5 bg-gray-100 rounded-full w-28" />
          <div className="h-3 bg-gray-100 rounded-full w-8" />
        </div>
        <div className="h-3 bg-gray-100 rounded-full w-44" />
      </div>
    </div>
  )
}

function ChatItem({ chat, isPremium }: { chat: Chat; isPremium: boolean }) {
  const preview = chat.last_message?.trim().length ? chat.last_message : 'Start a conversation…'
  const hasUnread = (chat.unread ?? 0) > 0
  const t = timeAgo(chat.last_time ?? null)

  function handleClick(e: React.MouseEvent) {
    if (!isPremium) {
      e.preventDefault()
      triggerPlanModal('chat')
    }
  }

  return (
    <Link
      href={`/chat/${chat.id}`}
      onClick={handleClick}
      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-pink-50/70 active:bg-pink-100/60 transition-colors relative group"
    >
      {/* Unread left bar */}
      {hasUnread && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full gradient-brand" />
      )}

      {/* Avatar with online ring */}
      <div className="relative flex-shrink-0">
        <div className={`rounded-full p-0.5 ${hasUnread ? 'bg-gradient-to-br from-pink-400 to-purple-500' : 'bg-transparent'}`}>
          <div className="rounded-full bg-white p-0.5">
            <UserAvatar src={chat.photo} name={chat.name} size={50} />
          </div>
        </div>
        {chat.is_online && (
          <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
            {chat.name ?? 'Unknown'}
          </p>
          <span className={`text-[11px] flex-shrink-0 font-medium ${hasUnread ? 'text-pink-500' : 'text-gray-400'}`}>
            {t}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
            {preview}
          </p>
          {hasUnread ? (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full gradient-brand text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {(chat.unread ?? 0) > 99 ? '99+' : chat.unread}
            </span>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 16 16">
              <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Hover chevron */}
      <svg className="w-3.5 h-3.5 text-pink-300 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

export default function ChatListPage() {
  const { token, user } = useAuthStore()
  const safeToken = token ?? ''
  const isPremium = !!user?.is_premium
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'online'>('all')

  useEffect(() => {
    if (!safeToken) return
    load()
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [safeToken])

  async function load() {
    try {
      const data = await chatApi.list(safeToken)
      setChats(data)
    } catch {
      if (loading) toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = chats.filter(c => (c.unread ?? 0) > 0).length
  const onlineList = chats.filter(c => c.is_online)

  const filtered = useMemo(() => {
    let list = chats
    if (filter === 'unread') list = list.filter(c => (c.unread ?? 0) > 0)
    if (filter === 'online') list = list.filter(c => c.is_online)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.last_message?.toLowerCase().includes(q))
    }
    return list
  }, [chats, filter, search])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ─────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            {onlineList.length > 0 && (
              <p className="text-xs font-medium mt-0.5" style={{ color: '#10b981' }}>
                {onlineList.length} {onlineList.length === 1 ? 'person' : 'people'} online
              </p>
            )}
          </div>
          <Link
            href="/discover"
            className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center shadow-brand active:scale-95 transition-transform"
            title="Discover people"
          >
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full bg-gray-50 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {([
            { key: 'all',    label: 'All' },
            { key: 'unread', label: unreadCount > 0 ? `Unread · ${unreadCount}` : 'Unread' },
            { key: 'online', label: 'Online' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                filter === tab.key
                  ? 'gradient-brand text-white shadow-sm scale-105'
                  : 'bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active now strip ────────────────────────── */}
      {onlineList.length > 0 && !search && filter === 'all' && (
        <div className="px-4 py-3 bg-white border-b border-gray-50 overflow-x-auto scrollbar-none">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Active now</p>
          <div className="flex gap-4">
            {onlineList.map(c => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                onClick={e => { if (!isPremium) { e.preventDefault(); triggerPlanModal('chat') } }}
                className="flex flex-col items-center gap-1 flex-shrink-0 group"
              >
                <div className="relative">
                  <div className="rounded-full p-0.5 bg-gradient-to-br from-pink-400 to-purple-500">
                    <div className="rounded-full bg-white p-0.5">
                      <UserAvatar src={c.photo} name={c.name} size={42} />
                    </div>
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                </div>
                <span className="text-[10px] text-gray-400 truncate w-12 text-center group-hover:text-pink-500 transition-colors">
                  {c.name?.split(' ')[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── List ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white min-h-0 pb-20">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonItem key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-20 h-20 rounded-full gradient-brand-soft flex items-center justify-center mb-4 shadow-sm">
              {(() => {
                const EmptyIcon = search ? Search : filter === 'unread' ? CheckCheck : filter === 'online' ? Globe : MessageCircle
                return <EmptyIcon size={34} className="text-pink-500" />
              })()}
            </div>
            <p className="font-bold text-gray-800 text-lg mb-1.5">
              {search ? 'No results found' : filter === 'unread' ? 'All caught up!' : filter === 'online' ? 'Nobody online right now' : 'No conversations yet'}
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {search
                ? `Nothing matching "${search}"`
                : filter === 'unread'
                ? 'You have no unread messages.'
                : filter === 'online'
                ? 'Your matches will appear here when online.'
                : 'Like someone and wait for a match to start chatting.'}
            </p>
            {!search && filter === 'all' && (
              <Link href="/discover" className="gradient-brand text-white font-semibold px-7 py-3 rounded-2xl text-sm shadow-brand">
                Discover People
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50/80">
            {filtered.map(chat => <ChatItem key={chat.id} chat={chat} isPremium={isPremium} />)}
          </div>
        )}
      </div>
    </div>
  )
}

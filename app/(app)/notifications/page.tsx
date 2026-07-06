'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { notifApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import type { AppNotification } from '@/lib/types'
import UserAvatar from '@/components/UserAvatar'

function timeAgo(dateStr: string) {
  const d = new Date(dateStr)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

const TYPE_ICONS: Record<string, string> = {
  like: '❤️',
  match: '💞',
  message: '💬',
  call: '📞',
  system: '📢',
}

export default function NotificationsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => { if (token) load() }, [token])

  async function load() {
    setLoading(true)
    try {
      const data = await notifApi.list(token)
      setNotifs(Array.isArray(data) ? data : (data as any).notifications ?? [])
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    setMarking(true)
    try {
      await notifApi.markAllRead(token)
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      toast.error('Failed to mark all read')
    } finally {
      setMarking(false)
    }
  }

  async function markOne(id: number) {
    try {
      await notifApi.markRead(token, id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="gradient-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-xs font-semibold text-pink-600 hover:text-pink-800 disabled:opacity-50">
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-6">
          <div className="text-5xl">🔔</div>
          <p className="font-bold text-gray-800 text-lg">All caught up!</p>
          <p className="text-sm text-gray-500">We'll let you know when something happens</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifs.map(n => {
            const fromUser = n.from ?? n.from_user
            const initials = fromUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
            const icon = TYPE_ICONS[n.type] ?? '🔔'
            return (
              <button
                key={n.id}
                onClick={() => { if (!n.is_read) markOne(n.id) }}
                className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${!n.is_read ? 'bg-pink-50/50' : ''}`}>
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <UserAvatar src={fromUser?.photo} name={fromUser?.name} size={48} />
                  <div className="absolute -bottom-0.5 -right-0.5 text-base leading-none">{icon}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {n.message ?? `${fromUser?.name ?? 'Someone'} sent you a notification`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full gradient-brand flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

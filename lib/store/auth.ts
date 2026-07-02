'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: number
  name: string
  email: string | null
  phone: string | null
  photo: string | null
  role: string | null
  gender: string | null
  age: number | null
  dob: string | null
  is_premium: boolean
  plan_type: string | null
  plan_expires_at: string | null
  wallet_balance: number
  is_online: boolean
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  isLoggedIn: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        if (typeof document !== 'undefined') {
          document.cookie = `zd-token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`
        }
        set({ token, user })
      },
      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = `zd-token=; path=/; max-age=0`
        }
        set({ token: null, user: null })
      },
      isLoggedIn: () => !!get().token,
      isAdmin: () => {
        const role = get().user?.role
        return role != null && ['admin', 'super_admin', 'moderator', 'support', 'analyst', 'marketing', 'finance'].includes(role)
      },
    }),
    { name: 'zingdates-auth', skipHydration: false }
  )
)

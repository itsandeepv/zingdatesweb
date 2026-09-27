import type { Metadata } from 'next'

// Staff only. Never something a search engine should list.
export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

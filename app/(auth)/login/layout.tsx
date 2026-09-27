import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

// The login page is a client component, so its metadata lives here. It was
// inheriting the root canonical (the home page), which made Search Console
// treat /login as a duplicate of "/". A sign-in form has nothing to rank, so
// it is noindex with its own canonical.
export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your zingDates account.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/login` },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

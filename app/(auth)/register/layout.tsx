import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

// The register page itself is a client component, so its SEO metadata lives in
// this thin server layout (renders children unchanged).
export const metadata: Metadata = {
  title: 'Sign Up Free — Create Your zingDates Account',
  description:
    'Create your free zingDates account in seconds. Start meeting people near you, matching, chatting, and connecting over video calls — plus book verified companions.',
  alternates: { canonical: `${SITE_URL}/register` },
  openGraph: {
    title: 'Sign Up Free — Create Your zingDates Account',
    description: 'Join zingDates free and start meeting people near you today.',
    url: `${SITE_URL}/register`,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'zingDates' }],
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}

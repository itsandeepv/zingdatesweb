import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToasterProvider } from '@/components/ToasterProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const viewport: Viewport = { themeColor: '#E91E8C', width: 'device-width', initialScale: 1 }

export const metadata: Metadata = {
  title: { default: 'zingDates — Find Your Perfect Match', template: '%s | zingDates' },
  description: 'zingDates is the best social networking platform to meet your future partner. Join millions connecting through local events, real-time chat, and video calls.',
  keywords: ['dating app', 'social network', 'meetup', 'connections', 'relationships', 'events', 'online dating'],
  authors: [{ name: 'zingDates' }],
  openGraph: {
    title: 'zingDates — Find Your Perfect Match',
    description: 'The best place to meet your future partner. Create connections with people near you.',
    type: 'website',
    siteName: 'zingDates',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'zingDates — Find Your Perfect Match',
    description: 'The best place to meet your future partner.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <ToasterProvider />
      </body>
    </html>
  )
}

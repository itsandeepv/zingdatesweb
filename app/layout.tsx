import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToasterProvider } from '@/components/ToasterProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const viewport: Viewport = { themeColor: '#E91E8C', width: 'device-width', initialScale: 1 }

export const metadata: Metadata = {
  metadataBase: new URL('https://zingdates.com'),
  title: { default: 'zingDates — Find Your Perfect Match', template: '%s | zingDates' },
  description: 'zingDates is the best social networking platform to meet your future partner. Join millions connecting through local events, real-time chat, and video calls.',
  keywords: ['dating app', 'social network', 'meetup', 'connections', 'relationships', 'events', 'online dating'],
  authors: [{ name: 'zingDates' }],
  verification: { google: 'dSkaNmGcIXd-oiNA-fWvryjH5A94P4c1Fwn4bByBBz0' },
  openGraph: {
    title: 'zingDates — Find Your Perfect Match',
    description: 'The best place to meet your future partner. Create connections with people near you.',
    type: 'website',
    siteName: 'zingDates',
    url: 'https://zingdates.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'zingDates' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'zingDates — Find Your Perfect Match',
    description: 'The best place to meet your future partner.',
    images: ['/og-image.jpg'],
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

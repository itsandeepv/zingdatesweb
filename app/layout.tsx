import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToasterProvider } from '@/components/ToasterProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const viewport: Viewport = { themeColor: '#E91E8C', width: 'device-width', initialScale: 1 }

export const metadata: Metadata = {
  metadataBase: new URL('https://zingdates.com'),
  title: { default: 'zingDates — Find Your Perfect Match', template: '%s | zingDates' },
  description: 'zingDates is the free dating & social app to meet people near you, match, chat, and connect over HD voice & video calls — or book a verified companion. Find your perfect match today.',
  applicationName: 'zingDates',
  keywords: [
    'dating app', 'online dating', 'free dating app', 'dating app India',
    'video call dating app', 'live video chat app', 'chat with singles',
    'meet new people online', 'make new friends online', 'meet people nearby',
    'find your perfect match', 'social networking app', 'social discovery app',
    'virtual companion app', 'book a companion online', 'friendship app', 'zingDates',
  ],
  category: 'Dating & Social Networking',
  authors: [{ name: 'zingDates', url: 'https://zingdates.com' }],
  creator: 'zingDates',
  publisher: 'zingDates',
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: '/' },
  verification: { google: 'dSkaNmGcIXd-oiNA-fWvryjH5A94P4c1Fwn4bByBBz0' },
  openGraph: {
    title: 'zingDates — Find Your Perfect Match',
    description: 'Meet people near you, match, chat, and connect over HD voice & video calls — or book a verified companion. Download zingDates free.',
    type: 'website',
    siteName: 'zingDates',
    locale: 'en_US',
    url: 'https://zingdates.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'zingDates — Find Your Perfect Match' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'zingDates — Find Your Perfect Match',
    description: 'Meet, match, chat & video call nearby — or book a verified companion. Download zingDates free.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
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

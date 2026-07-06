import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { podcastApi } from '@/lib/api'
import { SITE_URL, SITE_NAME, fmtDate, fmtDuration } from '@/lib/site'

export const dynamic = 'force-dynamic'

async function getEpisode(slug: string) {
  try {
    const res = await podcastApi.get(slug)
    const ep = res?.data ?? res
    if (!ep || !ep.title) return null
    return ep
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const ep = await getEpisode(slug)
  if (!ep) return { title: 'Episode not found' }

  const title = ep.meta_title || ep.title
  const description = ep.meta_description || ep.excerpt || `Listen to "${ep.title}" on the ${SITE_NAME} podcast.`
  const url = `${SITE_URL}/podcasts/${ep.slug ?? slug}`
  const image = ep.cover_image

  return {
    title,
    description,
    keywords: Array.isArray(ep.tags) ? ep.tags : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: SITE_NAME,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function PodcastEpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ep = await getEpisode(slug)
  if (!ep) notFound()

  const notes: string = ep.show_notes ?? ep.description ?? ep.body ?? ''
  const date = fmtDate(ep.published_at ?? ep.created_at)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: ep.title,
    description: ep.meta_description || ep.excerpt || '',
    datePublished: ep.published_at ?? ep.created_at,
    associatedMedia: ep.audio_url ? { '@type': 'MediaObject', contentUrl: ep.audio_url } : undefined,
    partOfSeries: { '@type': 'PodcastSeries', name: `${SITE_NAME} Podcast` },
    url: `${SITE_URL}/podcasts/${ep.slug ?? slug}`,
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="pt-24 pb-16">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm mb-6">
            <Link href="/podcasts" className="text-purple-600 font-medium hover:underline">Podcasts</Link>
            {ep.category && (
              <>
                <span className="text-gray-300">/</span>
                <Link href={`/podcasts?category=${encodeURIComponent(ep.category)}`} className="text-gray-500 hover:text-purple-600">{ep.category}</Link>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 mx-auto sm:mx-0">
              {ep.cover_image
                ? <img src={ep.cover_image} alt={ep.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full gradient-brand flex items-center justify-center text-5xl">🎙️</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                {ep.episode_number != null && <span className="font-semibold text-purple-600">Episode {ep.episode_number}</span>}
                {date && <span>· {date}</span>}
                {fmtDuration(ep.duration) && <span>· {fmtDuration(ep.duration)}</span>}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{ep.title}</h1>
              {ep.excerpt && <p className="mt-3 text-gray-500 leading-relaxed">{ep.excerpt}</p>}
            </div>
          </div>

          {/* Audio player */}
          {ep.audio_url && (
            <div className="mt-8 rounded-2xl border border-gray-100 shadow-sm p-4 bg-white">
              <audio controls preload="none" className="w-full" src={ep.audio_url}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        {/* Show notes */}
        {notes && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Show notes</h2>
            <div
              className="text-gray-700 leading-relaxed text-[17px]
                [&_p]:mb-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_li]:mb-2
                [&_a]:text-purple-600 [&_a]:underline [&_a]:underline-offset-2
                whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: notes }}
            />
          </div>
        )}

        {ep.tags && Array.isArray(ep.tags) && ep.tags.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 flex flex-wrap gap-1.5">
            {ep.tags.map((t: string) => (
              <span key={t} className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">#{t}</span>
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 text-center">
          <Link href="/podcasts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-purple-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5 5-5M18 12H6" /></svg>
            Back to all episodes
          </Link>
        </div>
      </article>

      <SiteFooter />
    </div>
  )
}

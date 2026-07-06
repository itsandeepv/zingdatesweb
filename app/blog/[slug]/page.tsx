import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { blogApi } from '@/lib/api'
import { SITE_URL, SITE_NAME, fmtDate, readingTime } from '@/lib/site'

export const dynamic = 'force-dynamic'

async function getPost(slug: string) {
  try {
    const res = await blogApi.get(slug)
    const post = res?.data ?? res
    if (!post || (!post.title && !post.body && !post.content)) return null
    return post
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
  const post = await getPost(slug)
  if (!post) return { title: 'Post not found' }

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || `Read "${post.title}" on the ${SITE_NAME} blog.`
  const url = `${SITE_URL}/blog/${post.slug ?? slug}`
  const image = post.cover_image

  return {
    title,
    description,
    keywords: Array.isArray(post.tags) ? post.tags : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: SITE_NAME,
      publishedTime: post.published_at ?? post.created_at,
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const body: string = post.body ?? post.content ?? ''
  const date = fmtDate(post.published_at ?? post.created_at)

  // JSON-LD structured data helps Google render a rich result for the article.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt || '',
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug ?? slug}`,
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="pt-24 pb-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm mb-6">
            <Link href="/blog" className="text-pink-600 font-medium hover:underline">Blog</Link>
            {post.category && (
              <>
                <span className="text-gray-300">/</span>
                <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="text-gray-500 hover:text-pink-600">{post.category}</Link>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            {date && <span>{date}</span>}
            <span>·</span>
            <span>{readingTime(body)} min read</span>
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cover */}
        {post.cover_image && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
            <img src={post.cover_image} alt={post.title} className="w-full rounded-3xl object-cover max-h-[460px]" />
          </div>
        )}

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-10">
          {post.excerpt && (
            <p className="text-lg text-gray-500 leading-relaxed border-l-4 border-pink-200 pl-4 mb-8">{post.excerpt}</p>
          )}
          <div
            className="text-gray-700 leading-relaxed text-[17px]
              [&_p]:mb-5 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_li]:mb-2
              [&_a]:text-pink-600 [&_a]:underline [&_a]:underline-offset-2
              [&_img]:rounded-2xl [&_img]:my-6
              [&_blockquote]:border-l-4 [&_blockquote]:border-pink-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-6
              whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-14">
          <div className="rounded-3xl gradient-brand p-8 text-center">
            <h3 className="text-2xl font-bold text-white">Ready to find your match?</h3>
            <p className="text-pink-100 mt-2">Join millions already connecting on zingDates.</p>
            <Link href="/register" className="inline-block mt-5 bg-white text-pink-600 font-semibold px-7 py-3 rounded-2xl hover:opacity-90 transition-opacity">
              Get Started Free
            </Link>
          </div>
          <div className="mt-8 text-center">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-pink-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5 5-5M18 12H6" /></svg>
              Back to all posts
            </Link>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  )
}

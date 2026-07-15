/* Renders a Schema.org JSON-LD block. Server component — the markup is in the
 * initial HTML, so crawlers see it without executing JavaScript. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; there is no user HTML here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

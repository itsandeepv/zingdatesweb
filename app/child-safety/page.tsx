import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pagesApi } from '@/lib/api'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

async function getCmsContent(key: string): Promise<string | null> {
  try {
    const res = await pagesApi.get(key)
    const page = res?.data ?? res
    return page?.content || null
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: 'Child Safety Standards',
  description:
    'zingDates is strictly an 18+ dating app with a zero-tolerance policy toward child sexual abuse and exploitation (CSAE). Read our child safety standards and how to report a concern.',
  alternates: { canonical: `${SITE_URL}/child-safety` },
  robots: { index: true, follow: true },
}

export default async function ChildSafetyPage() {
  const cmsContent = await getCmsContent('child-safety')
  return (
    <LegalPage
      title="Child Safety Standards"
      subtitle="Our zero-tolerance policy on child sexual abuse and exploitation."
      updated="August 1, 2026"
      htmlContent={cmsContent ?? undefined}
    >
      <p>
        zingDates is an adult dating application intended exclusively for users aged 18 and above.
        We have a zero-tolerance policy toward child sexual abuse and exploitation (CSAE) and any
        form of child endangerment. This page sets out our standards and the measures we take to
        keep our platform safe and to comply with Google Play&rsquo;s Child Safety Standards policy.
      </p>

      <h2>1. Strictly for adults (18+)</h2>
      <ul>
        <li>zingDates is available only to users who are 18 years of age or older.</li>
        <li>Users must confirm they are 18+ during registration. Accounts found to belong to minors are removed immediately.</li>
        <li>We do not knowingly allow anyone under 18 to create an account, and we take action on any account suspected of belonging to a minor.</li>
      </ul>

      <h2>2. Zero tolerance for child sexual abuse material (CSAM) and CSAE</h2>
      <ul>
        <li>We strictly prohibit any content, conduct, or communication that sexualizes, exploits, endangers, or abuses children.</li>
        <li>The creation, upload, sharing, solicitation, or promotion of child sexual abuse material (CSAM) is absolutely forbidden and results in immediate account termination.</li>
        <li>Any attempt to use zingDates to groom, contact, or harm a minor is prohibited and will be reported to the appropriate authorities.</li>
      </ul>

      <h2>3. Reporting and moderation</h2>
      <ul>
        <li>Every user profile and conversation can be reported through the in-app <strong>Report</strong> feature.</li>
        <li>Users can <strong>block</strong> any other user at any time.</li>
        <li>Our moderation team reviews reports of suspected CSAE and takes prompt action, including account removal.</li>
        <li>We remove violating content and accounts and preserve relevant information for law enforcement where required.</li>
      </ul>

      <h2>4. Reporting to authorities</h2>
      <p>
        We report apparent instances of child sexual abuse material to the relevant authorities,
        including the National Center for Missing &amp; Exploited Children (NCMEC) and/or local law
        enforcement, as required by applicable law.
      </p>

      <h2>5. Compliance with laws</h2>
      <p>
        zingDates complies with all applicable child safety laws, including laws prohibiting child
        sexual abuse material and child exploitation. We align our standards with the requirements
        of Google Play&rsquo;s Child Safety Standards policy.
      </p>

      <h2>6. In-app safety features</h2>
      <ul>
        <li><strong>Report user / report content</strong> — available on profiles and in chats.</li>
        <li><strong>Block user</strong> — instantly stops all contact from another user.</li>
        <li><strong>Content moderation</strong> — profiles and reported content are reviewed and violating material is removed.</li>
      </ul>

      <h2>7. Contact us</h2>
      <p>
        To report a child safety concern or CSAE-related issue, or for any questions about these
        standards, please contact our dedicated child safety point of contact:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:safety@zingdates.com">safety@zingdates.com</a></li>
        <li><strong>Support:</strong> <a href="mailto:support@zingdates.com">support@zingdates.com</a></li>
      </ul>
      <p>We review and respond to all child safety reports as a priority.</p>
    </LegalPage>
  )
}

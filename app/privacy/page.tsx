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
  title: 'Privacy Policy',
  description: 'How zingDates collects, uses, shares, and protects your personal information — profile data, location, device info, and payments.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
}

export default async function PrivacyPage() {
  const cmsContent = await getCmsContent('privacy')
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
      updated="July 5, 2026"
      htmlContent={cmsContent ?? undefined}
    >
      <p>
        This Privacy Policy explains how zingDates (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, shares,
        and safeguards your information when you use our website, mobile applications, and related services
        (the &ldquo;Service&rdquo;). By using zingDates, you consent to the practices described here.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li><strong>Account &amp; profile:</strong> name, phone number, email address, date of birth, gender, profile photos, bio, profession, interests, and social links.</li>
        <li><strong>Verification:</strong> documents or details you submit for identity or profile verification (KYC).</li>
        <li><strong>Content:</strong> chat messages, media you upload, gifts, ratings, and reviews.</li>
        <li><strong>Payments:</strong> when you buy Coins or subscribe, our payment partners (such as Razorpay) process your payment. We receive transaction details but do not store full card numbers.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li><strong>Location:</strong> approximate or precise location (with your permission) to show nearby people and events.</li>
        <li><strong>Device &amp; usage:</strong> device model, operating system, browser, IP address, login history, and how you interact with the app.</li>
        <li><strong>Cookies &amp; similar technologies</strong> used to keep you signed in and improve the Service.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account and profile;</li>
        <li>To match you with other members and show relevant people, events, and companions near you;</li>
        <li>To enable chat, audio and video calls, gifts, and companion bookings;</li>
        <li>To process Coin purchases, subscriptions, and payouts;</li>
        <li>To keep the community safe — detecting fraud, abuse, and policy violations;</li>
        <li>To send you notifications, updates, and (where permitted) marketing you can opt out of;</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>3. How We Share Information</h2>
      <ul>
        <li><strong>With other members:</strong> your profile, photos, and shared content are visible to other users as part of the Service.</li>
        <li><strong>With service providers:</strong> payment processors, cloud hosting, analytics, and communication vendors who act on our behalf under confidentiality obligations.</li>
        <li><strong>For legal reasons:</strong> to comply with law, enforce our Terms, or protect the rights and safety of users and the public.</li>
        <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets.</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal information.</p>

      <h2>4. Location Data</h2>
      <p>
        Location powers core features like discovering people and events near you. You can control location
        access through your device settings, though some features may not work without it.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We keep your information for as long as your account is active and as needed to provide the Service,
        comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your
        account, we remove or anonymise your personal data, except where retention is required by law.
      </p>

      <h2>6. Your Rights &amp; Choices</h2>
      <ul>
        <li>Access, update, or correct your profile information at any time in the app;</li>
        <li>Request a copy or deletion of your personal data;</li>
        <li>Withdraw permissions (such as location or notifications) via device settings;</li>
        <li>Opt out of marketing communications.</li>
      </ul>
      <p>To exercise these rights, contact <a href="mailto:support@zingdates.com">support@zingdates.com</a>.</p>

      <h2>7. Security</h2>
      <p>
        We use administrative, technical, and physical safeguards to protect your information, including
        encrypted connections and access controls. No method of transmission or storage is completely secure,
        so we cannot guarantee absolute security.
      </p>

      <h2>8. Children&rsquo;s Privacy</h2>
      <p>
        zingDates is intended only for users aged <strong>18 and over</strong>. We do not knowingly collect data
        from anyone under 18. If we learn that a minor has created an account, we will delete it.
      </p>

      <h2>9. Third-Party Services</h2>
      <p>
        The Service may link to or rely on third-party services (such as payment gateways and social logins).
        Their handling of your data is governed by their own privacy policies, which we encourage you to review.
      </p>

      <h2>10. International Data Transfers</h2>
      <p>
        Your information may be processed and stored in countries other than your own. Where required, we take
        steps to ensure appropriate safeguards are in place.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes through
        the app or other reasonable means. Your continued use of the Service after changes take effect means
        you accept the updated policy.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        For any privacy questions or requests, email{' '}
        <a href="mailto:support@zingdates.com">support@zingdates.com</a>.
      </p>
    </LegalPage>
  )
}

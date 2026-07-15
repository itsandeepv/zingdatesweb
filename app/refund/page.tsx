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
  title: 'Refund & Cancellation Policy',
  description: 'zingDates refund and cancellation terms for Coin recharges, premium subscriptions, companion bookings, and event tickets.',
  alternates: { canonical: `${SITE_URL}/refund` },
  robots: { index: true, follow: true },
}

export default async function RefundPage() {
  const cmsContent = await getCmsContent('refund')
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      subtitle="Our terms for Coins, subscriptions, bookings, and event tickets."
      updated="July 5, 2026"
      htmlContent={cmsContent ?? undefined}
    >
      <p>
        This Refund &amp; Cancellation Policy explains when payments made on zingDates may be refunded. By
        purchasing Coins, subscribing to a plan, or making a booking, you agree to this policy. All amounts
        are processed through our payment partner <strong>Razorpay Software Pvt. Ltd.</strong> in Indian
        Rupees (₹) unless stated otherwise. This service is operated by{' '}
        <strong>S&amp;S Tech</strong>, Unit No. 7, 3rd Floor, JMD Regent Arcade Mall, A Block, DLF Phase 1,
        Gurugram, Haryana – 122 002, India.
      </p>

      <h2>1. Coins &amp; Wallet Recharges</h2>
      <ul>
        <li>Coins are a virtual currency used to unlock calls, gifts, and other features.</li>
        <li>Once Coins are successfully credited to your wallet, the purchase is <strong>final and non-refundable</strong>, as the digital goods are made available immediately.</li>
        <li>Coins already spent (for example, on calls or gifts) cannot be refunded.</li>
        <li>If a payment is deducted but Coins are <strong>not credited</strong>, or you are charged more than once for the same order, we will investigate and refund or credit the correct amount.</li>
      </ul>

      <h2>2. Premium Subscriptions</h2>
      <ul>
        <li>Subscription fees are charged at the start of each billing cycle.</li>
        <li>You may cancel auto-renewal at any time; cancellation stops future charges but does <strong>not</strong> refund the current period, which remains active until it ends.</li>
        <li>We do not provide partial or pro-rated refunds for unused days of a subscription, except where required by law.</li>
        <li>If you were charged after cancelling, or charged in error, contact us for a review.</li>
      </ul>

      <h2>3. Companion Bookings</h2>
      <ul>
        <li>When you book a companion session, the amount may be reserved or debited at the time of booking.</li>
        <li><strong>Cancellations before a session starts</strong> may be eligible for a full or partial refund depending on how close to the start time you cancel and the companion&rsquo;s cancellation terms.</li>
        <li>Once a session has started or been completed, it is generally non-refundable.</li>
        <li>If a companion fails to attend or the session cannot be delivered, you may request a full refund of that booking.</li>
      </ul>

      <h2>4. Event Tickets</h2>
      <p>
        Refunds for paid events depend on the organiser&rsquo;s terms shown at the time of registration. Where an
        event is cancelled by the organiser or zingDates, eligible ticket amounts will be refunded.
      </p>

      <h2>5. Failed or Duplicate Payments</h2>
      <p>
        If money is debited from your account but the transaction fails, is duplicated, or the item is not
        delivered, the amount is typically auto-reversed by the payment gateway within{' '}
        <strong>5–7 business days</strong>. If it does not, contact us with your transaction reference and we
        will assist.
      </p>

      <h2>6. How to Request a Refund</h2>
      <p>To request a refund or report a payment issue, email{' '}
        <a href="mailto:support@zingdates.com">support@zingdates.com</a> with:
      </p>
      <ul>
        <li>Your registered phone number or email;</li>
        <li>The order or transaction ID (from your wallet history or payment receipt);</li>
        <li>The date, amount, and a short description of the issue.</li>
      </ul>
      <p>
        We aim to respond within <strong>3 business days</strong>. Approved refunds are returned to the original
        payment method within <strong>5–7 business days</strong>, subject to your bank or provider.
      </p>

      <h2>7. Non-Refundable Items</h2>
      <ul>
        <li>Coins that have been used or gifted;</li>
        <li>Completed calls, chats, gifts, or companion sessions;</li>
        <li>Elapsed portions of an active subscription;</li>
        <li>Purchases where fraud, abuse, or a policy violation is involved.</li>
      </ul>

      <h2>8. Chargebacks</h2>
      <p>
        If you believe a charge is incorrect, please contact us first — most issues are resolved quickly.
        Initiating a chargeback without contacting us may result in temporary suspension of your account
        while the dispute is reviewed.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. Changes take effect when posted, and continued use of the
        Service means you accept the updated policy.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        For refund or billing questions, email{' '}
        <a href="mailto:support@zingdates.com">support@zingdates.com</a> or call us at{' '}
        <a href="tel:+919466440136">+91 94664 40136</a> (Monday – Saturday, 10 AM – 7 PM IST).
        You can also visit our <a href="/contact">Contact page</a>.
      </p>
      <p>
        <strong>Registered Address:</strong> S&amp;S Tech, Unit No. 7, 3rd Floor, JMD Regent Arcade Mall,
        A Block, DLF Phase 1, Gurugram, Haryana – 122 002, India
      </p>
    </LegalPage>
  )
}

import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy | Pleiad',
  description:
    'Refund Policy for Pleiad. Plans are purchased as in-app purchases; the Apple App Store and Google Play are the merchant of record and handle refunds.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Refund Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <p className="text-muted-foreground">Last updated: July 13, 2026</p>

            <h2 className="text-lg font-semibold mt-6 mb-3">1. Merchant of Record</h2>
            <p>
              Paid plans for Pleiad (&ldquo;the Service&rdquo;) are sold as in-app purchases
              through the <strong>Apple App Store</strong> and <strong>Google Play</strong>.
              Those stores are the merchant of record: they take the payment, issue the
              receipt, handle applicable tax, and decide refunds. Pleiad does not process
              your card and does not hold your payment details.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. Refunds Are Handled by the Store</h2>
            <p>
              Because the store is the merchant of record, refund requests are made to, and
              decided by, Apple or Google under their own policies — we cannot issue a refund
              to your payment method ourselves.
            </p>
            <ul>
              <li>
                <strong>Apple:</strong> request a refund at{' '}
                <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">
                  reportaproblem.apple.com
                </a>{' '}
                or through your purchase receipt.
              </li>
              <li>
                <strong>Google Play:</strong> request a refund through your{' '}
                <a href="https://play.google.com/store/account/orderhistory" target="_blank" rel="noopener noreferrer">
                  Google Play order history
                </a>
                .
              </li>
            </ul>
            <p>
              If a store declines a request you believe is fair, email us — we will support
              your case with the store where we can, though the final decision is theirs.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">3. Subscriptions</h2>
            <p>
              You may cancel a subscription at any time from your device&rsquo;s subscription
              settings (App Store or Google Play account). Cancellation stops future renewals;
              you keep access until the end of the period you have already paid for. Renewal
              charges are generally non-refundable once a new period has begun, except where
              required by law or where the store grants a refund.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">4. Founding Lifetime</h2>
            <p>
              The Founding Lifetime plan is a one-time purchase granting permanent access. It
              is refundable only under the store&rsquo;s refund policy (see section 2).
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">5. Your Data After a Refund</h2>
            <p>
              A refund removes your paid entitlement and returns your account to the Free
              plan. Your people, notes and maps are not deleted — they stay saved, subject to
              the Free plan&rsquo;s limits.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">6. Contact</h2>
            <p>
              Questions about this policy? Reach us at{' '}
              <a href="mailto:support@pleiad.io">support@pleiad.io</a>. See also our{' '}
              <Link href="/terms">Terms of Service</Link> and{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

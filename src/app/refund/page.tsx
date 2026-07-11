import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy | Pleiad',
  description:
    'Refund Policy for Pleiad. Payments are processed by Paddle, our merchant of record. 14-day money-back guarantee on new purchases.',
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
            <p className="text-muted-foreground">Last updated: July 11, 2026</p>

            <h2 className="text-lg font-semibold mt-6 mb-3">1. Merchant of Record</h2>
            <p>
              Payments for Pleiad (&ldquo;the Service&rdquo;) are processed by our merchant of
              record, <strong>Paddle.com</strong>. Paddle handles billing, invoicing, tax, and
              refunds on our behalf. Your purchase is also subject to{' '}
              <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">
                Paddle&rsquo;s Buyer Terms
              </a>
              .
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. 14-Day Money-Back Guarantee</h2>
            <p>
              We offer a <strong>14-day money-back guarantee</strong> on new purchases, including
              the Founding Lifetime plan. If you are not satisfied, request a full refund within
              14 days of your purchase and we will process it, no questions asked.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">3. Subscriptions</h2>
            <p>
              You may cancel a subscription at any time from your account&rsquo;s billing settings.
              Cancellation stops future renewals; you retain access until the end of the paid
              period. Renewal charges are generally non-refundable once a new period has begun,
              except where required by law or at our discretion.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">4. Founding Lifetime</h2>
            <p>
              The Founding Lifetime plan is a one-time purchase covered by the 14-day money-back
              guarantee above. After 14 days it is non-refundable, as it grants permanent access.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">5. How to Request a Refund</h2>
            <p>
              Email{' '}
              <a href="mailto:support@pleiad.io">support@pleiad.io</a> with the email address used
              at purchase and your order/receipt reference. You can also request a refund directly
              through the Paddle receipt email you received after purchase. Refunds are returned to
              the original payment method and typically appear within 5&ndash;10 business days.
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

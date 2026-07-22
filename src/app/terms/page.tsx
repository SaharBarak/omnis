import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Terms of Service | Pleiad',
  description: 'Terms of Service for Pleiad - the personal symbolic mapping platform for Dreamspell, Human Design, Astrology, and Gematria.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <p className="text-muted-foreground">
              Last updated: January 25, 2026
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Pleiad (&ldquo;the Service&rdquo;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. Description of Service</h2>
            <p>
              Pleiad is a personal symbolic mapping platform that provides calculations and
              visualizations based on various symbolic systems including Dreamspell, Tzolkin,
              Astrology, Human Design, and Gematria. The Service is for informational and
              entertainment purposes only.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">3. User Accounts</h2>
            <p>
              To access certain features, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and current information</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">4. User Content</h2>
            <p>
              You retain ownership of any content you submit to the Service. By submitting
              content, you grant us a license to use, store, and process that content to
              provide the Service.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">5. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Scrape or harvest data from the Service</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">6. Disclaimer &amp; Warranty Disclaimer</h2>
            <p>
              The symbolic calculations and interpretations provided by Pleiad are for
              entertainment and personal exploration purposes only. They should not be
              used as a substitute for professional advice including medical, legal,
              financial, or psychological guidance.
            </p>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
              WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT
              LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, TITLE, AND NON-INFRINGEMENT. We do not warrant that the Service will
              be uninterrupted, timely, secure, or error-free, or that results obtained
              from it will be accurate or reliable.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Pleiad shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages resulting
              from your use of the Service. Our total liability for any claim arising out of
              or relating to the Service shall not exceed the amount you paid us in the
              twelve (12) months preceding the event giving rise to the claim.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">8. Payments, Billing &amp; Fulfillment</h2>
            <p>
              Paid plans are sold as in-app purchases through the{' '}
              <strong>Apple App Store</strong> and <strong>Google Play</strong>, which act as
              the merchant of record and handle payment processing, receipts, and applicable
              sales tax/VAT. Pleiad is a digital service: access to purchased features is
              provisioned to your account immediately upon successful payment, with no
              physical goods shipped. Your paid plan unlocks Pleiad on the web as well, on the
              same account you signed in with. Subscriptions renew automatically until
              cancelled; you may cancel at any time from your device&rsquo;s subscription
              settings.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">9. Refunds</h2>
            <p>
              Refunds are governed by our{' '}
              <Link href="/refund">Refund Policy</Link>. Because the App Store and Google Play
              are the merchant of record, refund requests are made to and decided by Apple or
              Google under their own policies.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Pleiad from any claims, damages, or
              expenses arising out of your use of the Service or your violation of these
              Terms.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Israel, without regard to
              its conflict-of-laws rules. Nothing in these Terms limits any mandatory
              consumer-protection rights available to you under the laws of your country of
              residence.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users
              of significant changes. Continued use of the Service after changes constitutes
              acceptance of the new terms.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">13. Contact</h2>
            <p>
              For questions about these Terms, please contact us at support@pleiad.io.
            </p>

            <div className="mt-8 pt-6 border-t">
              <Link href="/login" className="text-primary hover:underline">
                &larr; Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

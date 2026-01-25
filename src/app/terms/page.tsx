import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Omnis',
  description: 'Terms of Service for Omnis - the personal symbolic mapping platform for Dreamspell, Human Design, Astrology, and Gematria.',
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
              By accessing and using Omnis (&ldquo;the Service&rdquo;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. Description of Service</h2>
            <p>
              Omnis is a personal symbolic mapping platform that provides calculations and
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

            <h2 className="text-lg font-semibold mt-6 mb-3">6. Disclaimer</h2>
            <p>
              The symbolic calculations and interpretations provided by Omnis are for
              entertainment and personal exploration purposes only. They should not be
              used as a substitute for professional advice including medical, legal,
              financial, or psychological guidance.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Omnis shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages resulting
              from your use of the Service.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users
              of significant changes. Continued use of the Service after changes constitutes
              acceptance of the new terms.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">9. Contact</h2>
            <p>
              For questions about these Terms, please contact us at support@omnis.app.
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

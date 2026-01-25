import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <p className="text-muted-foreground">
              Last updated: January 25, 2026
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Email address, name (optional)</li>
              <li><strong>Profile Data:</strong> Birth date, birth time (optional), birth place (optional)</li>
              <li><strong>People Directory:</strong> Names and birth dates of people you add</li>
              <li><strong>Usage Data:</strong> Boards, groups, and relationships you create</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Calculate symbolic mappings (Dreamspell, Tzolkin, Astrology, etc.)</li>
              <li>Store your preferences and created content</li>
              <li>Send service-related communications (if you opt in)</li>
              <li>Improve and develop the Service</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase, which provides enterprise-grade
              security measures including encryption at rest and in transit. We implement
              Row Level Security (RLS) to ensure you can only access your own data.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data only:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>When you explicitly choose to share (e.g., shared boards)</li>
              <li>With service providers who help operate the Service</li>
              <li>If required by law or to protect our rights</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase:</strong> Authentication and database</li>
              <li><strong>Google OAuth:</strong> Optional sign-in method</li>
              <li><strong>Mapbox:</strong> Birth place geocoding (if location features are used)</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">7. Data Retention</h2>
            <p>
              We retain your data as long as your account is active. If you delete your
              account, we will delete your personal data within 30 days, except where
              retention is required by law.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do
              not use tracking or advertising cookies.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under 13. We do not knowingly
              collect information from children under 13.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of
              significant changes via email or through the Service.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">11. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at
              privacy@omnis.app.
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

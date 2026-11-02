import { CONTACT_ADDRESS, mailto } from './contact'
import { link, p, strong, ul, type LegalDoc } from './types'

export const PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Pleiad - learn how we collect, use, and protect your personal information including birth data and symbolic mappings.',
  updated: '2026-01-25',
  sections: [
    {
      heading: 'Information We Collect',
      blocks: [
        p('We collect information you provide directly:'),
        ul(
          [strong('Account Information:'), ' Email address, name (optional)'],
          [strong('Profile Data:'), ' Birth date, birth time (optional), birth place (optional)'],
          [strong('People Directory:'), ' Names and birth dates of people you add'],
          [strong('Usage Data:'), ' Boards, groups, and relationships you create'],
        ),
      ],
    },
    {
      heading: 'How We Use Your Information',
      blocks: [
        p('We use your information to:'),
        ul(
          ['Provide and maintain the Service'],
          ['Calculate symbolic mappings (Dreamspell, Tzolkin, Astrology, etc.)'],
          ['Store your preferences and created content'],
          ['Send service-related communications (if you opt in)'],
          ['Improve and develop the Service'],
        ),
      ],
    },
    {
      heading: 'Data Storage and Security',
      blocks: [
        p(
          'Your data is stored securely using Supabase, which provides enterprise-grade security measures including encryption at rest and in transit. We implement Row Level Security (RLS) to ensure you can only access your own data.',
        ),
      ],
    },
    {
      heading: 'Data Sharing',
      blocks: [
        p('We do not sell your personal information. We may share data only:'),
        ul(
          ['When you explicitly choose to share (e.g., shared boards)'],
          ['With service providers who help operate the Service'],
          ['If required by law or to protect our rights'],
        ),
      ],
    },
    {
      heading: 'Third-Party Services',
      blocks: [
        p('We use the following third-party processors to operate the Service:'),
        ul(
          [strong('Auth0:'), ' Authentication and sign-in'],
          [strong('Supabase:'), ' Database and secure data storage'],
          [
            strong('Apple App Store / Google Play:'),
            ' Payment processing and merchant of record for in-app purchases (billing, tax, refunds)',
          ],
          [strong('RevenueCat:'), ' Purchase and subscription status, so your plan unlocks on every device'],
          [strong('Resend:'), ' Transactional and newsletter email delivery'],
          [strong('PostHog:'), ' Privacy-respecting product analytics'],
          [strong('Cloudflare:'), ' Hosting, content delivery, and bot protection'],
        ),
      ],
    },
    {
      heading: 'Your Rights',
      blocks: [
        p('You have the right to:'),
        ul(
          ['Access your personal data'],
          ['Correct inaccurate data'],
          ['Delete your account and associated data'],
          ['Export your data'],
          ['Opt out of marketing communications'],
        ),
      ],
    },
    {
      heading: 'Your GDPR Rights (EEA & UK)',
      blocks: [
        p(
          'If you are in the European Economic Area or the United Kingdom, you have rights under the GDPR: access, rectification, erasure, restriction of processing, data portability, and the right to object. Our legal bases for processing are your consent, performance of our contract with you (providing the Service), and our legitimate interests in operating and improving Pleiad. You may lodge a complaint with your local supervisory authority. To exercise any right, contact us at ',
          mailto(CONTACT_ADDRESS.privacy),
          '.',
        ),
      ],
    },
    {
      heading: 'Your California Privacy Rights (CCPA/CPRA)',
      blocks: [
        p(
          'If you are a California resident, you have the right to know what personal information we collect and how it is used, to request deletion of your personal information, to correct inaccurate information, and to opt out of the “sale” or “sharing” of personal information. We do not sell your personal information. We will not discriminate against you for exercising these rights. To make a request, contact us at ',
          mailto(CONTACT_ADDRESS.privacy),
          '.',
        ),
      ],
    },
    {
      heading: 'Data Retention',
      blocks: [
        p(
          'We retain your data as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.',
        ),
      ],
    },
    {
      heading: 'Cookies',
      blocks: [
        p(
          'We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.',
        ),
      ],
    },
    {
      heading: "Children's Privacy",
      blocks: [
        p(
          'The Service is not intended for children under 13. We do not knowingly collect information from children under 13.',
        ),
      ],
    },
    {
      heading: 'Changes to This Policy',
      blocks: [
        p(
          'We may update this policy from time to time. We will notify you of significant changes via email or through the Service.',
        ),
      ],
    },
    {
      heading: 'Contact Us',
      blocks: [p(`For privacy-related questions or to exercise your rights, contact us at ${CONTACT_ADDRESS.privacy}.`)],
    },
  ],
}

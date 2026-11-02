import { CONTACT_ADDRESS } from './contact'
import { link, p, strong, ul, type LegalDoc } from './types'

export const TERMS: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Service',
  description:
    'Terms of Service for Pleiad - the personal symbolic mapping platform for Dreamspell, Human Design, Astrology, and Gematria.',
  updated: '2026-01-25',
  sections: [
    {
      heading: 'Acceptance of Terms',
      blocks: [
        p(
          'By accessing and using Pleiad (“the Service”), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.',
        ),
      ],
    },
    {
      heading: 'Description of Service',
      blocks: [
        p(
          'Pleiad is a personal symbolic mapping platform that provides calculations and visualizations based on various symbolic systems including Dreamspell, Tzolkin, Astrology, Human Design, and Gematria. The Service is for informational and entertainment purposes only.',
        ),
      ],
    },
    {
      heading: 'User Accounts',
      blocks: [
        p('To access certain features, you must create an account. You are responsible for:'),
        ul(
          ['Maintaining the confidentiality of your account'],
          ['All activities that occur under your account'],
          ['Providing accurate and current information'],
        ),
      ],
    },
    {
      heading: 'User Content',
      blocks: [
        p(
          'You retain ownership of any content you submit to the Service. By submitting content, you grant us a license to use, store, and process that content to provide the Service.',
        ),
      ],
    },
    {
      heading: 'Prohibited Uses',
      blocks: [
        p('You agree not to:'),
        ul(
          ['Use the Service for any unlawful purpose'],
          ['Attempt to gain unauthorized access to any part of the Service'],
          ['Interfere with or disrupt the Service'],
          ['Scrape or harvest data from the Service'],
        ),
      ],
    },
    {
      heading: 'Disclaimer & Warranty Disclaimer',
      blocks: [
        p(
          'The symbolic calculations and interpretations provided by Pleiad are for entertainment and personal exploration purposes only. They should not be used as a substitute for professional advice including medical, legal, financial, or psychological guidance.',
        ),
        p(
          'THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free, or that results obtained from it will be accurate or reliable.',
        ),
      ],
    },
    {
      heading: 'Limitation of Liability',
      blocks: [
        p(
          'To the maximum extent permitted by law, Pleiad shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability for any claim arising out of or relating to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the event giving rise to the claim.',
        ),
      ],
    },
    {
      heading: 'Payments, Billing & Fulfillment',
      blocks: [
        p(
          'Paid plans are sold as in-app purchases through the ',
          strong('Apple App Store'),
          ' and ',
          strong('Google Play'),
          ', which act as the merchant of record and handle payment processing, receipts, and applicable sales tax/VAT. Pleiad is a digital service: access to purchased features is provisioned to your account immediately upon successful payment, with no physical goods shipped. Your paid plan unlocks Pleiad on the web as well, on the same account you signed in with. Subscriptions renew automatically until cancelled; you may cancel at any time from your device’s subscription settings.',
        ),
      ],
    },
    {
      heading: 'Refunds',
      blocks: [
        p(
          'Refunds are governed by our ',
          link('Refund Policy', '/refund'),
          '. Because the App Store and Google Play are the merchant of record, refund requests are made to and decided by Apple or Google under their own policies.',
        ),
      ],
    },
    {
      heading: 'Indemnification',
      blocks: [
        p(
          'You agree to indemnify and hold harmless Pleiad from any claims, damages, or expenses arising out of your use of the Service or your violation of these Terms.',
        ),
      ],
    },
    {
      heading: 'Governing Law',
      blocks: [
        p(
          'These Terms are governed by the laws of the State of Israel, without regard to its conflict-of-laws rules. Nothing in these Terms limits any mandatory consumer-protection rights available to you under the laws of your country of residence.',
        ),
      ],
    },
    {
      heading: 'Changes to Terms',
      blocks: [
        p(
          'We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the Service after changes constitutes acceptance of the new terms.',
        ),
      ],
    },
    {
      heading: 'Contact',
      blocks: [p(`For questions about these Terms, please contact us at ${CONTACT_ADDRESS.support}.`)],
    },
  ],
}

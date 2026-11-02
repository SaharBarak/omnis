import { CONTACT_ADDRESS, mailto } from './contact'
import { link, p, strong, ul, type LegalDoc } from './types'

export const REFUND: LegalDoc = {
  slug: 'refund',
  title: 'Refund Policy',
  description:
    'Refund Policy for Pleiad. Plans are purchased as in-app purchases; the Apple App Store and Google Play are the merchant of record and handle refunds.',
  updated: '2026-07-13',
  sections: [
    {
      heading: 'Merchant of Record',
      blocks: [
        p(
          'Paid plans for Pleiad (“the Service”) are sold as in-app purchases through the ',
          strong('Apple App Store'),
          ' and ',
          strong('Google Play'),
          '. Those stores are the merchant of record: they take the payment, issue the receipt, handle applicable tax, and decide refunds. Pleiad does not process your card and does not hold your payment details.',
        ),
      ],
    },
    {
      heading: 'Refunds Are Handled by the Store',
      blocks: [
        p(
          'Because the store is the merchant of record, refund requests are made to, and decided by, Apple or Google under their own policies; we cannot issue a refund to your payment method ourselves.',
        ),
        ul(
          [
            strong('Apple:'),
            ' request a refund at ',
            link('reportaproblem.apple.com', 'https://reportaproblem.apple.com'),
            ' or through your purchase receipt.',
          ],
          [
            strong('Google Play:'),
            ' request a refund through your ',
            link('Google Play order history', 'https://play.google.com/store/account/orderhistory'),
            '.',
          ],
        ),
        p(
          'If a store declines a request you believe is fair, email us; we will support your case with the store where we can, though the final decision is theirs.',
        ),
      ],
    },
    {
      heading: 'Subscriptions',
      blocks: [
        p(
          'You may cancel a subscription at any time from your device’s subscription settings (App Store or Google Play account). Cancellation stops future renewals; you keep access until the end of the period you have already paid for. Renewal charges are generally non-refundable once a new period has begun, except where required by law or where the store grants a refund.',
        ),
      ],
    },
    {
      heading: 'Founding Lifetime',
      blocks: [
        p(
          'The Founding Lifetime plan is a one-time purchase granting permanent access. It is refundable only under the store’s refund policy (see section 2).',
        ),
      ],
    },
    {
      heading: 'Your Data After a Refund',
      blocks: [
        p(
          'A refund removes your paid entitlement and returns your account to the Free plan. Your people, notes and maps are not deleted; they stay saved, subject to the Free plan’s limits.',
        ),
      ],
    },
    {
      heading: 'Contact',
      blocks: [
        p(
          'Questions about this policy? Reach us at ',
          mailto(CONTACT_ADDRESS.support),
          '. See also our ',
          link('Terms of Service', '/terms'),
          ' and ',
          link('Privacy Policy', '/privacy'),
          '.',
        ),
      ],
    },
  ],
}

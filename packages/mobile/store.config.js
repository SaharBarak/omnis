/**
 * App Store Connect listing, pushed with `npx eas-cli metadata:push`.
 *
 * This was store.config.json until App Review Information needed to go in it.
 * That block carries the demo account's password, which must never be
 * committed — a JS config lets it come from the environment instead. EAS reads
 * this file because eas.json → submit.production.ios.metadataPath points here.
 *
 * Set before pushing review details (both, or the block is omitted entirely
 * and ASC keeps whatever is already there):
 *
 *   export ASC_DEMO_PASSWORD=...     # from scripts/create-review-account.mjs
 *   export ASC_CONTACT_PHONE=...     # a number Apple can actually reach
 *
 * Still to be answered by hand in ASC, deliberately not encoded here: the age
 * rating questionnaire. It is a content attestation Apple holds you to, so it
 * wants a human clicking it, not a config file.
 */

const DEMO_EMAIL = 'appreview@pleiad.io'
const demoPassword = process.env.ASC_DEMO_PASSWORD
const contactPhone = process.env.ASC_CONTACT_PHONE

/**
 * Apple requires working credentials for anything behind a login. Sign-in is
 * one-time-code by default and a reviewer cannot receive the email, so this
 * account signs in with a password — the login screen reveals that field only
 * for the address in EXPO_PUBLIC_REVIEW_EMAIL.
 */
const review =
  demoPassword && contactPhone
    ? {
        firstName: 'Sahar',
        lastName: 'Barak',
        email: 'sahar.h.barak@gmail.com',
        phone: contactPhone,
        demoRequired: true,
        demoUsername: DEMO_EMAIL,
        demoPassword,
        notes: [
          'Sign-in is passwordless for real users: you enter an email and receive a 6-digit code.',
          `The review account above is the one exception — enter ${DEMO_EMAIL} on the first screen and the app shows a password field instead of sending a code.`,
          '',
          'Pleiad presents symbolic and calendrical traditions (Dreamspell, Tzolkin, Long Count, Human Design, Western astrology, Hebrew gematria) side by side, for education and reflection. It makes no claim that any system is factually predictive.',
        ].join('\n'),
      }
    : undefined

module.exports = {
  configVersion: 0,
  apple: {
    info: {
      'en-US': {
        title: 'Pleiad: The Living Map',
        subtitle: 'Your people, across systems',
        description:
          "Pleiad maps the people in your life across humanity's symbolic traditions — side by side, without claiming any one of them is the truth.\n\nAdd the people who matter — partner, family, friends — and Pleiad renders each of them through six systems: Dreamspell galactic signatures, the Tzolkin count, the Mayan Long Count, Human Design bodygraphs, Western astrology, and Hebrew gematria. Then it goes further: tap any two people to explore how the traditions read their bond.\n\nTHE TODAY BOARD\nOpen the app to a single daily board: today's kin, moon phase, tropical and sidereal sun, Human Design gate, and the date across the Hebrew, Hijri, Persian, and Chinese calendars, with the Vedic panchang and the Long Count still ticking underneath.\n\nTHE MAP\nYour people arranged as a living constellation — zoom, filter, tap into anyone, compare any two. Galactic birthdays surface when someone's kin returns.\n\nEDUCATION, NOT DOGMA\nEvery system ships with its history, cultural context, and how the math actually works. Pleiad presents traditions respectfully and lets you decide what they mean to you. For reflection, education, and entertainment.\n\nYour data stays yours. Birth details you add are used only to compute charts.",
        keywords: [
          'astrology',
          'human design',
          'dreamspell',
          'birth chart',
          'synastry',
          'mayan calendar',
          'gematria',
          'kin',
          'bodygraph',
        ],
        marketingUrl: 'https://pleiad.io',
        supportUrl: 'https://pleiad.io/contact',
        privacyPolicyUrl: 'https://pleiad.io/privacy',
      },
    },
    categories: ['LIFESTYLE', 'EDUCATION'],
    // Ship on your command, not Apple's — approval and launch stay separate.
    release: { automaticRelease: false },
    ...(review ? { review } : {}),
  },
}

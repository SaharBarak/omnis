/**
 * Homepage FAQ — acquisition questions only (do I need an account, what do
 * I get, is the AI grounded, what does the map do). Plan, accuracy, and
 * data questions live in `faqs` below, rendered on /pricing; the homepage
 * links there instead of repeating them.
 */
export const homeFaqs = [
  {
    question: 'Do I need an account to get a reading?',
    answer:
      'No. Enter a birth date for a complete Dreamspell reading, plus date-based previews from Tzolkin, Long Count, and Astrology. No account or card is required. Create an account only when you want to save people.',
  },
  {
    question: 'What information do I need for all six systems?',
    answer:
      'A birth date starts Dreamspell, Tzolkin, and Long Count. A full Astrology chart and Human Design bodygraph need an exact birth time and place. Hebrew Gematria needs a Hebrew name. You can begin with what you know and add the rest later.',
  },
  {
    question: 'What is the people map?',
    answer:
      'It is your saved library of people plus the comparisons you choose to make between them. Pleiad compares people across the compatibility layers supported by their data. You can also record real-life relationships and organize people into groups.',
  },
  {
    question: 'Is AI calculating the charts?',
    answer:
      'No. Charts and compatibility results come from calculation engines. AI is an optional interpretation layer on paid plans; it does not change the underlying calculation.',
  },
  {
    question: 'Is my people library private?',
    answer:
      'Saved profiles are scoped to your account. You choose when to create a share link and what to share.',
  },
  {
    question: 'Can practitioners use Pleiad?',
    answer:
      'Yes. The Practitioner plan includes unlimited people and boards, advanced relationship tools, group analysis, PDF exports, and API access.',
  },
]

export const faqs = [
  {
    question: "What can I do with the free plan?",
    answer: "Free lets you save 3 people with Dreamspell calculations and daily kin. It's designed to try Pleiad before upgrading. Explorer ($5/mo) opens all 6 systems and relationship readings for up to 15 people; Complete ($9/mo) holds 25 people with 50 AI interpretations and PDF exports; Practitioner ($29/mo) is unlimited for mapping clients or large groups.",
  },
  {
    question: "I don't know my exact birth time. Can I still use Pleiad?",
    answer: "Yes. A birth date is enough for Dreamspell, Tzolkin, and Long Count, plus an Astrology sun-sign preview. A full natal chart and Human Design bodygraph need an exact birth time and place. Hebrew Gematria needs a Hebrew name. You can add those details later.",
  },
  {
    question: "How accurate are the calculations?",
    answer: "Charts and compatibility results come from deterministic calculation engines, not AI. Dreamspell uses the Arguelles calendar rules with leap-day handling, while Tzolkin and Long Count use the GMT correlation (584283). The knowledge guides explain the methods behind the readings.",
  },
  {
    question: "What's the difference between Dreamspell and Tzolkin?",
    answer: "Dreamspell is Jose Arguelles' modern system (1987), synchronized to July 26 with leap-day skipping. Tzolkin is the traditional Mayan count using the GMT correlation - an unbroken count spanning millennia. They give different kin numbers for the same date. We calculate both.",
  },
  {
    question: "Can I use this with clients?",
    answer: "The Complete plan ($9/mo) lets you save up to 25 profiles with all 6 systems, 50 AI interpretations, and PDF exports - great for personal use. The Practitioner plan ($29/mo) unlocks unlimited profiles, unlimited AI, group analysis, and advanced relationship tools - designed for working with clients professionally.",
  },
  {
    question: "How is my data stored?",
    answer: "Saved profiles are scoped to your account. Pleiad only creates a share link when you choose to share something. See the privacy policy for full details about data handling.",
  },
]

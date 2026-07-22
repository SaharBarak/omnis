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
      'No. Enter one birthday on the calculate page and the full reading comes back with nothing saved and no card asked. An account only matters once you want Pleiad to remember people and the ties between them.',
  },
  {
    question: 'What do I actually get from six systems at once?',
    answer:
      'One screen holds your natal chart, galactic signature, day sign, Long Count date, bodygraph, and the number of your name - six traditions that never met each other, reading the same moment. Where they agree is usually where it gets interesting.',
  },
  {
    question: 'Is the AI just making this up?',
    answer:
      'The charts are pure math - real ephemeris and Long Count calculations, the same ones practitioners use. When AI interprets a chart, every claim cites a searchable knowledge base, so you can check the source line yourself.',
  },
  {
    question: 'What happens when I add a second person?',
    answer:
      "Pleiad computes how they connect to everyone already on your map - who guides whom, which channel two people complete, which planets are talking - and names each tie in the system that found it. That's the map: it grows with every person you add.",
  },
]

export const faqs = [
  {
    question: "What can I do with the free plan?",
    answer: "Free lets you save 3 people with Dreamspell calculations and daily kin. It's designed to try Pleiad before upgrading. Explorer ($5/mo) opens all 6 systems and relationship readings for up to 15 people; Complete ($9/mo) holds 25 people with 50 AI interpretations and PDF exports; Practitioner ($29/mo) is unlimited for mapping clients or large groups.",
  },
  {
    question: "I don't know my exact birth time. Can I still use Pleiad?",
    answer: "Yes. Your birth date alone gives you Dreamspell, Tzolkin, Long Count, and Kabbalah - four of the six systems. Human Design authority and astrology Moon/Rising require exact time. You can add it later if you find it (birth certificates often have it).",
  },
  {
    question: "How accurate are the calculations?",
    answer: "Dreamspell follows Arguelles' system with correct leap-day handling. Human Design uses the standard mandala. Tzolkin uses the GMT correlation (584283). We've cross-referenced against established sources. If you find an error, contact us - we take accuracy seriously.",
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
    answer: "We use Supabase with Row Level Security. Your data is encrypted. You can export everything or delete your account at any time. We don't track, advertise, or sell data.",
  },
]

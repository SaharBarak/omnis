/**
 * Pleiad Documentation Content
 * Comprehensive knowledge base for all symbolic systems
 *
 * This content was crafted with respect for the lineages:
 * - José Argüelles: "Time is not money. Time is Art."
 * - Ra Uru Hu: "I am not the guru. I am a mechanic."
 */

// ============================================================================
// DREAMSPELL DOCUMENTATION
// ============================================================================

export const dreamspellDocs = {
  overview: {
    title: 'Dreamspell: The Galactic Calendar',
    subtitle: 'A Modern Interpretation of Ancient Mayan Timekeeping',
    introduction: `
      Dreamspell is a synchronic timing system developed by José Argüelles and Lloydine Argüelles in 1987.
      It reinterprets the ancient Mayan Tzolkin calendar through a contemporary lens, offering a way
      to step out of linear, mechanical time and into cyclical, natural time.

      Unlike the Gregorian calendar, which Argüelles called "the 12:60 frequency" (12 months, 60-minute hours),
      Dreamspell operates on the 13:20 frequency: 13 tones × 20 seals = 260 unique days called Kin.

      Your Galactic Signature is the Kin of your birthday, a cosmic imprint that reveals your purpose,
      challenges, and gifts within this larger pattern.
    `,
    quote: {
      text: "Who owns your time owns your mind. Own your own time and know your own mind.",
      author: "José Argüelles"
    }
  },

  tzolkin: {
    title: 'The 260-Day Tzolkin',
    content: `
      The Tzolkin (meaning "count of days" in Yucatec Maya) is the sacred 260-day cycle that forms
      the heart of Dreamspell. This cycle has been tracked continuously by Maya daykeepers for
      over 2,500 years without interruption.

      The 260-day period likely relates to:
      - The human gestation period (~260 days)
      - Agricultural cycles in Mesoamerica
      - The visibility cycle of Venus
      - The interval between zenith passages of the sun at 15° north latitude

      In Dreamspell, each of the 260 Kin has a unique combination of:
      - One of 20 Solar Seals (archetypes)
      - One of 13 Galactic Tones (creative powers)
    `,
    structure: [
      { term: 'Kin', definition: 'A single day in the 260-day cycle. Also means "day" in Mayan.' },
      { term: 'Wavespell', definition: 'A 13-day cycle governed by one Solar Seal through all 13 Tones.' },
      { term: 'Castle', definition: 'A 52-day period containing 4 Wavespells with a specific purpose.' },
      { term: 'Spin', definition: 'One complete 260-day Tzolkin cycle.' }
    ]
  },

  seals: {
    title: 'The 20 Solar Seals',
    subtitle: 'Archetypal Energies of the Day',
    introduction: `
      The 20 Solar Seals are archetypal forces that describe the essential nature of each day
      and, when it falls on your birthday, a core aspect of your being. Each Seal carries:

      - A Power (what it does)
      - An Action (how it operates)
      - An Essence (its fundamental quality)

      The Seals are organized into four Color Families, each associated with a direction and function.
    `,
    colorFamilies: [
      {
        color: 'Red',
        direction: 'East',
        function: 'Initiate',
        description: 'Red Seals begin cycles. They carry the spark of new beginnings, the energy to start.',
        seals: ['Dragon', 'Serpent', 'Moon', 'Skywalker', 'Earth']
      },
      {
        color: 'White',
        direction: 'North',
        function: 'Refine',
        description: 'White Seals purify and refine. They clarify and distill what Red initiated.',
        seals: ['Wind', 'World-Bridger', 'Dog', 'Wizard', 'Mirror']
      },
      {
        color: 'Blue',
        direction: 'West',
        function: 'Transform',
        description: 'Blue Seals transform and transmit. They change what was refined into something new.',
        seals: ['Night', 'Hand', 'Monkey', 'Eagle', 'Storm']
      },
      {
        color: 'Yellow',
        direction: 'South',
        function: 'Ripen',
        description: 'Yellow Seals ripen and mature. They bring the cycle to fruition and harvest.',
        seals: ['Seed', 'Star', 'Human', 'Warrior', 'Sun']
      }
    ],
    sealDetails: [
      { number: 1, name: 'Red Dragon', power: 'Birth', action: 'Nurtures', essence: 'Being', keywords: ['primal trust', 'nurturance', 'new beginnings'] },
      { number: 2, name: 'White Wind', power: 'Spirit', action: 'Communicates', essence: 'Breath', keywords: ['divine messenger', 'inspiration', 'truth'] },
      { number: 3, name: 'Blue Night', power: 'Abundance', action: 'Dreams', essence: 'Intuition', keywords: ['the unconscious', 'dreams', 'inner knowing'] },
      { number: 4, name: 'Yellow Seed', power: 'Flowering', action: 'Targets', essence: 'Awareness', keywords: ['potential', 'fertility', 'planting ideas'] },
      { number: 5, name: 'Red Serpent', power: 'Life Force', action: 'Survives', essence: 'Instinct', keywords: ['kundalini', 'passion', 'body wisdom'] },
      { number: 6, name: 'White World-Bridger', power: 'Death', action: 'Equalizes', essence: 'Opportunity', keywords: ['surrender', 'release', 'crossing'] },
      { number: 7, name: 'Blue Hand', power: 'Accomplishment', action: 'Knows', essence: 'Healing', keywords: ['knowledge', 'craft', 'healing touch'] },
      { number: 8, name: 'Yellow Star', power: 'Elegance', action: 'Beautifies', essence: 'Art', keywords: ['beauty', 'harmony', 'artistic expression'] },
      { number: 9, name: 'Red Moon', power: 'Universal Water', action: 'Purifies', essence: 'Flow', keywords: ['emotions', 'purification', 'receptivity'] },
      { number: 10, name: 'White Dog', power: 'Heart', action: 'Loves', essence: 'Loyalty', keywords: ['unconditional love', 'heart', 'devotion'] },
      { number: 11, name: 'Blue Monkey', power: 'Magic', action: 'Plays', essence: 'Illusion', keywords: ['inner child', 'play', 'divine trickster'] },
      { number: 12, name: 'Yellow Human', power: 'Free Will', action: 'Influences', essence: 'Wisdom', keywords: ['choice', 'wisdom vessel', 'influence'] },
      { number: 13, name: 'Red Skywalker', power: 'Space', action: 'Explores', essence: 'Wakefulness', keywords: ['expansion', 'exploration', 'bridge'] },
      { number: 14, name: 'White Wizard', power: 'Timelessness', action: 'Enchants', essence: 'Receptivity', keywords: ['enchantment', 'magician', 'heart-knowing'] },
      { number: 15, name: 'Blue Eagle', power: 'Vision', action: 'Creates', essence: 'Mind', keywords: ['planetary mind', 'seeing', 'commitment'] },
      { number: 16, name: 'Yellow Warrior', power: 'Intelligence', action: 'Questions', essence: 'Fearlessness', keywords: ['inner quest', 'courage', 'intelligence'] },
      { number: 17, name: 'Red Earth', power: 'Navigation', action: 'Evolves', essence: 'Synchronicity', keywords: ['grounding', 'evolution', 'centeredness'] },
      { number: 18, name: 'White Mirror', power: 'Endlessness', action: 'Reflects', essence: 'Order', keywords: ['reflection', 'truth', 'infinite'] },
      { number: 19, name: 'Blue Storm', power: 'Self-Generation', action: 'Catalyzes', essence: 'Energy', keywords: ['transformation', 'catalyst', 'rebirth'] },
      { number: 20, name: 'Yellow Sun', power: 'Universal Fire', action: 'Enlightens', essence: 'Life', keywords: ['enlightenment', 'ascension', 'wholeness'] }
    ]
  },

  tones: {
    title: 'The 13 Galactic Tones',
    subtitle: 'The Pulse of Creation',
    introduction: `
      The 13 Galactic Tones represent stages in a creative cycle, from initial impulse to completion.
      They describe HOW the energy of a Solar Seal expresses itself. Together, one Tone + one Seal = one Kin.

      The 13-day Wavespell is the natural home of the Tones, with each Wavespell cycling through
      all 13 Tones in sequence. Understanding your Tone helps you know your role in any creative process.
    `,
    toneDetails: [
      { number: 1, name: 'Magnetic', action: 'Unify', power: 'Attract', keywords: ['purpose', 'beginning', 'unity'], description: 'Magnetic Tone initiates and attracts. It identifies purpose and unifies around a central theme.' },
      { number: 2, name: 'Lunar', action: 'Polarize', power: 'Stabilize', keywords: ['challenge', 'polarity', 'stability'], description: 'Lunar Tone identifies the challenge. It reveals polarity and what needs to be stabilized.' },
      { number: 3, name: 'Electric', action: 'Activate', power: 'Bond', keywords: ['service', 'activation', 'bonding'], description: 'Electric Tone activates service. It bonds different elements and sparks dynamic movement.' },
      { number: 4, name: 'Self-Existing', action: 'Define', power: 'Measure', keywords: ['form', 'definition', 'foundation'], description: 'Self-Existing Tone defines form. It creates the foundation and measures what is needed.' },
      { number: 5, name: 'Overtone', action: 'Empower', power: 'Command', keywords: ['radiance', 'empowerment', 'center'], description: 'Overtone commands empowerment. It radiates from center and takes leadership.' },
      { number: 6, name: 'Rhythmic', action: 'Organize', power: 'Balance', keywords: ['equality', 'organization', 'balance'], description: 'Rhythmic Tone organizes for equality. It brings balance and administers resources.' },
      { number: 7, name: 'Resonant', action: 'Channel', power: 'Inspire', keywords: ['attunement', 'channeling', 'mystical'], description: 'Resonant Tone attunes to the center. It channels inspiration and holds mystical knowing.' },
      { number: 8, name: 'Galactic', action: 'Harmonize', power: 'Model', keywords: ['integrity', 'harmony', 'modeling'], description: 'Galactic Tone harmonizes through integrity. It models how the universe functions.' },
      { number: 9, name: 'Solar', action: 'Pulse', power: 'Realize', keywords: ['intention', 'pulse', 'realization'], description: 'Solar Tone pulses intention into realization. It makes things happen.' },
      { number: 10, name: 'Planetary', action: 'Perfect', power: 'Produce', keywords: ['manifestation', 'perfection', 'production'], description: 'Planetary Tone perfects manifestation. It produces the intended result.' },
      { number: 11, name: 'Spectral', action: 'Dissolve', power: 'Release', keywords: ['liberation', 'dissolution', 'release'], description: 'Spectral Tone dissolves and releases. It liberates what no longer serves.' },
      { number: 12, name: 'Crystal', action: 'Dedicate', power: 'Universalize', keywords: ['cooperation', 'dedication', 'sharing'], description: 'Crystal Tone dedicates to universal sharing. It brings cooperation and complex stability.' },
      { number: 13, name: 'Cosmic', action: 'Endure', power: 'Transcend', keywords: ['presence', 'endurance', 'transcendence'], description: 'Cosmic Tone transcends and endures. It holds presence beyond the cycle.' }
    ]
  },

  wavespells: {
    title: 'Wavespells: The 13-Day Journey',
    content: `
      A Wavespell is a 13-day cycle that moves through all 13 Galactic Tones while maintaining
      one Solar Seal as its theme. There are 20 Wavespells in a complete Tzolkin, one beginning
      with each of the 20 Solar Seals.

      Think of a Wavespell as a journey: it begins with the Magnetic Tone (setting intention),
      moves through development and transformation, and culminates with the Cosmic Tone (transcendence).

      The first day of any Wavespell is called the "Magnetic Gate": the doorway into that cycle's theme.
    `,
    structure: [
      { day: 1, tone: 'Magnetic', phase: 'Purpose', description: 'Set your intention for the 13 days' },
      { day: 2, tone: 'Lunar', phase: 'Challenge', description: 'Identify the challenge or polarity' },
      { day: 3, tone: 'Electric', phase: 'Service', description: 'Activate through service to others' },
      { day: 4, tone: 'Self-Existing', phase: 'Form', description: 'Define the foundation and form' },
      { day: 5, tone: 'Overtone', phase: 'Radiance', description: 'Command from your center' },
      { day: 6, tone: 'Rhythmic', phase: 'Equality', description: 'Organize and balance resources' },
      { day: 7, tone: 'Resonant', phase: 'Attunement', description: 'Channel inspiration at the center' },
      { day: 8, tone: 'Galactic', phase: 'Integrity', description: 'Model harmony and integrity' },
      { day: 9, tone: 'Solar', phase: 'Intention', description: 'Pulse intention into realization' },
      { day: 10, tone: 'Planetary', phase: 'Manifestation', description: 'Perfect and produce results' },
      { day: 11, tone: 'Spectral', phase: 'Liberation', description: 'Release and dissolve' },
      { day: 12, tone: 'Crystal', phase: 'Cooperation', description: 'Share and cooperate universally' },
      { day: 13, tone: 'Cosmic', phase: 'Transcendence', description: 'Transcend and take presence into next cycle' }
    ]
  },

  oracle: {
    title: 'The Dreamspell Oracle',
    subtitle: 'Your Five-Part Cosmic Support System',
    content: `
      Every Kin is surrounded by four other energies that form its Oracle, a support system
      that reveals the full context of that day or person's energy. The Oracle shows that
      you never operate in isolation but are always part of a larger pattern.
    `,
    positions: [
      {
        name: 'Destiny (Center)',
        color: '#F59E0B',
        description: 'Your core Kin, the central theme of your energy. This is your Galactic Signature.',
        calculation: 'Your birth date Kin'
      },
      {
        name: 'Guide',
        color: '#10B981',
        description: 'The higher wisdom that leads you. Based on your Tone, this Seal of the same color guides your path.',
        calculation: 'Same color family, determined by Tone'
      },
      {
        name: 'Analog (Support)',
        color: '#3B82F6',
        description: 'Your support energy, a complementary partner that adds up to 19 with your Seal number.',
        calculation: 'Seal number that + your Seal = 19'
      },
      {
        name: 'Antipode (Challenge)',
        color: '#EF4444',
        description: 'Your challenge and gift, the energy that stretches you. Located 10 Seals away.',
        calculation: 'Your Seal + 10 (or -10 if over 20)'
      },
      {
        name: 'Occult (Hidden Power)',
        color: '#8B5CF6',
        description: 'Hidden, magical power that emerges from the shadows. The Seal that + yours = 21.',
        calculation: 'Seal number that + your Seal = 21'
      }
    ]
  },

  castles: {
    title: 'The Five Castles',
    subtitle: '52-Day Transformational Cycles',
    content: `
      The 260-day Tzolkin is divided into Five Castles, each lasting 52 days (4 Wavespells).
      The Castles represent major chapters in the evolutionary journey, each with a specific function.
    `,
    castleDetails: [
      {
        name: 'Red Eastern Castle of Turning',
        color: '#EF4444',
        days: '1-52',
        function: 'Initiation',
        wavespells: ['Dragon', 'Wizard', 'Hand', 'Sun'],
        description: 'The court of birth. Here we plant seeds and begin the journey.'
      },
      {
        name: 'White Northern Castle of Crossing',
        color: '#F3F4F6',
        days: '53-104',
        function: 'Refinement',
        wavespells: ['Skywalker', 'World-Bridger', 'Storm', 'Human'],
        description: 'The court of death. Here we cross over and refine our purpose.'
      },
      {
        name: 'Blue Western Castle of Burning',
        color: '#3B82F6',
        days: '105-156',
        function: 'Transformation',
        wavespells: ['Serpent', 'Mirror', 'Monkey', 'Seed'],
        description: 'The court of magic. Here we transform and transmit knowledge.'
      },
      {
        name: 'Yellow Southern Castle of Giving',
        color: '#F59E0B',
        days: '157-208',
        function: 'Ripening',
        wavespells: ['Earth', 'Dog', 'Night', 'Warrior'],
        description: 'The court of intelligence. Here we ripen and give back.'
      },
      {
        name: 'Green Central Castle of Enchantment',
        color: '#10B981',
        days: '209-260',
        function: 'Matrix',
        wavespells: ['Moon', 'Wind', 'Eagle', 'Star'],
        description: 'The court of synchronization. Here we enchant and synchronize all cycles.'
      }
    ]
  },

  portalDays: {
    title: 'Galactic Activation Portals',
    subtitle: 'Days of Amplified Energy',
    content: `
      There are 52 Galactic Activation Portal (GAP) days in each Tzolkin cycle. These days
      form a distinctive pattern called the "loom of the Maya": a DNA-like double helix when
      viewed on the Tzolkin grid.

      Portal days are considered times of amplified energy, when the veil between dimensions
      is thinner and synchronicities are more likely. Many people report heightened intuition,
      vivid dreams, or significant events on GAP days.

      The pattern creates a 10-day "core" period in the middle of the Tzolkin (Kin 121-130)
      where every day is a GAP day, considered the most intense period of the cycle.
    `
  },

  practicalUse: {
    title: 'Using Dreamspell Daily',
    tips: [
      {
        title: 'Morning Attunement',
        description: 'Each morning, check the day\'s Kin. Read the Seal and Tone qualities. Set an intention aligned with that energy.'
      },
      {
        title: 'Wavespell Awareness',
        description: 'Know which Wavespell you\'re in and what day of the 13-day cycle it is. Day 1 is for setting intentions, Day 7 for reflection.'
      },
      {
        title: 'Oracle Meditation',
        description: 'Contemplate your personal Oracle. How are Guide, Analog, Antipode, and Occult energies showing up in your life?'
      },
      {
        title: 'Relationship Insight',
        description: 'Calculate the Kins of people close to you. See where your Seals and Tones relate: are they your Guide, Analog, or Antipode?'
      },
      {
        title: 'Annual Cycles',
        description: 'Your Galactic Return (birthday in the Tzolkin) happens every 260 days. Celebrate this as your "galactic birthday."'
      }
    ]
  }
}

// ============================================================================
// HUMAN DESIGN DOCUMENTATION
// ============================================================================

export const humanDesignDocs = {
  overview: {
    title: 'Human Design: Your Energetic Blueprint',
    subtitle: 'A Synthesis of Ancient Wisdom and Modern Science',
    introduction: `
      Human Design is a system of self-knowledge that was transmitted to Ra Uru Hu (Robert Allan Krakower)
      in 1987 during an eight-day mystical experience on the island of Ibiza. What emerged was a synthesis
      of four ancient wisdom systems: Western Astrology, the Chinese I Ching, the Hindu-Brahmin Chakra System,
      and the Kabbalistic Tree of Life, unified through modern genetics and quantum physics.

      Your Human Design chart (called a Bodygraph) is calculated from your exact birth date, time, and location.
      It reveals your energetic mechanics: how you're designed to make decisions, interact with others,
      and find your correct path in life.

      Human Design is not about what you should do: it's about how you're designed to operate.
      It's a practical system for decision-making and self-understanding.
    `,
    quote: {
      text: "The Voice said to me: 'I am not the guru. I am a mechanic.' And I have been a mechanic ever since.",
      author: "Ra Uru Hu"
    }
  },

  types: {
    title: 'The Five Energy Types',
    subtitle: 'Your Aura and Role in the World',
    introduction: `
      Type is the most fundamental aspect of Human Design. It determines your aura type: how your energy
      field operates and interacts with others. Your Type tells you the correct Strategy for engaging
      with life, and the Not-Self Theme that signals when you're off track.
    `,
    typeDetails: [
      {
        name: 'Manifestor',
        percentage: '~9% of population',
        strategy: 'Inform before acting',
        notSelf: 'Anger',
        signature: 'Peace',
        aura: 'Closed and repelling',
        description: `
          Manifestors are the only Type designed to act independently without waiting. They have a direct
          connection between a motor center and the Throat, giving them the power to initiate and impact.

          Their challenge is that their closed aura creates resistance from others. The Strategy of Informing
          reduces this resistance: not asking permission, but giving people a heads-up before acting.

          When operating correctly, Manifestors feel Peace. When forcing or being blocked, they feel Anger.
        `,
        keyPoints: [
          'Born to initiate and impact',
          'Closed, repelling aura',
          'Need freedom and autonomy',
          'Informing reduces resistance',
          'Often misunderstood as children'
        ]
      },
      {
        name: 'Generator',
        percentage: '~37% of population',
        strategy: 'Wait to respond',
        notSelf: 'Frustration',
        signature: 'Satisfaction',
        aura: 'Open and enveloping',
        description: `
          Generators are the life-force of the planet. They have a defined Sacral center, which gives them
          sustainable energy for work and creation, but only for the right work.

          The Sacral speaks through gut sounds and sensations (uh-huh, uh-uh). Generators are designed to
          respond to life rather than initiate. When they wait for something to show up to respond to,
          they find work that truly satisfies.

          When forcing or doing the wrong work, Generators feel Frustration. When responding correctly,
          they feel deep Satisfaction.
        `,
        keyPoints: [
          'Sustainable, regenerating life-force energy',
          'The Sacral knows before the mind',
          'Designed for mastery through response',
          'Need to love their work',
          'Open, enveloping aura'
        ]
      },
      {
        name: 'Manifesting Generator',
        percentage: '~33% of population',
        strategy: 'Wait to respond, then inform',
        notSelf: 'Frustration and Anger',
        signature: 'Satisfaction and Peace',
        aura: 'Open and enveloping',
        description: `
          Manifesting Generators are Generators with Manifestor characteristics: they have a defined Sacral
          AND a motor connected to the Throat. They're the "multi-hyphenates" of the world, often juggling
          multiple interests and moving quickly.

          Like Generators, they must wait to respond. But once they respond, they can move fast and should
          inform those impacted by their actions. They're designed to be efficient, often skipping steps
          others need to take.

          They can experience both Generator frustration and Manifestor anger when off-track.
        `,
        keyPoints: [
          'Multi-passionate and fast-moving',
          'Skip steps naturally: efficiency experts',
          'Must respond first, then can initiate',
          'Often appear to change direction frequently',
          'Need variety and multiple outlets'
        ]
      },
      {
        name: 'Projector',
        percentage: '~20% of population',
        strategy: 'Wait for the invitation',
        notSelf: 'Bitterness',
        signature: 'Success',
        aura: 'Focused and absorbing',
        description: `
          Projectors have no motor connected to the Throat and no defined Sacral. They're not designed
          for sustainable physical work but for guiding and managing the energy of others.

          Their focused aura penetrates deeply into others, giving them natural insight into how people
          and systems work. But this penetration isn't always welcome: Projectors must wait for recognition
          and invitation to share their guidance.

          When pushing without invitation, Projectors meet resistance and feel Bitterness. When recognized
          and invited, they experience true Success.
        `,
        keyPoints: [
          'Born to guide and manage energy',
          'See deeply into others',
          'Need recognition before sharing wisdom',
          'Not designed for long work hours',
          'Require more rest than other Types'
        ]
      },
      {
        name: 'Reflector',
        percentage: '~1% of population',
        strategy: 'Wait a lunar cycle (28 days)',
        notSelf: 'Disappointment',
        signature: 'Surprise',
        aura: 'Resistant and sampling',
        description: `
          Reflectors are the rarest Type, with all nine centers undefined. They have no consistent, fixed
          energy of their own. Instead, they sample and reflect the energies around them.

          This makes them the most sensitive barometers of community health. A Reflector in a healthy
          environment thrives; in an unhealthy one, they suffer. Their decisions are best made over a
          full lunar cycle, sampling the Moon's journey through their chart.

          When in the wrong environment, Reflectors feel Disappointment. When aligned, life is a continuous
          Surprise of what they can reflect and experience.
        `,
        keyPoints: [
          'Mirrors of their community',
          'Highly sensitive to environment',
          'No consistent personal energy',
          'Major decisions need 28 days',
          'Can be wise or become lost: environment is everything'
        ]
      }
    ]
  },

  authority: {
    title: 'Inner Authority',
    subtitle: 'Your Personal Decision-Making Guidance System',
    introduction: `
      Authority is perhaps the most practical aspect of Human Design. It tells you HOW to make correct
      decisions for yourself: not with your mind, but through your body's wisdom.

      The mind is brilliant at processing information and seeing possibilities, but it is NOT designed
      to be your decision-maker. Authority moves decision-making to a consistent, reliable place in your
      body that your mind can then support.
    `,
    authorities: [
      {
        name: 'Emotional Authority',
        percentage: '~50% of people',
        center: 'Solar Plexus',
        description: `
          If you have a defined Solar Plexus, this is your authority, regardless of what else is defined.
          Emotional authority means there is no truth in the now. You must ride your emotional wave over
          time before gaining clarity.

          Never make major decisions at the peak of enthusiasm or the pit of despair. Wait until you
          reach emotional neutrality. This might take hours, days, or weeks depending on the decision.

          Over time, you develop confidence in making decisions from clarity rather than volatility.
        `,
        practice: 'Sleep on major decisions. Check how you feel at different points in your emotional cycle before committing.'
      },
      {
        name: 'Sacral Authority',
        percentage: '~35% of people',
        center: 'Sacral',
        description: `
          Sacral Authority belongs to Generators and Manifesting Generators with an undefined Solar Plexus.
          The Sacral responds in the moment through sounds and body sensations: a gut "yes" (uh-huh) or
          "no" (uh-uh).

          The key is responding to something external: a question, an opportunity, a stimulus. The Sacral
          doesn't initiate; it responds. The response is visceral, often happening before conscious thought.

          Practice with yes/no questions to develop trust in your Sacral response.
        `,
        practice: 'Have someone ask you yes/no questions and notice your gut response before your mind thinks.'
      },
      {
        name: 'Splenic Authority',
        percentage: '~11% of people',
        center: 'Spleen',
        description: `
          Splenic Authority is spontaneous knowing in the moment, survival instinct refined into intuition.
          It only speaks once, quietly, and won't repeat itself.

          This is body intelligence about what's healthy, safe, or correct for you right now. It's not
          emotional and not reasoned: it's instantaneous knowing that needs immediate trust.

          The challenge is that the mind often overrides this quiet knowing. Splenic Authority requires
          learning to trust subtle body signals in real-time.
        `,
        practice: 'Notice quiet knowing in the moment. Act on first instinct before the mind can interfere.'
      },
      {
        name: 'Ego/Heart Authority',
        percentage: '~1% of people',
        center: 'Heart/Ego',
        description: `
          Ego Authority is rare, found in Projectors and Manifestors with a defined Heart center but
          undefined Solar Plexus, Sacral, and Spleen.

          This authority asks: "Do I have the will for this? Do I truly want this?" Listen to what you
          spontaneously say: "I want," "I don't want." Your willpower knows.

          This isn't about being selfish; it's about recognizing that you can only sustain what you
          genuinely have the heart for.
        `,
        practice: 'Listen to your spontaneous statements about what you want or don\'t want.'
      },
      {
        name: 'Self-Projected Authority',
        percentage: '~2.8% of people',
        center: 'G Center to Throat',
        description: `
          Self-Projected Authority belongs to Projectors with the G Center connected to the Throat but
          no inner authority from Emotional, Sacral, Splenic, or Ego centers.

          Your truth comes through speaking and hearing yourself. You need to talk things through, not to
          get advice, but to hear your own voice expressing what's true for your identity and direction.

          Find trusted sounding boards who can listen without agenda while you discover your truth.
        `,
        practice: 'Talk about decisions with trusted listeners. Notice what feels true as you speak.'
      },
      {
        name: 'Mental/Environmental Authority',
        percentage: '~3% of people',
        center: 'None below Throat',
        description: `
          Mental Projectors have no inner authority below the Throat. Decisions come through talking
          with the right people in the right environment.

          This isn't about others deciding for you: it's about finding the right sounding boards who
          can reflect your truth back to you. The environment matters: certain places and people help
          you find clarity.

          Build a network of trusted advisors, but always remember: they're mirrors, not decision-makers.
        `,
        practice: 'Build a network of sounding boards. Notice how different environments affect your clarity.'
      },
      {
        name: 'Lunar Authority',
        percentage: '~1% of people',
        center: 'None defined',
        description: `
          Reflectors have no consistent authority: their clarity comes through the 28-day lunar cycle.
          As the Moon transits their chart, it activates different energies, giving them a full spectrum
          of perspectives.

          Major decisions should wait a full lunar cycle to sample all the energies. This isn't delay
          tactics: it's allowing your natural process to complete.

          Smaller decisions can use accumulated lunar wisdom, but anything life-changing deserves the
          full cycle.
        `,
        practice: 'Track the Moon through your chart. For major decisions, wait 28 days before committing.'
      }
    ]
  },

  centers: {
    title: 'The Nine Centers',
    subtitle: 'Energy Hubs in Your Design',
    introduction: `
      The nine Centers in Human Design are energy hubs that process different types of life force.
      Each Center has specific biological and psychological functions.

      A DEFINED Center (colored in) means you have consistent access to that energy. It's where you
      influence others and are relatively stable.

      An UNDEFINED Center (white) means you take in and amplify energy from others. These are places
      of wisdom potential, if you don't get lost in the conditioning. You can feel this energy intensely
      but it isn't consistently yours.
    `,
    centerDetails: [
      {
        name: 'Head Center',
        location: 'Top',
        biological: 'Pineal gland',
        function: 'Inspiration and mental pressure',
        defined: 'Consistent pressure to think, inspire others with questions',
        undefined: 'Amplify mental pressure from others, can get lost trying to answer everyone\'s questions',
        notSelf: 'Trying to answer questions that aren\'t yours to answer'
      },
      {
        name: 'Ajna Center',
        location: 'Third Eye',
        biological: 'Pituitary gland',
        function: 'Conceptualization, mental processing',
        defined: 'Fixed way of processing information, consistent mental patterns',
        undefined: 'Flexible thinking, can see multiple perspectives, pressure to appear certain',
        notSelf: 'Pretending to be certain when you\'re not'
      },
      {
        name: 'Throat Center',
        location: 'Throat',
        biological: 'Thyroid and parathyroid',
        function: 'Communication and manifestation',
        defined: 'Consistent voice, fixed mode of expression, ability to manifest',
        undefined: 'Pressure to speak, attention-seeking, inconsistent voice',
        notSelf: 'Speaking or acting to get attention'
      },
      {
        name: 'G Center',
        location: 'Chest/Sternum',
        biological: 'Liver and blood',
        function: 'Identity, love, direction',
        defined: 'Fixed sense of self, consistent direction, know who you are',
        undefined: 'Fluid identity, direction depends on environment, searching for self',
        notSelf: 'Searching for identity and direction, wondering "Who am I?"'
      },
      {
        name: 'Heart/Ego Center',
        location: 'Left of G',
        biological: 'Heart, stomach, gallbladder, thymus',
        function: 'Willpower, self-worth, material world',
        defined: 'Consistent willpower, healthy ego, natural ability to make promises',
        undefined: 'Inconsistent willpower, proving self-worth, making promises you can\'t keep',
        notSelf: 'Trying to prove your worth, making unrealistic commitments'
      },
      {
        name: 'Sacral Center',
        location: 'Lower abdomen',
        biological: 'Ovaries/testes',
        function: 'Life force, sexuality, work capacity',
        defined: 'Sustainable energy for work, Generator or Manifesting Generator',
        undefined: 'No consistent life force, not designed for sustained work, can amplify others\' energy',
        notSelf: 'Not knowing when enough is enough, pushing beyond limits'
      },
      {
        name: 'Solar Plexus Center',
        location: 'Right side, abdomen',
        biological: 'Lungs, kidneys, pancreas, nervous system',
        function: 'Emotions, feelings, desires',
        defined: 'Emotional wave, no truth in the now, emotional depth',
        undefined: 'Amplify others\' emotions, avoid confrontation, emotional empath',
        notSelf: 'Avoiding truth to avoid confrontation'
      },
      {
        name: 'Spleen Center',
        location: 'Left side',
        biological: 'Spleen, lymphatic system',
        function: 'Intuition, health, survival instinct, time',
        defined: 'Consistent intuition, body awareness, instinctive knowing',
        undefined: 'Hold onto unhealthy patterns, ignore body signals, fear-based conditioning',
        notSelf: 'Holding onto things that aren\'t good for you'
      },
      {
        name: 'Root Center',
        location: 'Bottom',
        biological: 'Adrenal glands',
        function: 'Adrenaline, stress, drive, momentum',
        defined: 'Consistent way of handling stress, steady drive',
        undefined: 'Amplify stress and pressure, rushing to be free of pressure',
        notSelf: 'Rushing to be free of pressure that isn\'t yours'
      }
    ]
  },

  profile: {
    title: 'The 12 Profiles',
    subtitle: 'Your Costume in Life',
    introduction: `
      Profile describes the role you play in the movie of your life: your costume, your way of engaging.
      It's derived from the Lines (1-6) of your Conscious Sun (Personality) and Unconscious Sun (Design).

      The first number is your conscious, more accessible role. The second number is your unconscious,
      more hidden role. Together they create your unique way of being.
    `,
    lines: [
      { number: 1, name: 'Investigator', theme: 'Foundation through research', description: 'Needs to investigate and build a secure foundation of knowledge.' },
      { number: 2, name: 'Hermit', theme: 'Natural talent called out', description: 'Has natural gifts but must be called out by others to share them.' },
      { number: 3, name: 'Martyr', theme: 'Trial and error', description: 'Learns through experience and mistakes. Must bond with what works.' },
      { number: 4, name: 'Opportunist', theme: 'Externalization through network', description: 'Influence comes through personal network and relationships.' },
      { number: 5, name: 'Heretic', theme: 'Practical universal solutions', description: 'Projected upon as savior or blamed as heretic. Practical problem-solver.' },
      { number: 6, name: 'Role Model', theme: 'Three-part life process', description: 'Lives three life stages: 0-30 (trial), 30-50 (retreat), 50+ (wisdom).' }
    ],
    profiles: [
      { profile: '1/3', name: 'Investigator/Martyr', description: 'Researches thoroughly, then learns through trial and error.' },
      { profile: '1/4', name: 'Investigator/Opportunist', description: 'Builds knowledge base, shares through network.' },
      { profile: '2/4', name: 'Hermit/Opportunist', description: 'Natural talent shared through close relationships.' },
      { profile: '2/5', name: 'Hermit/Heretic', description: 'Called out to provide practical solutions.' },
      { profile: '3/5', name: 'Martyr/Heretic', description: 'Learns through mistakes, becomes practical expert.' },
      { profile: '3/6', name: 'Martyr/Role Model', description: 'Deep experiential learning that becomes wisdom with age.' },
      { profile: '4/6', name: 'Opportunist/Role Model', description: 'Influential in network, becomes wise observer.' },
      { profile: '4/1', name: 'Opportunist/Investigator', description: 'Networks based on investigated foundations.' },
      { profile: '5/1', name: 'Heretic/Investigator', description: 'Practical solutions built on deep research.' },
      { profile: '5/2', name: 'Heretic/Hermit', description: 'Called to solve problems with natural talent.' },
      { profile: '6/2', name: 'Role Model/Hermit', description: 'Wisdom emerges naturally, must be called out.' },
      { profile: '6/3', name: 'Role Model/Martyr', description: 'Extensive experiential learning becomes role model wisdom.' }
    ]
  },

  gates: {
    title: 'Gates and Channels',
    subtitle: 'The I Ching Within Your Design',
    introduction: `
      Human Design incorporates all 64 hexagrams of the I Ching as Gates positioned around the nine Centers.
      When both Gates that form a Channel are defined (either in your chart or through transits),
      the Channel activates, connecting two Centers and creating a fixed way of being.

      Your defined Gates and Channels reveal your consistent energies, themes, and gifts.
    `,
    structure: `
      Each Gate has 6 Lines (corresponding to the 6 lines of an I Ching hexagram), and each Line
      has Color, Tone, and Base subdivisions. This creates enormous specificity: no two charts are alike.

      The 64 Gates pair into 36 Channels:
      - Format channels create foundation
      - Generated channels produce life force
      - Manifested channels initiate action
      - Projected channels guide and advise
    `
  },

  incarnationCross: {
    title: 'The Incarnation Cross',
    subtitle: 'Your Life Purpose Theme',
    introduction: `
      Your Incarnation Cross represents your life purpose or theme: not what you DO, but the energetic
      backdrop of your life. It's calculated from the Gates of your Personality and Design Sun and Earth.

      There are 192 base Incarnation Crosses, each with a name and theme. These are further divided
      by the specific Lines involved, creating immense variety.

      Important: You don't "achieve" your Incarnation Cross. You live it naturally when operating
      correctly according to your Strategy and Authority. It's a description, not a prescription.
    `,
    quarters: [
      { name: 'Initiation', theme: 'Mind', description: 'Crosses concerned with mental development and understanding' },
      { name: 'Civilization', theme: 'Form', description: 'Crosses concerned with building and sustaining society' },
      { name: 'Duality', theme: 'Bonding', description: 'Crosses concerned with relationships and connection' },
      { name: 'Mutation', theme: 'Transformation', description: 'Crosses concerned with change and evolution' }
    ]
  },

  experiment: {
    title: 'The Experiment',
    subtitle: 'Living Your Design',
    content: `
      Human Design is an experiment, not a belief system. Ra Uru Hu always emphasized that you should
      never believe anything: test it for yourself.

      The basic experiment is simple: follow your Strategy and Authority for decision-making for at least
      7 years (a full cellular cycle). Notice what changes when you operate correctly versus from conditioning.

      Signs you're living your design:
      - Generators feel satisfied with their work
      - Projectors feel successful and recognized
      - Manifestors feel peace after informing
      - Reflectors feel surprised by life's variety
    `,
    practicalSteps: [
      'Get your accurate chart (birth time is essential)',
      'Learn your Type, Strategy, and Authority',
      'Start using your Strategy for decisions',
      'Notice your Not-Self themes when they arise',
      'Track your experience over time',
      'Go deeper into Centers, Profile, and Channels as you\'re ready'
    ]
  }
}

// ============================================================================
// ASTROLOGY DOCUMENTATION
// ============================================================================

export const astrologyDocs = {
  overview: {
    title: 'Astrology: The Cosmic Language',
    subtitle: 'Understanding the Celestial Influence on Human Experience',
    introduction: `
      Astrology is humanity's oldest system for understanding the relationship between celestial
      patterns and earthly events. Dating back at least 4,000 years to ancient Mesopotamia, it has
      been refined by every major civilization: Babylonian, Egyptian, Greek, Persian, Arabic, Indian,
      and Chinese.

      Western astrology, which Pleiad primarily uses, is based on the tropical zodiac: the relationship
      between the Sun's position and Earth's seasons. Your natal chart is a snapshot of the sky at
      your exact moment of birth, seen from your birthplace, a cosmic fingerprint unique to you.

      Modern astrology is psychological and archetypal, focusing on self-understanding and growth
      rather than fate prediction. The planets describe parts of your psyche; the signs describe
      how they express; the houses describe where in life they manifest.
    `
  },

  bigThree: {
    title: 'The Big Three',
    subtitle: 'Sun, Moon, and Rising',
    introduction: `
      Most people know their Sun sign, but your complete personality requires understanding
      at least three placements: Sun, Moon, and Rising (Ascendant).
    `,
    placements: [
      {
        name: 'Sun Sign',
        represents: 'Core identity, ego, life purpose',
        question: 'Who am I at my core? What am I here to develop?',
        description: `
          Your Sun sign represents your fundamental essence: the central organizing principle of your
          personality. It's what you're growing into and developing throughout life. The Sun is your
          vitality, your will, your conscious self-expression.
        `
      },
      {
        name: 'Moon Sign',
        represents: 'Emotional nature, instincts, inner self',
        question: 'What do I need to feel safe? How do I process emotions?',
        description: `
          Your Moon sign reveals your emotional operating system: how you feel, what you need for
          security, your instinctive reactions. The Moon represents your private self, your relationship
          with nurturing, and your automatic emotional patterns.
        `
      },
      {
        name: 'Rising Sign (Ascendant)',
        represents: 'First impression, persona, physical appearance',
        question: 'How do I approach the world? What do people see first?',
        description: `
          Your Rising sign is the zodiac sign that was rising on the eastern horizon at your birth.
          It determines your chart's entire house structure. The Ascendant represents your approach
          to life, your persona, and often influences physical appearance and style.
        `
      }
    ]
  },

  signs: {
    title: 'The 12 Zodiac Signs',
    subtitle: 'Archetypes of Expression',
    introduction: `
      The twelve zodiac signs represent different archetypes or modes of expression. They're organized
      by Element (Fire, Earth, Air, Water) and Modality (Cardinal, Fixed, Mutable).
    `,
    elements: [
      {
        name: 'Fire',
        signs: ['Aries', 'Leo', 'Sagittarius'],
        qualities: 'Action, enthusiasm, inspiration, will',
        shadow: 'Impatience, ego, burnout'
      },
      {
        name: 'Earth',
        signs: ['Taurus', 'Virgo', 'Capricorn'],
        qualities: 'Practicality, stability, material reality, patience',
        shadow: 'Stubbornness, materialism, rigidity'
      },
      {
        name: 'Air',
        signs: ['Gemini', 'Libra', 'Aquarius'],
        qualities: 'Intellect, communication, ideas, connection',
        shadow: 'Detachment, overthinking, superficiality'
      },
      {
        name: 'Water',
        signs: ['Cancer', 'Scorpio', 'Pisces'],
        qualities: 'Emotion, intuition, depth, sensitivity',
        shadow: 'Moodiness, overwhelm, escapism'
      }
    ],
    modalities: [
      {
        name: 'Cardinal',
        signs: ['Aries', 'Cancer', 'Libra', 'Capricorn'],
        quality: 'Initiating energy: starts new cycles, leadership, action-oriented'
      },
      {
        name: 'Fixed',
        signs: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
        quality: 'Stabilizing energy: maintains, persists, concentrated and determined'
      },
      {
        name: 'Mutable',
        signs: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces'],
        quality: 'Adapting energy: transitions, flexibility, disseminates and changes'
      }
    ],
    signDetails: [
      { sign: 'Aries', dates: 'Mar 21 - Apr 19', ruler: 'Mars', symbol: '♈', keywords: ['courage', 'initiative', 'independence', 'pioneer'] },
      { sign: 'Taurus', dates: 'Apr 20 - May 20', ruler: 'Venus', symbol: '♉', keywords: ['stability', 'pleasure', 'values', 'persistence'] },
      { sign: 'Gemini', dates: 'May 21 - Jun 20', ruler: 'Mercury', symbol: '♊', keywords: ['curiosity', 'communication', 'versatility', 'wit'] },
      { sign: 'Cancer', dates: 'Jun 21 - Jul 22', ruler: 'Moon', symbol: '♋', keywords: ['nurturing', 'protection', 'emotion', 'home'] },
      { sign: 'Leo', dates: 'Jul 23 - Aug 22', ruler: 'Sun', symbol: '♌', keywords: ['creativity', 'pride', 'self-expression', 'leadership'] },
      { sign: 'Virgo', dates: 'Aug 23 - Sep 22', ruler: 'Mercury', symbol: '♍', keywords: ['analysis', 'service', 'health', 'refinement'] },
      { sign: 'Libra', dates: 'Sep 23 - Oct 22', ruler: 'Venus', symbol: '♎', keywords: ['harmony', 'partnership', 'justice', 'beauty'] },
      { sign: 'Scorpio', dates: 'Oct 23 - Nov 21', ruler: 'Pluto/Mars', symbol: '♏', keywords: ['transformation', 'intensity', 'depth', 'power'] },
      { sign: 'Sagittarius', dates: 'Nov 22 - Dec 21', ruler: 'Jupiter', symbol: '♐', keywords: ['expansion', 'philosophy', 'adventure', 'truth'] },
      { sign: 'Capricorn', dates: 'Dec 22 - Jan 19', ruler: 'Saturn', symbol: '♑', keywords: ['ambition', 'structure', 'achievement', 'mastery'] },
      { sign: 'Aquarius', dates: 'Jan 20 - Feb 18', ruler: 'Uranus/Saturn', symbol: '♒', keywords: ['innovation', 'humanity', 'individuality', 'future'] },
      { sign: 'Pisces', dates: 'Feb 19 - Mar 20', ruler: 'Neptune/Jupiter', symbol: '♓', keywords: ['compassion', 'intuition', 'transcendence', 'imagination'] }
    ]
  },

  planets: {
    title: 'The Planets',
    subtitle: 'Psychological Functions in Your Chart',
    introduction: `
      Each planet represents a psychological function or drive. The sign a planet is in describes
      HOW that function expresses. The house shows WHERE in life it manifests.
    `,
    categories: [
      {
        name: 'Luminaries',
        description: 'Core identity functions',
        planets: ['Sun', 'Moon']
      },
      {
        name: 'Personal Planets',
        description: 'Day-to-day personality',
        planets: ['Mercury', 'Venus', 'Mars']
      },
      {
        name: 'Social Planets',
        description: 'Social roles and growth',
        planets: ['Jupiter', 'Saturn']
      },
      {
        name: 'Transpersonal Planets',
        description: 'Generational and transformative',
        planets: ['Uranus', 'Neptune', 'Pluto']
      }
    ],
    planetDetails: [
      { name: 'Sun', symbol: '☉', function: 'Core identity, ego, vitality', cycle: '1 year', keywords: ['self', 'will', 'consciousness', 'father'] },
      { name: 'Moon', symbol: '☽', function: 'Emotions, instincts, needs', cycle: '28 days', keywords: ['feelings', 'mother', 'habits', 'security'] },
      { name: 'Mercury', symbol: '☿', function: 'Communication, thinking, learning', cycle: '88 days', keywords: ['mind', 'speech', 'perception', 'travel'] },
      { name: 'Venus', symbol: '♀', function: 'Love, beauty, values, pleasure', cycle: '225 days', keywords: ['relationships', 'art', 'money', 'comfort'] },
      { name: 'Mars', symbol: '♂', function: 'Action, desire, aggression, drive', cycle: '2 years', keywords: ['energy', 'sexuality', 'competition', 'courage'] },
      { name: 'Jupiter', symbol: '♃', function: 'Expansion, luck, wisdom, growth', cycle: '12 years', keywords: ['belief', 'opportunity', 'generosity', 'excess'] },
      { name: 'Saturn', symbol: '♄', function: 'Structure, discipline, limits, karma', cycle: '29 years', keywords: ['responsibility', 'time', 'mastery', 'authority'] },
      { name: 'Uranus', symbol: '♅', function: 'Innovation, rebellion, awakening', cycle: '84 years', keywords: ['change', 'freedom', 'technology', 'eccentricity'] },
      { name: 'Neptune', symbol: '♆', function: 'Dreams, illusion, spirituality', cycle: '165 years', keywords: ['imagination', 'compassion', 'dissolution', 'transcendence'] },
      { name: 'Pluto', symbol: '♇', function: 'Transformation, power, death/rebirth', cycle: '248 years', keywords: ['intensity', 'regeneration', 'shadow', 'evolution'] }
    ]
  },

  houses: {
    title: 'The 12 Houses',
    subtitle: 'Areas of Life Experience',
    introduction: `
      The houses divide your chart into 12 life areas. Planets in a house influence that life domain.
      The sign on the house cusp (starting point) colors how you approach that area.

      Houses are calculated from your birth time. Without accurate birth time, house placements
      cannot be determined. This is why birth time is so important in astrology.
    `,
    houseDetails: [
      { number: 1, name: 'House of Self', sign: 'Aries', themes: 'Identity, physical body, first impressions, beginnings', keywords: ['appearance', 'personality', 'approach to life'] },
      { number: 2, name: 'House of Possessions', sign: 'Taurus', themes: 'Money, values, resources, self-worth', keywords: ['finances', 'material security', 'what you value'] },
      { number: 3, name: 'House of Communication', sign: 'Gemini', themes: 'Siblings, local travel, early education, daily mind', keywords: ['learning', 'speaking', 'writing', 'neighbors'] },
      { number: 4, name: 'House of Home', sign: 'Cancer', themes: 'Family, roots, private life, emotional foundation', keywords: ['parents', 'ancestry', 'real estate', 'endings'] },
      { number: 5, name: 'House of Creativity', sign: 'Leo', themes: 'Romance, children, creative expression, play', keywords: ['fun', 'drama', 'speculation', 'hobbies'] },
      { number: 6, name: 'House of Service', sign: 'Virgo', themes: 'Health, work, daily routines, service', keywords: ['habits', 'employees', 'pets', 'self-improvement'] },
      { number: 7, name: 'House of Partnership', sign: 'Libra', themes: 'Marriage, contracts, open enemies, significant others', keywords: ['commitment', 'cooperation', 'legal matters'] },
      { number: 8, name: 'House of Transformation', sign: 'Scorpio', themes: 'Death, rebirth, shared resources, intimacy', keywords: ['inheritance', 'taxes', 'psychology', 'occult'] },
      { number: 9, name: 'House of Philosophy', sign: 'Sagittarius', themes: 'Higher education, long travel, beliefs, publishing', keywords: ['religion', 'law', 'foreign cultures', 'meaning'] },
      { number: 10, name: 'House of Career', sign: 'Capricorn', themes: 'Public image, profession, achievements, authority', keywords: ['reputation', 'status', 'ambition', 'calling'] },
      { number: 11, name: 'House of Community', sign: 'Aquarius', themes: 'Friends, groups, hopes, humanitarian causes', keywords: ['networks', 'goals', 'social change', 'technology'] },
      { number: 12, name: 'House of the Unconscious', sign: 'Pisces', themes: 'Hidden matters, karma, spirituality, self-undoing', keywords: ['secrets', 'isolation', 'institutions', 'dreams'] }
    ]
  },

  aspects: {
    title: 'Planetary Aspects',
    subtitle: 'Conversations Between Planets',
    introduction: `
      Aspects are specific angular relationships between planets that create dynamic interactions.
      Some aspects are harmonious (energy flows easily), others are challenging (energy creates friction).

      Challenging aspects aren't "bad": they often drive growth and achievement. Harmonious aspects
      aren't always "good": they can indicate areas of complacency.
    `,
    majorAspects: [
      { name: 'Conjunction', symbol: '☌', angle: '0°', orb: '8-10°', nature: 'Blending', description: 'Planets merge their energies: intensification for better or worse' },
      { name: 'Opposition', symbol: '☍', angle: '180°', orb: '8-10°', nature: 'Challenging', description: 'Planets face each other: awareness through polarity and projection' },
      { name: 'Square', symbol: '□', angle: '90°', orb: '6-8°', nature: 'Challenging', description: 'Planets in tension: friction that motivates action and growth' },
      { name: 'Trine', symbol: '△', angle: '120°', orb: '6-8°', nature: 'Harmonious', description: 'Planets in same element: easy flow, natural talent, possible complacency' },
      { name: 'Sextile', symbol: '⚹', angle: '60°', orb: '4-6°', nature: 'Harmonious', description: 'Planets in compatible elements: opportunity requiring activation' }
    ],
    minorAspects: [
      { name: 'Semi-sextile', angle: '30°', nature: 'Minor tension', description: 'Adjacent signs: slight friction, adjustment needed' },
      { name: 'Quincunx', angle: '150°', nature: 'Adjustment', description: 'No common ground: requires creative adaptation' },
      { name: 'Semi-square', angle: '45°', nature: 'Minor challenge', description: 'Internal friction: irritation that builds character' },
      { name: 'Sesquiquadrate', angle: '135°', nature: 'Minor challenge', description: 'External friction: frustration with circumstances' }
    ]
  },

  interpretation: {
    title: 'Reading Your Chart',
    subtitle: 'Synthesis and Interpretation',
    steps: [
      { step: 1, title: 'Overall Balance', description: 'Count elements and modalities. Where is emphasis? What\'s missing?' },
      { step: 2, title: 'The Big Three', description: 'Analyze Sun, Moon, and Rising for core personality structure.' },
      { step: 3, title: 'Personal Planets', description: 'Mercury, Venus, Mars in signs and houses for daily expression.' },
      { step: 4, title: 'Major Aspects', description: 'Look at tight aspects first: they\'re most influential.' },
      { step: 5, title: 'House Rulers', description: 'Which planet rules which house? Where does it sit?' },
      { step: 6, title: 'Patterns', description: 'Grand trines, T-squares, stelliums, and other configurations.' },
      { step: 7, title: 'Synthesis', description: 'Weave themes together into a coherent narrative.' }
    ]
  }
}

// ============================================================================
// GEMATRIA DOCUMENTATION
// ============================================================================

export const gematriaDocs = {
  overview: {
    title: 'Gematria: Hebrew Letter Numerology',
    subtitle: 'Revealing Hidden Connections Through Number',
    introduction: `
      Gematria is an alphanumeric cipher system that assigns numerical values to Hebrew letters,
      words, and phrases. It's one of the primary interpretive tools in Kabbalah (Jewish mysticism),
      used to uncover hidden meanings and connections in sacred texts.

      The premise is profound: when two words or phrases have the same numerical value, they share
      a deep relationship, a hidden equivalence that reveals spiritual truth. Through gematria,
      the Hebrew Bible becomes a multidimensional text, with layers of meaning encoded in numbers.

      Beyond religious study, gematria offers a lens for understanding your Hebrew name as a
      numerical signature that connects to cosmic patterns.
    `
  },

  hebrewAlphabet: {
    title: 'The 22 Hebrew Letters',
    subtitle: 'Vehicles of Creation',
    introduction: `
      According to Kabbalah, the 22 Hebrew letters are not mere symbols but vehicles of divine
      creation. The Sefer Yetzirah (Book of Formation) teaches that God created the universe
      through combinations of these letters: they are the building blocks of reality.

      Each letter carries three dimensions:
      - A numerical value (gematria)
      - A symbolic meaning (based on its name and shape)
      - A sound (phonetic quality)
    `,
    letters: [
      { letter: 'א', name: 'Aleph', value: 1, meaning: 'Ox, strength', element: 'Air', description: 'Silent letter representing divine breath and unity' },
      { letter: 'ב', name: 'Bet', value: 2, meaning: 'House', planet: 'Saturn', description: 'The container of creation, duality begins' },
      { letter: 'ג', name: 'Gimel', value: 3, meaning: 'Camel', planet: 'Jupiter', description: 'The bridge, beneficence, reward' },
      { letter: 'ד', name: 'Dalet', value: 4, meaning: 'Door', planet: 'Mars', description: 'The doorway, poverty and humility' },
      { letter: 'ה', name: 'He', value: 5, meaning: 'Window', sign: 'Aries', description: 'Divine breath, revelation' },
      { letter: 'ו', name: 'Vav', value: 6, meaning: 'Hook, nail', sign: 'Taurus', description: 'Connection between heaven and earth' },
      { letter: 'ז', name: 'Zayin', value: 7, meaning: 'Sword, weapon', sign: 'Gemini', description: 'The power of discernment' },
      { letter: 'ח', name: 'Chet', value: 8, meaning: 'Fence', sign: 'Cancer', description: 'Life, enclosure, grace' },
      { letter: 'ט', name: 'Tet', value: 9, meaning: 'Serpent', sign: 'Leo', description: 'Hidden good, coiled potential' },
      { letter: 'י', name: 'Yod', value: 10, meaning: 'Hand', sign: 'Virgo', description: 'The point of creation, divine spark' },
      { letter: 'כ', name: 'Kaf', value: 20, meaning: 'Palm', planet: 'Sun', description: 'Container of blessing, crown' },
      { letter: 'ל', name: 'Lamed', value: 30, meaning: 'Ox goad', sign: 'Libra', description: 'Learning, teaching, aspiration' },
      { letter: 'מ', name: 'Mem', value: 40, meaning: 'Water', element: 'Water', description: 'The revealed and hidden, mother' },
      { letter: 'נ', name: 'Nun', value: 50, meaning: 'Fish', sign: 'Scorpio', description: 'Continuity, the soul, falling and rising' },
      { letter: 'ס', name: 'Samekh', value: 60, meaning: 'Support, prop', sign: 'Sagittarius', description: 'Support, cyclicality, trust' },
      { letter: 'ע', name: 'Ayin', value: 70, meaning: 'Eye', sign: 'Capricorn', description: 'Perception, the void, providence' },
      { letter: 'פ', name: 'Pe', value: 80, meaning: 'Mouth', planet: 'Venus', description: 'Speech, expression, breath' },
      { letter: 'צ', name: 'Tsade', value: 90, meaning: 'Fish hook', sign: 'Aquarius', description: 'The righteous one, hunting' },
      { letter: 'ק', name: 'Qof', value: 100, meaning: 'Back of head', sign: 'Pisces', description: 'The back of consciousness, holiness' },
      { letter: 'ר', name: 'Resh', value: 200, meaning: 'Head', planet: 'Mercury', description: 'Beginning, process, wickedness transformed' },
      { letter: 'ש', name: 'Shin', value: 300, meaning: 'Tooth', element: 'Fire', description: 'Divine fire, transformation, trinity' },
      { letter: 'ת', name: 'Tav', value: 400, meaning: 'Mark, cross', planet: 'Moon', description: 'Seal, completion, truth' }
    ],
    finalForms: [
      { letter: 'ך', name: 'Kaf Sofit', value: 500 },
      { letter: 'ם', name: 'Mem Sofit', value: 600 },
      { letter: 'ן', name: 'Nun Sofit', value: 700 },
      { letter: 'ף', name: 'Pe Sofit', value: 800 },
      { letter: 'ץ', name: 'Tsade Sofit', value: 900 }
    ]
  },

  methods: {
    title: 'Calculation Methods',
    subtitle: 'Different Lenses for Number',
    introduction: `
      Gematria isn't a single system but a family of methods, each revealing different dimensions
      of a word's numerical essence.
    `,
    methodDetails: [
      {
        name: 'Mispar Hechrachi (Standard)',
        description: 'The basic method using standard letter values (1-400)',
        example: 'שָׁלוֹם (Shalom) = 300 + 30 + 6 + 40 = 376',
        use: 'Most common method for finding equivalences'
      },
      {
        name: 'Mispar Gadol (Full)',
        description: 'Final letters use extended values (500-900)',
        example: 'Final Mem (ם) = 600 instead of 40',
        use: 'Reveals different connections, especially in names'
      },
      {
        name: 'Mispar Katan (Small)',
        description: 'Reduce each letter to single digit (ignore tens and hundreds)',
        example: 'Shin (300) → 3, Mem (40) → 4',
        use: 'Quick pattern recognition, essential quality'
      },
      {
        name: 'Mispar Siduri (Ordinal)',
        description: 'Letters valued by position (1-22)',
        example: 'Aleph = 1, Bet = 2... Tav = 22',
        use: 'Sequential relationships, simpler calculations'
      },
      {
        name: 'AtBash',
        description: 'Cipher: first letter swaps with last, etc.',
        example: 'Aleph ↔ Tav, Bet ↔ Shin',
        use: 'Hidden meanings, transformation of concepts'
      },
      {
        name: 'Mispar Katan Mispari',
        description: 'Sum then reduce to single digit (digital root)',
        example: '376 → 3+7+6 = 16 → 1+6 = 7',
        use: 'Essential vibration of a number'
      },
      {
        name: 'Mispar Kolel',
        description: 'Standard value + number of letters',
        example: 'שָׁלוֹם = 376 + 4 (letters) = 380',
        use: 'Accounts for the "wholeness" of the word'
      }
    ]
  },

  significantNumbers: {
    title: 'Significant Numbers in Tradition',
    subtitle: 'Numbers with Deep Meaning',
    numbers: [
      { value: 1, hebrew: 'אחד', word: 'Echad', meaning: 'One', significance: 'Unity, God\'s oneness' },
      { value: 13, hebrew: 'אחד/אהבה', word: 'Echad/Ahavah', meaning: 'One/Love', significance: 'Both words equal 13, showing love leads to unity' },
      { value: 18, hebrew: 'חי', word: 'Chai', meaning: 'Life', significance: 'The most auspicious number, gifts often given in multiples of 18' },
      { value: 26, hebrew: 'יהוה', word: 'YHVH', meaning: 'The Name', significance: 'The Tetragrammaton, God\'s ineffable name' },
      { value: 32, hebrew: 'לב', word: 'Lev', meaning: 'Heart', significance: '32 paths of wisdom in Kabbalah' },
      { value: 40, hebrew: 'מ', word: 'Mem', meaning: 'Water', significance: 'Transformation period (40 days, 40 years)' },
      { value: 50, hebrew: 'נ', word: 'Nun', meaning: 'Fish', significance: 'Gates of understanding, jubilee' },
      { value: 72, hebrew: '', word: 'Various', meaning: 'The 72 Names', significance: '72 three-letter names of God from Exodus' },
      { value: 86, hebrew: 'אלהים', word: 'Elohim', meaning: 'God (as Nature)', significance: 'Same value as הטבע (nature)' },
      { value: 137, hebrew: 'קבלה', word: 'Kabbalah', meaning: 'Reception', significance: 'Also the fine-structure constant in physics' },
      { value: 248, hebrew: '', word: 'Various', meaning: 'Positive commandments', significance: 'Number of bones in the body, positive mitzvot' },
      { value: 358, hebrew: 'משיח/נחש', word: 'Mashiach/Nachash', meaning: 'Messiah/Serpent', significance: 'Identical value shows redemption through transformation' },
      { value: 365, hebrew: '', word: 'Various', meaning: 'Negative commandments', significance: 'Days of solar year, prohibitive mitzvot' },
      { value: 541, hebrew: 'ישראל', word: 'Israel', meaning: 'One who wrestles with God', significance: 'The name given to Jacob' },
      { value: 611, hebrew: 'תורה', word: 'Torah', meaning: 'Teaching', significance: 'The five books, plus 2 commandments = 613' }
    ]
  },

  practicalApplication: {
    title: 'Working with Your Name',
    subtitle: 'Personal Gematria Practice',
    content: `
      Your Hebrew name is your spiritual identifier, a numerical signature that connects you to
      cosmic patterns. Analyzing your name through gematria can reveal:

      - Your essential numerical vibration
      - Words and concepts that share your number
      - Hidden connections to biblical figures or concepts
      - Your name's digital root (1-9) essence
    `,
    steps: [
      { step: 1, instruction: 'Get your Hebrew name correctly spelled (consult a knowledgeable source if unsure)' },
      { step: 2, instruction: 'Calculate using standard method (Mispar Hechrachi)' },
      { step: 3, instruction: 'Find the digital root for essential vibration' },
      { step: 4, instruction: 'Search for words/phrases with the same value' },
      { step: 5, instruction: 'Meditate on the connections you discover' }
    ],
    example: `
      Name: דָּוִד (David)
      Calculation: Dalet (4) + Vav (6) + Dalet (4) = 14
      Digital root: 1 + 4 = 5

      The name David equals 14, the same as יד (yad, "hand") and אהב (ahav, "loved").
      The digital root 5 corresponds to the letter He (ה), representing divine breath and revelation.
    `
  },

  kabbalisticContext: {
    title: 'Gematria in Kabbalah',
    subtitle: 'The Mystical Framework',
    content: `
      Gematria is one of several interpretive methods in Jewish exegesis (PaRDeS):

      - Peshat: The literal meaning
      - Remez: The hint or allegory
      - Derash: The interpretive meaning
      - Sod: The secret/mystical meaning (where gematria lives)

      In Kabbalistic thought, Hebrew letters are more than symbols: they are spiritual forces
      through which creation occurred. The Sefer Yetzirah describes how God formed the universe
      through 22 letters and 10 sefirot (divine attributes), making 32 paths of wisdom.

      Gematria becomes a tool for understanding these mystical connections, revealing how
      seemingly unrelated concepts are actually unified at a deeper level.
    `,
    sefirot: [
      { number: 1, name: 'Keter', meaning: 'Crown', description: 'Divine will, above comprehension' },
      { number: 2, name: 'Chokhmah', meaning: 'Wisdom', description: 'First flash of insight' },
      { number: 3, name: 'Binah', meaning: 'Understanding', description: 'Processing and analyzing' },
      { number: 4, name: 'Chesed', meaning: 'Loving-kindness', description: 'Expansive love' },
      { number: 5, name: 'Gevurah', meaning: 'Strength', description: 'Restraint and judgment' },
      { number: 6, name: 'Tiferet', meaning: 'Beauty', description: 'Harmonizing balance' },
      { number: 7, name: 'Netzach', meaning: 'Victory', description: 'Endurance and persistence' },
      { number: 8, name: 'Hod', meaning: 'Splendor', description: 'Humility and gratitude' },
      { number: 9, name: 'Yesod', meaning: 'Foundation', description: 'Connection and transmission' },
      { number: 10, name: 'Malkhut', meaning: 'Kingdom', description: 'Physical manifestation' }
    ]
  }
}

// ============================================================================
// TZOLKIN (TRADITIONAL) DOCUMENTATION
// ============================================================================

export const tzolkinDocs = {
  overview: {
    title: 'Traditional Tzolkin',
    subtitle: 'The Living Maya Calendar',
    introduction: `
      The Tzolkin (from Yucatec Maya: tsol meaning "count" and k\'in meaning "day") is the 260-day
      sacred calendar that has been used continuously by Maya peoples for over 2,500 years. Unlike
      Dreamspell, which is a modern reinterpretation, the traditional Tzolkin is still kept by
      Maya daykeepers (Aj Q\'ijab\') in Guatemala and surrounding regions.

      The Tzolkin consists of 20 day names (nawales) combined with 13 numbers, creating 260 unique
      day-sign combinations. This count has never been broken: Maya daykeepers have maintained it
      across centuries of colonization and cultural suppression.

      Important: The traditional Tzolkin and Dreamspell use different correlation systems, meaning
      the same calendar date will show different signs in each system. Neither is "wrong": they are
      parallel traditions with different purposes and origins.
    `
  },

  differences: {
    title: 'Tzolkin vs. Dreamspell',
    comparison: [
      { aspect: 'Origin', tzolkin: 'Ancient Maya tradition, 2500+ years old', dreamspell: 'Created by José Argüelles in 1987' },
      { aspect: 'Day Count', tzolkin: 'Unbroken count maintained by daykeepers', dreamspell: 'Calculated using different correlation' },
      { aspect: 'Names', tzolkin: 'Nawales in Kiche/Yucatec Maya', dreamspell: 'English names (Dragon, Wind, etc.)' },
      { aspect: 'Purpose', tzolkin: 'Divination, ceremony, life guidance', dreamspell: 'Global synchronization, planetary healing' },
      { aspect: 'Leap Days', tzolkin: 'Counts every day including Feb 29', dreamspell: 'Treats Feb 29 as "day out of time"' },
      { aspect: 'Authority', tzolkin: 'Maya elders and daykeepers', dreamspell: 'Foundation for the Law of Time' }
    ]
  },

  nawales: {
    title: 'The 20 Nawales',
    subtitle: 'Day Signs of the Traditional Count',
    introduction: `
      The 20 nawales are energetic archetypes that govern each day. Each nawal has animal associations,
      directional correspondences, and specific gifts and challenges.
    `,
    dayNames: [
      { number: 1, yucatec: 'Imix', kiche: 'Imox', meaning: 'Crocodile, Water Lily', direction: 'East', quality: 'Primordial waters, the unconscious, earth mother' },
      { number: 2, yucatec: 'Ik', kiche: 'Iq\'', meaning: 'Wind, Breath', direction: 'North', quality: 'Life force, spirit, communication' },
      { number: 3, yucatec: 'Akbal', kiche: 'Aq\'ab\'al', meaning: 'Night, House', direction: 'West', quality: 'Darkness, dawn, introspection' },
      { number: 4, yucatec: 'Kan', kiche: 'K\'at', meaning: 'Net, Lizard', direction: 'South', quality: 'Harvest, abundance, entanglement' },
      { number: 5, yucatec: 'Chicchan', kiche: 'Kan', meaning: 'Serpent', direction: 'East', quality: 'Life force, kundalini, wisdom' },
      { number: 6, yucatec: 'Cimi', kiche: 'Kame', meaning: 'Death, Transformer', direction: 'North', quality: 'Ancestors, transformation, rebirth' },
      { number: 7, yucatec: 'Manik', kiche: 'Kej', meaning: 'Deer, Hand', direction: 'West', quality: 'Leadership, forest guardians, healing' },
      { number: 8, yucatec: 'Lamat', kiche: 'Q\'anil', meaning: 'Star, Seed', direction: 'South', quality: 'Fertility, ripeness, abundance' },
      { number: 9, yucatec: 'Muluc', kiche: 'Toj', meaning: 'Water, Offering', direction: 'East', quality: 'Emotions, payment, rain' },
      { number: 10, yucatec: 'Oc', kiche: 'Tz\'i\'', meaning: 'Dog', direction: 'North', quality: 'Loyalty, law, guidance' },
      { number: 11, yucatec: 'Chuen', kiche: 'B\'atz\'', meaning: 'Monkey, Thread', direction: 'West', quality: 'Weaving, time, artistry' },
      { number: 12, yucatec: 'Eb', kiche: 'E', meaning: 'Road, Grass', direction: 'South', quality: 'Life path, destiny, travel' },
      { number: 13, yucatec: 'Ben', kiche: 'Aj', meaning: 'Reed, Corn', direction: 'East', quality: 'Authority, home, family' },
      { number: 14, yucatec: 'Ix', kiche: 'I\'x', meaning: 'Jaguar', direction: 'North', quality: 'Earth force, feminine, mystery' },
      { number: 15, yucatec: 'Men', kiche: 'Tz\'ikin', meaning: 'Eagle', direction: 'West', quality: 'Vision, messenger, fortune' },
      { number: 16, yucatec: 'Cib', kiche: 'Ajmaq', meaning: 'Owl, Vulture', direction: 'South', quality: 'Ancestors, forgiveness, wisdom' },
      { number: 17, yucatec: 'Caban', kiche: 'No\'j', meaning: 'Earth, Movement', direction: 'East', quality: 'Knowledge, ideas, movement' },
      { number: 18, yucatec: 'Etznab', kiche: 'Tijax', meaning: 'Flint, Mirror', direction: 'North', quality: 'Obsidian, cutting, healing' },
      { number: 19, yucatec: 'Cauac', kiche: 'Kawoq', meaning: 'Storm, Rain', direction: 'West', quality: 'Thunder, family, fertility' },
      { number: 20, yucatec: 'Ahau', kiche: 'Ajpu', meaning: 'Lord, Sun', direction: 'South', quality: 'Light, heroism, completion' }
    ]
  },

  thirteenNumbers: {
    title: 'The 13 Numbers',
    subtitle: 'The Trecena Count',
    content: `
      The numbers 1-13 cycle with the 20 day names to create the 260-day round. Each number carries
      energy that modifies the day sign:

      1 - Beginning, unity, potential
      2 - Duality, decision, partnership
      3 - Action, movement, creativity
      4 - Stability, foundation, the four directions
      5 - Center, empowerment, the human form (5 extremities)
      6 - Flow, equilibrium, receptivity
      7 - Culmination, reflection, completion of a cycle
      8 - Harmony, justice, infinity
      9 - Patience, gestation, feminine power
      10 - Cooperation, community, responsibility
      11 - Resolution, liberation, change
      12 - Understanding, communication, stability before completion
      13 - Transformation, ascension, cosmic consciousness
    `
  },

  ceremonialUse: {
    title: 'Ceremonial Practice',
    subtitle: 'How the Tzolkin is Used Today',
    content: `
      Maya daykeepers use the Tzolkin for:

      - Birth Sign Reading (Cholq\'ij): Calculating a person\'s nawal and number to understand
        their gifts, challenges, and life purpose.

      - Divination: Using the day count along with red beans and crystals to answer questions
        and provide guidance.

      - Ceremony Timing: Certain days are powerful for specific ceremonies (fire ceremonies,
        ancestral veneration, healing rituals).

      - Marriage Compatibility: Comparing the signs of partners to understand their relationship.

      - Agricultural Planning: Traditional farming aligned with auspicious days for planting
        and harvesting.

      The practice is deeply tied to community, ancestral wisdom, and a living relationship with
      the land and cosmos.
    `
  }
}

// ============================================================================
// CROSS-SYSTEM INTEGRATION
// ============================================================================

export const integrationDocs = {
  title: 'Integrating the Systems',
  subtitle: 'Finding Unity in Diversity',
  introduction: `
    Each symbolic system (Dreamspell, Human Design, Astrology, Kabbalah, and Traditional Tzolkin)
    offers a unique lens on identity and purpose. They are not competing truths but complementary
    perspectives, like different instruments in an orchestra.

    Pleiad helps you see yourself through all these lenses simultaneously, finding resonance and
    deeper understanding where the systems align and learning from where they diverge.
  `,

  correspondences: {
    title: 'Points of Correspondence',
    connections: [
      {
        theme: 'Solar Influence',
        systems: [
          { system: 'Astrology', concept: 'Sun sign' },
          { system: 'Dreamspell', concept: 'Yellow Sun seal' },
          { system: 'Human Design', concept: 'Personality Sun gate' },
          { system: 'Kabbalah', concept: 'The letter Kaf (כ), ruled by Sun' }
        ]
      },
      {
        theme: 'Emotional/Lunar Nature',
        systems: [
          { system: 'Astrology', concept: 'Moon sign' },
          { system: 'Dreamspell', concept: 'Red Moon seal' },
          { system: 'Human Design', concept: 'Solar Plexus center' },
          { system: 'Kabbalah', concept: 'Mem (מ) = water, emotions' }
        ]
      },
      {
        theme: 'Communication',
        systems: [
          { system: 'Astrology', concept: 'Mercury and 3rd House' },
          { system: 'Dreamspell', concept: 'White Wind seal' },
          { system: 'Human Design', concept: 'Throat center' },
          { system: 'Kabbalah', concept: 'Pe (פ) = mouth, speech' }
        ]
      },
      {
        theme: 'Transformation',
        systems: [
          { system: 'Astrology', concept: 'Pluto and 8th House' },
          { system: 'Dreamspell', concept: 'Blue Storm, White World-Bridger' },
          { system: 'Human Design', concept: 'Channel of Transformation' },
          { system: 'Kabbalah', concept: 'Nun (נ) = death and rebirth' }
        ]
      }
    ]
  },

  practicalIntegration: {
    title: 'Using Multiple Systems',
    guidelines: [
      'Start with one system and learn it well before adding others',
      'Notice where systems agree: these are strongly emphasized themes',
      'Notice where they diverge: this reveals complexity in your nature',
      'Use Astrology for psychological depth and timing',
      'Use Human Design for strategy and decision-making',
      'Use Dreamspell for daily synchronization and purpose',
      'Use Kabbalah for understanding your Hebrew name\'s essence',
      'Let the systems inform each other without forcing agreement'
    ]
  }
}

// ============================================================================
// DOCUMENTATION STRUCTURE
// ============================================================================

export const docStructure = {
  sections: [
    {
      id: 'dreamspell',
      title: 'Dreamspell',
      description: 'The 13:20 timing frequency and your galactic signature',
      icon: 'circles',
      topics: [
        { id: 'overview', title: 'Overview', anchor: 'dreamspell-overview' },
        { id: 'tzolkin', title: '260-Day Cycle', anchor: 'dreamspell-tzolkin' },
        { id: 'seals', title: '20 Solar Seals', anchor: 'dreamspell-seals' },
        { id: 'tones', title: '13 Galactic Tones', anchor: 'dreamspell-tones' },
        { id: 'wavespells', title: 'Wavespells', anchor: 'dreamspell-wavespells' },
        { id: 'oracle', title: 'The Oracle', anchor: 'dreamspell-oracle' },
        { id: 'castles', title: 'Five Castles', anchor: 'dreamspell-castles' },
        { id: 'portals', title: 'Portal Days', anchor: 'dreamspell-portals' },
        { id: 'practice', title: 'Daily Practice', anchor: 'dreamspell-practice' }
      ]
    },
    {
      id: 'human-design',
      title: 'Human Design',
      description: 'Your energetic blueprint and decision-making strategy',
      icon: 'bodygraph',
      topics: [
        { id: 'overview', title: 'Overview', anchor: 'hd-overview' },
        { id: 'types', title: 'Five Types', anchor: 'hd-types' },
        { id: 'authority', title: 'Inner Authority', anchor: 'hd-authority' },
        { id: 'centers', title: 'Nine Centers', anchor: 'hd-centers' },
        { id: 'profile', title: '12 Profiles', anchor: 'hd-profile' },
        { id: 'gates', title: 'Gates & Channels', anchor: 'hd-gates' },
        { id: 'incarnation', title: 'Incarnation Cross', anchor: 'hd-incarnation' },
        { id: 'experiment', title: 'The Experiment', anchor: 'hd-experiment' }
      ]
    },
    {
      id: 'astrology',
      title: 'Astrology',
      description: 'Planetary influences and your natal chart',
      icon: 'zodiac',
      topics: [
        { id: 'overview', title: 'Overview', anchor: 'astro-overview' },
        { id: 'big-three', title: 'Sun, Moon, Rising', anchor: 'astro-big-three' },
        { id: 'signs', title: '12 Zodiac Signs', anchor: 'astro-signs' },
        { id: 'planets', title: 'The Planets', anchor: 'astro-planets' },
        { id: 'houses', title: '12 Houses', anchor: 'astro-houses' },
        { id: 'aspects', title: 'Aspects', anchor: 'astro-aspects' },
        { id: 'interpretation', title: 'Chart Reading', anchor: 'astro-interpretation' }
      ]
    },
    {
      id: 'gematria',
      title: 'Kabbalah',
      description: 'Tree of Life, Gematria, and Hebrew letter mysticism',
      icon: 'aleph',
      topics: [
        { id: 'overview', title: 'Overview', anchor: 'gem-overview' },
        { id: 'ein-sof', title: 'Ein Sof & Creation', anchor: 'gem-ein-sof' },
        { id: 'tree-of-life', title: 'Tree of Life', anchor: 'gem-tree-of-life' },
        { id: 'four-worlds', title: 'The Four Worlds', anchor: 'gem-four-worlds' },
        { id: 'letters', title: '22 Hebrew Letters', anchor: 'gem-letters' },
        { id: 'methods', title: 'Gematria Methods', anchor: 'gem-methods' },
        { id: 'numbers', title: 'Significant Numbers', anchor: 'gem-numbers' },
        { id: 'practice', title: 'Practical Applications', anchor: 'gem-practice' },
        { id: 'integration', title: 'System Integration', anchor: 'gem-integration' }
      ]
    },
    {
      id: 'tzolkin',
      title: 'Traditional Tzolkin',
      description: 'The living Maya calendar tradition',
      icon: 'calendar',
      topics: [
        { id: 'overview', title: 'Overview', anchor: 'tz-overview' },
        { id: 'differences', title: 'Tzolkin vs. Dreamspell', anchor: 'tz-differences' },
        { id: 'nawales', title: '20 Nawales', anchor: 'tz-nawales' },
        { id: 'numbers', title: '13 Numbers', anchor: 'tz-numbers' },
        { id: 'ceremony', title: 'Ceremonial Use', anchor: 'tz-ceremony' }
      ]
    },
    {
      id: 'integration',
      title: 'System Integration',
      description: 'How the systems work together',
      icon: 'merge',
      topics: [
        { id: 'correspondences', title: 'Correspondences', anchor: 'int-correspondences' },
        { id: 'practice', title: 'Practical Integration', anchor: 'int-practice' }
      ]
    }
  ]
}

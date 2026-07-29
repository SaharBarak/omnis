/**
 * The 78-card Rider-Waite-Smith tarot (#74) — compact meaning library.
 * One keyword line upright and reversed per card; long-form spreads and
 * essays are a later phase.
 */

export type TarotArcana = 'major' | 'minor'
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles'

export interface TarotCard {
  /** 0-77: majors 0-21, then wands/cups/swords/pentacles ace→king. */
  readonly id: number
  readonly name: string
  readonly arcana: TarotArcana
  readonly suit: TarotSuit | null
  /** Card number within its sequence (majors 0-21; minors 1-14). */
  readonly number: number
  readonly upright: string
  readonly reversed: string
}

const MAJORS: readonly (readonly [string, string, string])[] = [
  ['The Fool', 'Beginnings, innocence, a leap taken on faith', 'Recklessness, hesitation at the edge, naivety exploited'],
  ['The Magician', 'Will, skill, resources aligned to intention', 'Manipulation, scattered energy, untapped talent'],
  ['The High Priestess', 'Intuition, the veiled world, inner knowing', 'Secrets kept from yourself, surface noise over depth'],
  ['The Empress', 'Abundance, nurture, creation in full leaf', 'Smothering, creative block, neglect of the body'],
  ['The Emperor', 'Structure, authority, the ordered realm', 'Domination, rigidity, authority resented'],
  ['The Hierophant', 'Tradition, teaching, the keeper of forms', 'Dogma, empty ritual, rebellion against convention'],
  ['The Lovers', 'Union, values aligned, a chosen bond', 'Disharmony, misaligned values, a choice avoided'],
  ['The Chariot', 'Victory through will, opposing forces driven as one', 'Loss of control, direction without traction'],
  ['Strength', 'Courage that gentles, patience over force', 'Self-doubt, raw force, the lion unmet'],
  ['The Hermit', 'Withdrawal, the lamp of inner search', 'Isolation, refusal of counsel, loneliness mistaken for wisdom'],
  ['Wheel of Fortune', 'Cycles, turning luck, the hinge of fate', 'Resistance to change, a cycle repeating unseen'],
  ['Justice', 'Truth, cause and effect, the honest weighing', 'Unfairness, accounts avoided, truth bent'],
  ['The Hanged Man', 'Surrender, the suspended view, willing pause', 'Stalling, martyrdom, sacrifice without insight'],
  ['Death', 'Ending that clears, transformation, the shed skin', 'Clinging to the dead form, change resisted'],
  ['Temperance', 'Blending, patience, the middle way found', 'Excess, imbalance, remedies out of measure'],
  ['The Devil', 'Bondage chosen, appetite ruling, the gilded chain', 'The chain examined, release beginning, shadow named'],
  ['The Tower', 'Sudden collapse, the lightning of truth', 'Disaster deferred, fear of the necessary fall'],
  ['The Star', 'Hope, healing water, guidance after storm', 'Faith dimmed, inspiration leaking away'],
  ['The Moon', 'Illusion, the dream road, fears given shapes', 'Confusion lifting, the false light seen through'],
  ['The Sun', 'Joy, vitality, success in open day', 'Clouded joy, vitality low, success postponed'],
  ['Judgement', 'Awakening, the reckoning call, rebirth', 'Self-judgment, the call unanswered'],
  ['The World', 'Completion, integration, the dance closed', 'Loose ends, a cycle almost finished'],
] as const

const RANKS = [
  'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King',
] as const

const SUIT_MEANINGS: Readonly<Record<TarotSuit, readonly (readonly [string, string])[]>> = {
  wands: [
    ['A spark of inspiration, the offered flame', 'False start, a spark without fuel'],
    ['Planning, dominion surveyed, the world in hand', 'Fear of leaving the known, plans unmade'],
    ['Expansion, ships sent out, foresight rewarded', 'Delays, obstacles to the venture'],
    ['Celebration, homecoming, foundations blessed', 'Instability at home, celebration deferred'],
    ['Friction, rivalry, sparring energies', 'Conflict avoided or resolved, tension released'],
    ['Victory recognized, the laurel received', 'Fall from favor, success without support'],
    ['Defense of position, courage under challenge', 'Overwhelm, ground given up'],
    ['Swift movement, news in flight, momentum', 'Delay, scattered arrows, haste misfiring'],
    ['Resilience, the last watch held', 'Exhaustion, defenses worn thin'],
    ['Burden carried, success grown heavy', 'The load released or unbearable'],
    ['Curiosity aflame, the eager messenger', 'Bad news, enthusiasm without direction'],
    ['Adventure, charge ahead, passionate pursuit', 'Impulsiveness, energy without cause'],
    ['Warmth commanding, confidence that hosts', 'Jealousy, demands, warmth withdrawn'],
    ['Vision leading, the entrepreneur crowned', 'Tyranny of vision, promises overreached'],
  ],
  cups: [
    ['An offered heart, the overflowing spring', 'Feelings withheld, the cup declined'],
    ['Partnership, mutual regard, the shared cup', 'Imbalance in a bond, broken reciprocity'],
    ['Friendship, celebration among equals', 'Excess, a third presence, friendship strained'],
    ['Apathy, the offered cup unseen', 'Re-engagement, the gift finally noticed'],
    ['Grief over what spilled, three cups mourned', 'Acceptance, the two cups still standing seen'],
    ['Nostalgia, kindness remembered, innocence revisited', 'Living in the past, gifts with strings'],
    ['Choices in cloud, wishful thinking', 'Clarity, illusions sorted, one cup chosen'],
    ['Walking away from the built, the deeper quest', 'Fear of leaving, aimless drift'],
    ['Satisfaction, the wish granted', 'Smugness, satisfaction hollow at center'],
    ['Family joy, the arched rainbow of feeling', 'Domestic discord, the picture strained'],
    ['A tender message, imagination surfacing', 'Emotional immaturity, escapism'],
    ['Romance in motion, the offered dream', 'Moodiness, a proposal too good to be true'],
    ['Compassion enthroned, feeling held wisely', 'Emotional dependence, care turned inward'],
    ['Feeling mastered, calm across deep water', 'Repression, manipulation by mood'],
  ],
  swords: [
    ['Clarity cutting through, truth unsheathed', 'Confusion, a truth misused'],
    ['Stalemate, the blindfolded balance', 'The impasse breaking, information arriving'],
    ['Heartbreak named, the piercing truth', 'Healing beginning, the blades withdrawn'],
    ['Rest ordered, the mind laid down', 'Restlessness, recovery refused'],
    ['A hollow win, conflict at any cost', 'Reconciliation, the cost admitted'],
    ['Passage to calmer water, carried transition', 'Baggage that boards with you, a crossing delayed'],
    ['Stealth, strategy, something carried off', 'Confession, the trick exposed'],
    ['Self-made bindings, sight restricted', 'The bindings loosening, perspective returning'],
    ['The 3 a.m. mind, worry multiplied', 'Dawn after the worst night, worry deflated'],
    ['An ending complete, the pinned defeat', 'Recovery, the worst already passed'],
    ['Watchful curiosity, the studying mind', 'Gossip, cleverness without care'],
    ['Speed and argument, the charging intellect', 'Recklessness, a charge without aim'],
    ['Clear-eyed judgment, sorrow made wise', 'Coldness, judgment without mercy'],
    ['Intellect enthroned, the impartial rule', 'Abuse of reason, verdicts without heart'],
  ],
  pentacles: [
    ['A seed of substance, opportunity in hand', 'Missed chance, gain that slips'],
    ['Juggling means, flexible balance', 'Overextension, the juggle dropped'],
    ['Craft recognized, collaboration building', 'Mediocrity, teamwork misaligned'],
    ['Holding tight, security gripped', 'Release, generosity, control loosened'],
    ['Hardship at the lit window, exclusion felt', 'Recovery, help accepted'],
    ['Generosity weighed, giving and receiving', 'Strings attached, charity as control'],
    ['Patience at the vine, assessment', 'Impatience, effort doubted'],
    ['Apprenticeship, the repeated perfect stroke', 'Perfectionism, work without meaning'],
    ['Earned luxury, the garden enjoyed alone', 'Show over substance, dependence dressed well'],
    ['Legacy, the family estate, wealth rooted', 'Inheritance disputed, stability at risk'],
    ['Studiousness, news of material progress', 'Procrastination, lessons ignored'],
    ['Diligence, the methodical plow', 'Drudgery, motion without progress'],
    ['Practical warmth, the tended hearth', 'Self-neglect in service, smothering care'],
    ['Mastery of means, the golden touch held lightly', 'Greed, worth measured only in gold'],
  ],
}

function buildDeck(): TarotCard[] {
  const cards: TarotCard[] = MAJORS.map(([name, upright, reversed], i) => ({
    id: i,
    name,
    arcana: 'major' as const,
    suit: null,
    number: i,
    upright,
    reversed,
  }))
  const suits: TarotSuit[] = ['wands', 'cups', 'swords', 'pentacles']
  for (const [s, suit] of suits.entries()) {
    for (let r = 0; r < 14; r++) {
      const [upright, reversed] = SUIT_MEANINGS[suit][r]
      cards.push({
        id: 22 + s * 14 + r,
        name: `${RANKS[r]} of ${suit[0].toUpperCase()}${suit.slice(1)}`,
        arcana: 'minor',
        suit,
        number: r + 1,
        upright,
        reversed,
      })
    }
  }
  return cards
}

export const TAROT_DECK: readonly TarotCard[] = Object.freeze(buildDeck())

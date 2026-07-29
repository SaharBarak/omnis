/**
 * The 64 hexagrams of the I Ching (#74), in King Wen order — compact
 * reference: pinyin and English names, trigram pair, and a one-line
 * reading of the Judgment.
 */

export interface Trigram {
  readonly name: string
  readonly pinyin: string
  readonly attribute: string
  /** Lines bottom-up: 1 = solid yang, 0 = broken yin. */
  readonly lines: readonly [number, number, number]
}

export const TRIGRAMS: readonly Trigram[] = Object.freeze([
  { name: 'Heaven', pinyin: 'Qian', attribute: 'the creative', lines: [1, 1, 1] },
  { name: 'Lake', pinyin: 'Dui', attribute: 'the joyous', lines: [1, 1, 0] },
  { name: 'Fire', pinyin: 'Li', attribute: 'the clinging', lines: [1, 0, 1] },
  { name: 'Thunder', pinyin: 'Zhen', attribute: 'the arousing', lines: [1, 0, 0] },
  { name: 'Wind', pinyin: 'Xun', attribute: 'the gentle', lines: [0, 1, 1] },
  { name: 'Water', pinyin: 'Kan', attribute: 'the abysmal', lines: [0, 1, 0] },
  { name: 'Mountain', pinyin: 'Gen', attribute: 'keeping still', lines: [0, 0, 1] },
  { name: 'Earth', pinyin: 'Kun', attribute: 'the receptive', lines: [0, 0, 0] },
])

export interface Hexagram {
  /** King Wen number, 1-64. */
  readonly number: number
  readonly pinyin: string
  readonly english: string
  /** [lower, upper] trigram names. */
  readonly trigrams: readonly [string, string]
  readonly judgment: string
}

export const HEXAGRAMS: readonly Hexagram[] = Object.freeze([
  { number: 1, pinyin: 'Qian', english: 'The Creative', trigrams: ['Heaven', 'Heaven'], judgment: 'Pure creative force — sublime success through persistence in what is right.' },
  { number: 2, pinyin: 'Kun', english: 'The Receptive', trigrams: ['Earth', 'Earth'], judgment: 'Devoted receptivity — success through yielding, like the mare that finds her way.' },
  { number: 3, pinyin: 'Zhun', english: 'Difficulty at the Beginning', trigrams: ['Thunder', 'Water'], judgment: 'The sprout against the stone — persevere, appoint helpers, do not press on alone.' },
  { number: 4, pinyin: 'Meng', english: 'Youthful Folly', trigrams: ['Water', 'Mountain'], judgment: 'The student, not the teacher, must ask — sincerity in the first asking is answered.' },
  { number: 5, pinyin: 'Xu', english: 'Waiting', trigrams: ['Heaven', 'Water'], judgment: 'Nourished waiting — the rain will come; strength lies in timing, not forcing.' },
  { number: 6, pinyin: 'Song', english: 'Conflict', trigrams: ['Water', 'Heaven'], judgment: 'Contention — meet halfway; carrying a dispute to the end brings misfortune.' },
  { number: 7, pinyin: 'Shi', english: 'The Army', trigrams: ['Water', 'Earth'], judgment: 'Discipline in numbers — success needs a seasoned leader and a just cause.' },
  { number: 8, pinyin: 'Bi', english: 'Holding Together', trigrams: ['Earth', 'Water'], judgment: 'Union around a center — those who come late to the alliance find the door closed.' },
  { number: 9, pinyin: 'Xiao Chu', english: 'The Taming Power of the Small', trigrams: ['Heaven', 'Wind'], judgment: 'Dense clouds, no rain yet — small measures restrain great force for now.' },
  { number: 10, pinyin: 'Lü', english: 'Treading', trigrams: ['Lake', 'Heaven'], judgment: 'Treading on the tiger’s tail — conduct so careful even danger does not bite.' },
  { number: 11, pinyin: 'Tai', english: 'Peace', trigrams: ['Heaven', 'Earth'], judgment: 'Heaven below, earth above — the great approaches, the small departs; flow opens.' },
  { number: 12, pinyin: 'Pi', english: 'Standstill', trigrams: ['Earth', 'Heaven'], judgment: 'The heavens withdraw — inferior forces rise; keep your worth hidden and wait.' },
  { number: 13, pinyin: 'Tong Ren', english: 'Fellowship with Men', trigrams: ['Fire', 'Heaven'], judgment: 'Fellowship in the open — what is shared openly can cross the great water.' },
  { number: 14, pinyin: 'Da You', english: 'Possession in Great Measure', trigrams: ['Heaven', 'Fire'], judgment: 'The fire above heaven — great holdings held modestly bring supreme success.' },
  { number: 15, pinyin: 'Qian', english: 'Modesty', trigrams: ['Mountain', 'Earth'], judgment: 'The mountain within the earth — modesty carried through brings every ending home.' },
  { number: 16, pinyin: 'Yu', english: 'Enthusiasm', trigrams: ['Earth', 'Thunder'], judgment: 'Thunder from the earth — movement that follows the natural bent carries all along.' },
  { number: 17, pinyin: 'Sui', english: 'Following', trigrams: ['Thunder', 'Lake'], judgment: 'To lead, first follow — adapt to the time and rest when rest is due.' },
  { number: 18, pinyin: 'Gu', english: 'Work on What Has Been Spoiled', trigrams: ['Wind', 'Mountain'], judgment: 'Decay invites repair — three days before the start, three days after.' },
  { number: 19, pinyin: 'Lin', english: 'Approach', trigrams: ['Lake', 'Earth'], judgment: 'A favorable approach — act while the season is open; it will not stay open.' },
  { number: 20, pinyin: 'Guan', english: 'Contemplation', trigrams: ['Earth', 'Wind'], judgment: 'The tower view — having washed the hands, the offering pauses; observe deeply.' },
  { number: 21, pinyin: 'Shi He', english: 'Biting Through', trigrams: ['Thunder', 'Fire'], judgment: 'An obstacle between the jaws — bite through; justice must be applied firmly.' },
  { number: 22, pinyin: 'Bi', english: 'Grace', trigrams: ['Fire', 'Mountain'], judgment: 'Fire beneath the mountain — form adorns substance; grace in small matters.' },
  { number: 23, pinyin: 'Bo', english: 'Splitting Apart', trigrams: ['Earth', 'Mountain'], judgment: 'The house is being stripped — do not act; let the collapse complete itself.' },
  { number: 24, pinyin: 'Fu', english: 'Return', trigrams: ['Thunder', 'Earth'], judgment: 'The turning point — after seven days the light returns; go out and come back freely.' },
  { number: 25, pinyin: 'Wu Wang', english: 'Innocence', trigrams: ['Thunder', 'Heaven'], judgment: 'The unexpected — act from innocence, not calculation, and heaven moves with you.' },
  { number: 26, pinyin: 'Da Chu', english: 'The Taming Power of the Great', trigrams: ['Heaven', 'Mountain'], judgment: 'Great strength stored — feed on old wisdom daily; then cross the great water.' },
  { number: 27, pinyin: 'Yi', english: 'The Corners of the Mouth', trigrams: ['Thunder', 'Mountain'], judgment: 'Nourishment — watch what you feed, in yourself and in others.' },
  { number: 28, pinyin: 'Da Guo', english: 'Preponderance of the Great', trigrams: ['Wind', 'Lake'], judgment: 'The ridgepole sags — extraordinary times; move quickly, alone if you must.' },
  { number: 29, pinyin: 'Kan', english: 'The Abysmal', trigrams: ['Water', 'Water'], judgment: 'Water upon water — in repeated danger, sincerity and flow carry you through.' },
  { number: 30, pinyin: 'Li', english: 'The Clinging', trigrams: ['Fire', 'Fire'], judgment: 'Fire clings to what feeds it — care for the cow, and brightness doubles.' },
  { number: 31, pinyin: 'Xian', english: 'Influence', trigrams: ['Mountain', 'Lake'], judgment: 'The lake on the mountain — attraction through stillness; taking a wife brings luck.' },
  { number: 32, pinyin: 'Heng', english: 'Duration', trigrams: ['Wind', 'Thunder'], judgment: 'The long standing — endure in your course; what lasts renews itself.' },
  { number: 33, pinyin: 'Dun', english: 'Retreat', trigrams: ['Mountain', 'Heaven'], judgment: 'Timely retreat — withdraw with dignity; distance is strength, not defeat.' },
  { number: 34, pinyin: 'Da Zhuang', english: 'The Power of the Great', trigrams: ['Heaven', 'Thunder'], judgment: 'Thunder in heaven — great power; right conduct alone keeps it from becoming force.' },
  { number: 35, pinyin: 'Jin', english: 'Progress', trigrams: ['Earth', 'Fire'], judgment: 'The sun over the earth — rapid advance; the loyal prince is honored thrice a day.' },
  { number: 36, pinyin: 'Ming Yi', english: 'Darkening of the Light', trigrams: ['Fire', 'Earth'], judgment: 'The light wounded — veil your brightness and keep the inner flame lit.' },
  { number: 37, pinyin: 'Jia Ren', english: 'The Family', trigrams: ['Fire', 'Wind'], judgment: 'The hearth — words must have substance and roles their warmth; order begins at home.' },
  { number: 38, pinyin: 'Kui', english: 'Opposition', trigrams: ['Lake', 'Fire'], judgment: 'Fire over the lake — estrangement; in small matters, still good fortune.' },
  { number: 39, pinyin: 'Jian', english: 'Obstruction', trigrams: ['Mountain', 'Water'], judgment: 'The pass is blocked — turn back, join allies, and seek the great person.' },
  { number: 40, pinyin: 'Xie', english: 'Deliverance', trigrams: ['Water', 'Thunder'], judgment: 'The storm breaks — the knot loosens; forgive quickly and return to the ordinary.' },
  { number: 41, pinyin: 'Sun', english: 'Decrease', trigrams: ['Lake', 'Mountain'], judgment: 'Decrease with sincerity — two small bowls suffice for the offering.' },
  { number: 42, pinyin: 'Yi', english: 'Increase', trigrams: ['Thunder', 'Wind'], judgment: 'Increase — the time to undertake; cross the great water while the wind holds.' },
  { number: 43, pinyin: 'Guai', english: 'Breakthrough', trigrams: ['Heaven', 'Lake'], judgment: 'The resolute announcement — expose what must fall, but not by your own blade alone.' },
  { number: 44, pinyin: 'Gou', english: 'Coming to Meet', trigrams: ['Wind', 'Heaven'], judgment: 'The bold maiden — do not marry what arrives too easily; smallness grows if welcomed.' },
  { number: 45, pinyin: 'Cui', english: 'Gathering Together', trigrams: ['Earth', 'Lake'], judgment: 'The lake gathers — great offerings, a great leader; prepare for the unforeseen.' },
  { number: 46, pinyin: 'Sheng', english: 'Pushing Upward', trigrams: ['Wind', 'Earth'], judgment: 'The tree in the earth — steady effort upward; see the great person, fear nothing.' },
  { number: 47, pinyin: 'Kun', english: 'Oppression', trigrams: ['Water', 'Lake'], judgment: 'The dried lake — words are not believed now; let conduct speak until they are.' },
  { number: 48, pinyin: 'Jing', english: 'The Well', trigrams: ['Wind', 'Water'], judgment: 'The town moves, the well remains — tend the source everyone draws from.' },
  { number: 49, pinyin: 'Ge', english: 'Revolution', trigrams: ['Fire', 'Lake'], judgment: 'Molting — change is believed only on its own day; then regret vanishes.' },
  { number: 50, pinyin: 'Ding', english: 'The Cauldron', trigrams: ['Wind', 'Fire'], judgment: 'The vessel of transformation — nourish the able, and the offering is received.' },
  { number: 51, pinyin: 'Zhen', english: 'The Arousing', trigrams: ['Thunder', 'Thunder'], judgment: 'Shock upon shock — the startled laughter of one who does not drop the ladle.' },
  { number: 52, pinyin: 'Gen', english: 'Keeping Still', trigrams: ['Mountain', 'Mountain'], judgment: 'Stillness of the back — when it is time to stop, stop; when to move, move.' },
  { number: 53, pinyin: 'Jian', english: 'Development', trigrams: ['Mountain', 'Wind'], judgment: 'The wild goose approaches gradually — progress by stations, none skipped.' },
  { number: 54, pinyin: 'Gui Mei', english: 'The Marrying Maiden', trigrams: ['Lake', 'Thunder'], judgment: 'Entering as the younger — undertakings misfire; know your standing and endure.' },
  { number: 55, pinyin: 'Feng', english: 'Abundance', trigrams: ['Fire', 'Thunder'], judgment: 'Fullness at noon — be as the sun at midday; do not mourn the coming dusk.' },
  { number: 56, pinyin: 'Lü', english: 'The Wanderer', trigrams: ['Mountain', 'Fire'], judgment: 'The traveler — small aims succeed; be courteous, keep your camp orderly.' },
  { number: 57, pinyin: 'Xun', english: 'The Gentle', trigrams: ['Wind', 'Wind'], judgment: 'Wind upon wind — small, repeated influence; have somewhere to go, someone to see.' },
  { number: 58, pinyin: 'Dui', english: 'The Joyous', trigrams: ['Lake', 'Lake'], judgment: 'Lake answering lake — joy shared among friends makes perseverance sweet.' },
  { number: 59, pinyin: 'Huan', english: 'Dispersion', trigrams: ['Water', 'Wind'], judgment: 'The wind over water — rigidity dissolves; gather what scattered at the temple.' },
  { number: 60, pinyin: 'Jie', english: 'Limitation', trigrams: ['Lake', 'Water'], judgment: 'Measures and banks — limits give the water form; bitter limits do not hold.' },
  { number: 61, pinyin: 'Zhong Fu', english: 'Inner Truth', trigrams: ['Lake', 'Wind'], judgment: 'The wind over the lake — sincerity that reaches even pigs and fishes.' },
  { number: 62, pinyin: 'Xiao Guo', english: 'Preponderance of the Small', trigrams: ['Mountain', 'Thunder'], judgment: 'The bird should not fly high — small things now; the message is in descending.' },
  { number: 63, pinyin: 'Ji Ji', english: 'After Completion', trigrams: ['Fire', 'Water'], judgment: 'Order achieved — success in small matters; at the end, keep watch for disorder.' },
  { number: 64, pinyin: 'Wei Ji', english: 'Before Completion', trigrams: ['Water', 'Fire'], judgment: 'The fox nearly across — everything ready but the last step; place each foot with care.' },
])

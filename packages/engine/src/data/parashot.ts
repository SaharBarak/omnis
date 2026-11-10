/**
 * The fifty-four weekly portions of the Torah (parashot), in the order they
 * are read from Bereshit after Simchat Torah, each with its book and its
 * Hebrew name; the seven pairs that may be read together on one Shabbat
 * (Shulchan Aruch, Orach Chayim 428:4, https://www.sefaria.org/Shulchan_Arukh,_Orach_Chayim.428 ;
 * https://en.wikipedia.org/wiki/Weekly_Torah_portion). Vezot HaBerakhah, the
 * last, is read on Simchat Torah, never on a Shabbat of its own.
 */

export type TorahBook = 'Genesis' | 'Exodus' | 'Leviticus' | 'Numbers' | 'Deuteronomy'

export interface TorahBookName {
  readonly book: TorahBook
  readonly hebrew: string
}

/** The five books in order, each by its English and its Hebrew name. */
export const TORAH_BOOKS: readonly TorahBookName[] = Object.freeze([
  { book: 'Genesis', hebrew: 'בראשית' },
  { book: 'Exodus', hebrew: 'שמות' },
  { book: 'Leviticus', hebrew: 'ויקרא' },
  { book: 'Numbers', hebrew: 'במדבר' },
  { book: 'Deuteronomy', hebrew: 'דברים' },
])

export interface Parasha {
  /** 1 (Bereshit) to 54 (Vezot HaBerakhah). */
  readonly number: number
  readonly name: string
  readonly hebrew: string
  readonly book: TorahBook
}

const PORTIONS: readonly (readonly [TorahBook, readonly (readonly [string, string])[]])[] = [
  [
    'Genesis',
    [
      ['Bereshit', 'בראשית'], ['Noach', 'נח'], ['Lech-Lecha', 'לך לך'], ['Vayera', 'וירא'], ['Chayei Sara', 'חיי שרה'], ['Toldot', 'תולדות'],
      ['Vayetzei', 'ויצא'], ['Vayishlach', 'וישלח'], ['Vayeshev', 'וישב'], ['Miketz', 'מקץ'], ['Vayigash', 'ויגש'], ['Vayechi', 'ויחי'],
    ],
  ],
  [
    'Exodus',
    [
      ['Shemot', 'שמות'], ['Vaera', 'וארא'], ['Bo', 'בא'], ['Beshalach', 'בשלח'], ['Yitro', 'יתרו'], ['Mishpatim', 'משפטים'],
      ['Terumah', 'תרומה'], ['Tetzaveh', 'תצוה'], ['Ki Tisa', 'כי תשא'], ['Vayakhel', 'ויקהל'], ['Pekudei', 'פקודי'],
    ],
  ],
  [
    'Leviticus',
    [
      ['Vayikra', 'ויקרא'], ['Tzav', 'צו'], ['Shmini', 'שמיני'], ['Tazria', 'תזריע'], ['Metzora', 'מצורע'],
      ['Achrei Mot', 'אחרי מות'], ['Kedoshim', 'קדושים'], ['Emor', 'אמור'], ['Behar', 'בהר'], ['Bechukotai', 'בחקתי'],
    ],
  ],
  [
    'Numbers',
    [
      ['Bamidbar', 'במדבר'], ['Nasso', 'נשא'], ["Beha'alotcha", 'בהעלותך'], ["Sh'lach", 'שלח לך'], ['Korach', 'קרח'],
      ['Chukat', 'חקת'], ['Balak', 'בלק'], ['Pinchas', 'פינחס'], ['Matot', 'מטות'], ['Masei', 'מסעי'],
    ],
  ],
  [
    'Deuteronomy',
    [
      ['Devarim', 'דברים'], ['Vaetchanan', 'ואתחנן'], ['Eikev', 'עקב'], ["Re'eh", 'ראה'], ['Shoftim', 'שופטים'], ['Ki Teitzei', 'כי תצא'],
      ['Ki Tavo', 'כי תבוא'], ['Nitzavim', 'נצבים'], ['Vayeilech', 'וילך'], ["Ha'azinu", 'האזינו'], ['Vezot HaBerakhah', 'וזאת הברכה'],
    ],
  ],
]

export const PARASHOT: readonly Parasha[] = Object.freeze(
  PORTIONS.flatMap(([book, names]) => names.map(([name, hebrew]) => ({ name, hebrew, book }))).map((p, i) => Object.freeze({ number: i + 1, ...p })),
)

/** A portion by its number (1–54). */
export const parashaNumbered = (n: number): Parasha | undefined => PARASHOT[n - 1]

/** A portion by its name, as `PARASHOT` spells it. */
const numberOf = (name: string): number => PARASHOT.findIndex((p) => p.name === name) + 1

/** The seven pairs that may be joined, each by its first portion's number (the second follows it). */
export const JOINABLE_PAIRS = Object.freeze({
  vayakhelPekudei: numberOf('Vayakhel'),
  tazriaMetzora: numberOf('Tazria'),
  achreiMotKedoshim: numberOf('Achrei Mot'),
  beharBechukotai: numberOf('Behar'),
  chukatBalak: numberOf('Chukat'),
  matotMasei: numberOf('Matot'),
  nitzavimVayeilech: numberOf('Nitzavim'),
} as const)

/**
 * The portions the year's readings are held to (Tur and Shulchan Aruch, OC
 * 428:4, by their mnemonics): Tzav before Pesach in a common year and
 * Metzora in a leap year; Bamidbar before Shavuot ("count, then stop");
 * Devarim on the Shabbat before Tisha B'Av ("fast, then pray"); Nitzavim on
 * the Shabbat before Rosh Hashanah ("stand, then blow").
 */
export const ANCHOR_PORTIONS = Object.freeze({
  beforePesachCommon: numberOf('Tzav'),
  beforePesachLeap: numberOf('Metzora'),
  beforeShavuot: numberOf('Bamidbar'),
  beforeTishaBav: numberOf('Devarim'),
  beforeRoshHashanah: numberOf('Nitzavim'),
  vayeilech: numberOf('Vayeilech'),
  haazinu: numberOf("Ha'azinu"),
  vezotHaberakhah: numberOf('Vezot HaBerakhah'),
} as const)

export type SpecialShabbatId = 'shuva' | 'shirah' | 'shekalim' | 'zachor' | 'parah' | 'hachodesh' | 'hagadol' | 'chazon' | 'nachamu'

/**
 * The Shabbatot named for what is read or kept on them (Shulchan Aruch OC
 * 685 for the four before Pesach, OC 430 for HaGadol; the rest by their
 * haftarot): when each falls is derived in calculations/parasha.ts.
 */
export const SPECIAL_SHABBATOT: readonly { readonly id: SpecialShabbatId; readonly name: string; readonly hebrew: string; readonly note: string }[] = Object.freeze([
  { id: 'shuva', name: 'Shabbat Shuva', hebrew: 'שבת שובה', note: 'Return: between Rosh Hashanah and Yom Kippur' },
  { id: 'shirah', name: 'Shabbat Shirah', hebrew: 'שבת שירה', note: 'The Song at the Sea is read' },
  { id: 'shekalim', name: 'Shabbat Shekalim', hebrew: 'שבת שקלים', note: 'The half-shekel, on or before Rosh Chodesh Adar' },
  { id: 'zachor', name: 'Shabbat Zachor', hebrew: 'שבת זכור', note: 'Remember Amalek: the Shabbat before Purim' },
  { id: 'parah', name: 'Shabbat Parah', hebrew: 'שבת פרה', note: 'The red heifer: the week before HaChodesh' },
  { id: 'hachodesh', name: 'Shabbat HaChodesh', hebrew: 'שבת החודש', note: 'This month shall be the first: on or before Rosh Chodesh Nisan' },
  { id: 'hagadol', name: 'Shabbat HaGadol', hebrew: 'שבת הגדול', note: 'The great Shabbat before Pesach' },
  { id: 'chazon', name: 'Shabbat Chazon', hebrew: 'שבת חזון', note: 'Isaiah’s vision, on or before Tisha B’Av' },
  { id: 'nachamu', name: 'Shabbat Nachamu', hebrew: 'שבת נחמו', note: 'Comfort, the Shabbat after Tisha B’Av' },
])

/**
 * Which joinable pairs give way first when a stretch of the year has fewer
 * Shabbatot than portions: the pair listed earlier is joined first. Read off
 * the published schedules (Hebcal's for 5745–5835, every year type in Israel
 * and the diaspora): Behar–Bechukotai stays apart where Israel reads one
 * portion ahead after Pesach, Chukat–Balak joins only where the diaspora's
 * second day of Shavuot falls on Shabbat.
 */
export const JOIN_ORDER: readonly number[] = Object.freeze([
  JOINABLE_PAIRS.vayakhelPekudei,
  JOINABLE_PAIRS.tazriaMetzora,
  JOINABLE_PAIRS.achreiMotKedoshim,
  JOINABLE_PAIRS.matotMasei,
  JOINABLE_PAIRS.beharBechukotai,
  JOINABLE_PAIRS.chukatBalak,
])

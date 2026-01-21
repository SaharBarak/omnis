export interface TzolkinDaySign {
  number: number        // 1-20
  yucatec: string       // "Imix", "Ik'", etc.
  english: string       // "Crocodile", "Wind", etc.
}

export interface TzolkinDay {
  daySign: TzolkinDaySign
  tone: number          // 1-13
}

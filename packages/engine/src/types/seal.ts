import type { ColorFamily } from './common'

export interface Seal {
  number: number        // 1-20
  mayan: string         // "Imix", "Ik", etc.
  english: string       // "Dragon", "Wind", etc.
  hebrew: string        // "תנין", "רוח", etc.
  color: ColorFamily    // "red" | "white" | "blue" | "yellow"
}

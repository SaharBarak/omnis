import type { BaziElement } from '@pleiad/engine/calculations/bazi'

/**
 * The five BaZi elements as colour. One palette for every surface that
 * draws a BaZi chart: the live page reads it directly, the bento kit
 * through `--el-<element>` tokens set by LabRoot.
 */
export const BAZI_ELEMENT_COLORS: Readonly<Record<BaziElement, string>> = Object.freeze({
  Wood: '#86C89B',
  Fire: '#D98E5F',
  Earth: '#D9B36A',
  Metal: '#C9CDD4',
  Water: '#7FA8D4',
})

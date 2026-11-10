/**
 * Where ink starts, read from pixels (BENTO_TYPE.md, "Hung bearings"). Shared
 * by `npm run type:bearings`, which measures the display face's bearings,
 * and the e2e check that holds the page's hung text to its edge, so the two
 * read ink the same way. Text is set magenta on black for the read, so a
 * pixel's magenta (the less of red and blue, less green) is its ink
 * coverage, and no other ground reads as ink.
 */

/** The size the display face's bearings are read at: one pixel of ink is 1/MEASURE_PX em, the table's precision. */
export const MEASURE_PX = 400

/** Paints every element matching `selector` as magenta ink on black, past its box by `spread` px. */
export const inkStyle = (selector, spread) =>
  `${selector} { color: #f0f !important; -webkit-text-fill-color: #f0f !important; background: #000 !important; ` +
  `box-shadow: 0 0 0 ${spread}px #000 !important; text-shadow: none !important; opacity: 1 !important; }`

/**
 * Runs in the page: decodes a PNG screenshot and, for each row band, returns
 * where ink starts in px from the band's left, from the first column with
 * any ink, less the share of it the ink leaves bare; null for a band with no ink.
 */
export async function inkStarts({ png, bands }) {
  const image = new Image()
  image.src = `data:image/png;base64,${png}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const pen = canvas.getContext('2d', { willReadFrequently: true })
  pen.drawImage(image, 0, 0)
  return bands.map(({ x, y, width, height }) => {
    const { data } = pen.getImageData(x, y, width, height)
    for (let col = 0; col < width; col++) {
      let ink = 0
      for (let row = 0; row < height; row++) {
        const at = (row * width + col) * 4
        ink = Math.max(ink, (Math.min(data[at], data[at + 2]) - data[at + 1]) / 255)
      }
      if (ink > 0.02) return col + 1 - ink
    }
    return null
  })
}

/**
 * The twenty Dreamspell seals' glyphs, synced from their one source: the
 * Maya day signs on Wikimedia Commons, `MAYA-g-log-cal-DNN-<Name>.svg`, whose
 * day number is the seal's number (src/lib/design/day-signs.ts). Each file's
 * licence is checked before it is written, its author and licence are
 * recorded as Commons states them (`day-signs.sources.json`, which the
 * attributions read), and it is painted with currentColor so it takes the ink
 * of any surface and titled with its seal and its source, which
 * seal-glyphs.test.ts reads back (docs/redesign/BENTO_V2.md, "Seal glyphs").
 *
 *   npm run glyphs:seals                 fetch from Commons
 *   npm run glyphs:seals -- --cache dir  reuse files already fetched into dir
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SEALS } from '../../packages/engine/src/data/seals'
import { glyphSlug } from '../../src/lib/design/glyph-paths'
import { DAY_SIGN_LICENSES, daySignFile, daySignPage, type DaySignSource } from '../../src/lib/design/day-signs'

const OUT_DIRS = ['public/images/dreamspell/seals', 'packages/mobile/assets/glyphs/dreamspell/seals']
const SOURCES = 'src/lib/design/day-signs.sources.json'
const API = 'https://commons.wikimedia.org/w/api.php'
const AGENT = 'Pleiad-asset-sync/1.0 (https://pleiad.io)'
const RETRIES = 5
const BACKOFF_MS = 30_000

interface ImageInfo {
  readonly url: string
  readonly license: string
  readonly licenseUrl: string
  readonly author: string
}

const plain = (html: string): string => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchText(url: string, attempt = 1): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': AGENT } })
  if (response.ok) return response.text()
  if (response.status !== 429 || attempt >= RETRIES) throw new Error(`${response.status} ${url}`)
  await wait(BACKOFF_MS * attempt)
  return fetchText(url, attempt + 1)
}

async function imageInfo(files: readonly string[]): Promise<ReadonlyMap<string, ImageInfo>> {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist',
    titles: files.map((f) => `File:${f}`).join('|'),
  })
  const body = JSON.parse(await fetchText(`${API}?${query}`)) as {
    query: { pages: Record<string, { title: string; imageinfo?: { url: string; extmetadata: Record<string, { value: string }> }[] }> }
  }
  return new Map(
    Object.values(body.query.pages).flatMap((page) => {
      const info = page.imageinfo?.[0]
      if (!info) return []
      const meta = (key: string): string => plain(info.extmetadata[key]?.value ?? '')
      return [[page.title.replace(/^File:/, '').replace(/ /g, '_'), { url: info.url, license: meta('LicenseShortName'), licenseUrl: meta('LicenseUrl'), author: meta('Artist') }] as const]
    }),
  )
}

const XML_ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }

/** Text set inside an SVG element, its markup characters escaped so the file stays well-formed XML. */
const xmlText = (text: string): string => text.replace(/[&<>]/g, (c) => XML_ESCAPES[c] ?? c)

/** The source as fetched, painted with currentColor and titled with its seal and source; potrace's paths are left as drawn. */
const normalise = (svg: string, source: DaySignSource): string => {
  const seal = SEALS[source.seal - 1]
  const title = `<title>${xmlText(`${seal.mayan} (${seal.english}), ${source.file}, ${source.author}, ${source.license}: ${source.page}`)}</title>`
  return svg
    .replace(/fill="#000000"/g, 'fill="currentColor"')
    .replace(/(<svg\b[^>]*>)/, `$1\n${title}`)
}

interface DaySign {
  readonly slug: string
  readonly source: DaySignSource
  readonly svg: string
}

/** One seal's source, licence-checked, and its drawing, from the cache or Commons. */
async function fetchSign(seal: (typeof SEALS)[number], infos: ReadonlyMap<string, ImageInfo>, cache: string | null): Promise<DaySign> {
  const file = daySignFile(seal.number)
  const info = infos.get(file)
  if (!info) throw new Error(`Commons has no ${file}`)
  if (!DAY_SIGN_LICENSES.has(info.license)) throw new Error(`${file} is ${info.license}, which is not free for commercial use with attribution`)
  const source: DaySignSource = { seal: seal.number, file, page: daySignPage(seal.number), author: info.author, license: info.license, licenseUrl: info.licenseUrl }
  const cached = cache && join(cache, file)
  const svg = cached && existsSync(cached) ? readFileSync(cached, 'utf8') : await fetchText(info.url)
  if (cached && !existsSync(cached)) writeFileSync(cached, svg)
  return { slug: glyphSlug(seal.number, seal.english), source, svg }
}

/**
 * Every seal is checked and fetched before any file is written, so a run that
 * fails leaves the glyphs and their sources as they were, never half synced.
 */
async function main() {
  const at = process.argv.indexOf('--cache')
  const cache = at > -1 ? (process.argv[at + 1] ?? null) : null
  const infos = await imageInfo(SEALS.map((seal) => daySignFile(seal.number)))
  const signs: DaySign[] = []
  for (const seal of SEALS) signs.push(await fetchSign(seal, infos, cache))
  for (const dir of OUT_DIRS) {
    mkdirSync(dir, { recursive: true })
    for (const sign of signs) writeFileSync(join(dir, `${sign.slug}.svg`), normalise(sign.svg, sign.source))
  }
  writeFileSync(SOURCES, `${JSON.stringify(signs.map((sign) => sign.source), null, 2)}\n`)
  for (const { source } of signs) console.log(`${source.seal} <- ${source.file} (${source.license}, ${source.author})`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

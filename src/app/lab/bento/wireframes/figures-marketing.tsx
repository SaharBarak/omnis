import { Box, Field, Figure, Label, Lines, Num, Ph, Pill, Row, Rule, Title } from '@/components/bento-lab/wireframe/primitives'
import { DIGEST, LAYER_META, LAYERS_BY_PIN, systemLabel, type DigestEntry } from '@/lib/atlas/layers'
import type { AtlasLayerId } from '@/lib/atlas/types'

/** Names and order come from the layer tables, so the wireframes say what the site says. */
const entryName = (entry: DigestEntry): string => (entry.kind === 'layer' ? LAYER_META[entry.layer].name : systemLabel(entry.system))
const pinOf = (layer: AtlasLayerId): string => `${LAYER_META[layer].pin} ${LAYER_META[layer].name}`
const LAYER_NAMES = LAYERS_BY_PIN.map((layer) => LAYER_META[layer].name).join(', ')
/** What each digest tile shows, for the wireframe's placeholders (BENTO_SITE.md, "The digest"). */
const TILE_CONTENT: Readonly<Record<AtlasLayerId | 'longcount', string>> = {
  maya: 'kin glyph, kin, title',
  body: 'bodygraph, type, profile',
  longcount: 'bar-and-dot places, date, round',
  number: 'life path ring, two more',
  sky: 'sun glyph, sun, moon and rising',
}

/* T1 — Home. Hero is drawn at full precision; the sections below it at section scale. */
export function HomeWireframe() {
  return (
    <Figure
      id="t1-home"
      code="T1"
      title="Home"
      serves="/"
      slots={[
        { n: 1, text: 'Top bar: mark + wordmark, product links, sign in, theme, start CTA' },
        { n: 2, text: 'Claim: the count of systems and the one map, in one line; the sub-line says where to start' },
        { n: 3, text: 'Birth-date field (date, optional time + place) that redraws the atlas live' },
        { n: 4, text: 'Primary CTA: save this map (sign up); secondary: see two people' },
        { n: 5, text: 'Atlas card over dimmed portal artwork; person tabs in the top notch (A, B, +)' },
        { n: 6, text: `Four layer pins on the atlas, numbered in the lead order: ${LAYER_NAMES}` },
        { n: 7, text: 'Digest: one tile per system in the lead order, figure beside a name, a strong line and one support line; the Maya Long Count is read beside the map' },
        { n: 8, text: 'Add a second person: turns the hero into the pair atlas' },
        { n: 9, text: 'Layers: the map taken apart in depth, one layer per scroll step, the digest row under it' },
        { n: 10, text: 'Two people: both maps across the full width, the tie rows under them' },
        { n: 11, text: 'Circle: the ring across the full width, the heaviest pairs in a row under it' },
        { n: 12, text: 'Every day: one full-width board of tiles, the brief in one line' },
        { n: 13, text: 'Method: one full-width chart of measured base rates with the edge rule' },
        { n: 14, text: 'Pricing: plans in one row, the ledger under them' },
        { n: 15, text: 'FAQ in one column, closing CTA over portal artwork' },
      ]}
    >
      <Box cols="1fr" gap={28}>
        <Box cols="auto 1fr auto" align="center" n={1}>
          <Row>
            <Ph h={24} round style={{ width: 24 }} />
            <Label>Pleiad</Label>
          </Row>
          <Row gap={18}>
            <Lines widths={[100]} />
            <Label>Map</Label>
            <Label>Two people</Label>
            <Label>Today</Label>
            <Label>Library</Label>
            <Label>Pricing</Label>
          </Row>
          <Row>
            <Pill>Sign in</Pill>
            <Pill icon />
            <Pill solid>Start free</Pill>
          </Row>
        </Box>

        <Box cols="300px 1fr 250px" gap={36} h={600}>
          <Box rows="auto auto auto 1fr" gap={22}>
            <Box gap={14}>
              <Title size="lg" widths={[92, 70]} n={2} />
              <Lines widths={[60]} />
            </Box>
            <Box frame="solid" gap={10} n={3}>
              <Label>Birth date</Label>
              <Row>
                <span style={{ flex: 1 }}>
                  <Field label="Date" hint="1990-04-12" />
                </span>
                <span style={{ flex: 1 }}>
                  <Field label="Time (optional)" hint="07:40" />
                </span>
              </Row>
              <Field label="Place (optional)" hint="City" />
            </Box>
            <Row>
              <Pill solid n={4}>
                Save this map
              </Pill>
              <Pill>Two people</Pill>
            </Row>
            <Box align="end">
              <Lines widths={[70, 54]} />
            </Box>
          </Box>

          <Box n={5}>
            <Box frame="solid" style={{ borderRadius: 26, padding: 0, overflow: 'hidden' }}>
              <Ph label="Atlas SVG · 4 rings · over dimmed portal artwork" h={600} style={{ border: 0, borderRadius: 0 }} />
            </Box>
            <div style={{ position: 'absolute', top: -2, left: '50%', translate: '-50% 0' }}>
              <Row>
                <Pill solid>A</Pill>
                <Pill>B</Pill>
                <Pill>+</Pill>
              </Row>
            </div>
            {[
              { l: '62%', t: '30%', label: `${pinOf('maya')} · 207` },
              { l: '14%', t: '58%', label: `${pinOf('body')} · Projector 2/4` },
              { l: '58%', t: '82%', label: `${pinOf('number')} · Life path 7` },
              { l: '10%', t: '12%', label: `${pinOf('sky')} · Sun 22° Aries` },
            ].map((pin, i) => (
              <div key={pin.label} style={{ position: 'absolute', left: pin.l, top: pin.t }}>
                <Box n={i === 0 ? 6 : undefined}>
                  <Pill icon>{pin.label}</Pill>
                </Box>
              </div>
            ))}
          </Box>

          <Box rows={[...DIGEST.map(() => '1fr'), 'auto'].join(' ')} gap={10}>
            {DIGEST.map((entry) => `${entryName(entry)} · ${TILE_CONTENT[entry.kind === 'layer' ? entry.layer : entry.system]}`).map((label, i) => (
              <Box key={label} frame="solid" n={i === 0 ? 7 : undefined}>
                <Ph label={label} h={56} />
              </Box>
            ))}
            <Box frame="dashed" n={8}>
              <Pill solid>Add a second person</Pill>
            </Box>
          </Box>
        </Box>

        <Rule />
        <Box gap={14} n={9}>
          <Title widths={[40]} />
          <Ph label="Exploded atlas · four plates in depth · pinned while it scrolls" h={260} />
          <Box cols="1fr 1fr 1fr 1fr" gap={10}>
            {LAYERS_BY_PIN.map((layer) => (
              <Ph key={layer} label={LAYER_META[layer].name} h={56} />
            ))}
          </Box>
        </Box>

        <Box gap={14} n={10}>
          <Title widths={[50]} />
          <Ph label="Pair atlas · both maps across the width · ties drawn by rarity" h={220} />
          {[0, 1, 2].map((i) => (
            <Box key={i} cols="1fr 90px 50px" align="center">
              <Lines widths={[70]} />
              <Lines widths={[100]} />
              <Label>bits</Label>
            </Box>
          ))}
        </Box>

        <Box gap={14} n={11}>
          <Ph label="Circle ring · hub at the centre · strongest ties drawn" h={200} />
          <Box cols="1fr 1fr 1fr" gap={10}>
            {[0, 1, 2].map((i) => (
              <Pill key={i}>Heaviest pair</Pill>
            ))}
          </Box>
        </Box>

        <Box gap={10} n={12}>
          <Box cols="repeat(4, 1fr)" gap={10}>
            {['Kin', 'Moon', 'Sun gate', 'Hebrew date'].map((l) => (
              <Ph key={l} label={l} h={70} />
            ))}
          </Box>
          <Lines widths={[60]} />
        </Box>

        <Box gap={10} n={13}>
          <Ph label="Rarity chart · base-rate bars · line-or-no-line threshold" h={150} />
          <Lines widths={[70]} />
        </Box>

        <Box gap={10} n={14}>
          <Box cols="1fr 1fr 1fr" gap={14}>
            <Ph label="Plan" h={140} />
            <Ph label="Plan" h={140} />
            <Ph label="Plan" h={140} />
          </Box>
          <Ph label="Ledger · row by row" h={80} />
        </Box>

        <Box gap={14} n={15}>
          <Ph label="FAQ · one column" h={120} />
          <Ph label="Closing CTA over portal artwork" h={160} />
        </Box>
      </Box>
    </Figure>
  )
}

/* T2 — Tool: input → live map. Serves /map, /pair, /circle. */
export function ToolWireframe() {
  return (
    <Figure
      id="t2-tool"
      code="T2"
      title="Tool · input to live map"
      serves="/map · /pair · /circle"
      slots={[
        { n: 1, text: 'People rail: one card per person (A, B, …), each with its birth fields; add person' },
        { n: 2, text: 'Map stage: person atlas, pair atlas or circle map depending on people count' },
        { n: 3, text: `Layer switch: all, ${LAYER_NAMES}; switching dims the other rings` },
        { n: 4, text: 'Findings: per-layer readout for one person, tie table for two or more' },
        { n: 5, text: 'Save bar: sign up to keep these people; share link' },
      ]}
    >
      <Box cols="270px 1fr 300px" gap={28} h={560}>
        <Box rows="auto auto auto 1fr" gap={14} n={1}>
          <Title size="sm" widths={[60]} />
          {['A', 'B'].map((p) => (
            <Box key={p} frame="solid" gap={8}>
              <Row>
                <Pill solid>{p}</Pill>
                <Lines widths={[60]} />
              </Row>
              <Field label="Birth date" hint="YYYY-MM-DD" />
              <Field label="Time · place" hint="optional" />
            </Box>
          ))}
          <Box align="start">
            <Pill icon>Add person</Pill>
          </Box>
        </Box>
        <Box rows="auto 1fr" gap={12}>
          <Row>
            <Box n={3}>
              <Row>
                <Pill solid>All</Pill>
                {LAYERS_BY_PIN.map((layer) => (
                  <Pill key={layer}>{LAYER_META[layer].name}</Pill>
                ))}
              </Row>
            </Box>
          </Row>
          <Box n={2}>
            <Ph label="Atlas stage · 1 person = atlas · 2 = pair atlas · 3+ = circle" h={480} />
          </Box>
        </Box>
        <Box rows="1fr auto" gap={14}>
          <Box frame="solid" gap={10} n={4}>
            <Label>Findings</Label>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Box key={i} cols="1fr 46px" align="center">
                <Lines widths={[85, 50]} />
                <Num>{(8 - i).toFixed(1)}</Num>
              </Box>
            ))}
          </Box>
          <Box frame="dashed" gap={8} n={5}>
            <Lines widths={[80]} />
            <Row>
              <Pill solid>Save these people</Pill>
              <Pill icon>Share</Pill>
            </Row>
          </Box>
        </Box>
      </Box>
    </Figure>
  )
}

/* T3 — Board. Serves /today and the signed-in dashboard. */
export function BoardWireframe() {
  return (
    <Figure
      id="t3-board"
      code="T3"
      title="Board"
      serves="/today · /app"
      slots={[
        { n: 1, text: 'Date header: today in Gregorian, kin, Hebrew date; day stepper' },
        { n: 2, text: 'Hero tile: today’s kin with its oracle cross (notched card)' },
        { n: 3, text: 'System rows: one row per enabled system (preferences decide which)' },
        { n: 4, text: 'Signed in: your people today, who shares a tie with the day' },
        { n: 5, text: 'Morning brief opt-in and time' },
      ]}
    >
      <Box gap={20}>
        <Box cols="1fr auto" align="center" n={1}>
          <Title widths={[40]} />
          <Row>
            <Pill icon />
            <Pill>Today</Pill>
            <Pill icon />
          </Row>
        </Box>
        <Box cols="1.1fr 1fr" gap={24} h={420}>
          <Box n={2}>
            <Ph label="Kin tile · seal glyph · oracle cross" h={420} />
          </Box>
          <Box frame="solid" gap={10} n={3}>
            {['Dreamspell', 'Tzolkin', 'Long Count', 'Moon', 'Sun · sidereal', 'HD gate', 'Hebrew', 'Hijri', 'Chinese', 'Panchang'].map((k) => (
              <Box key={k} cols="120px 1fr 20px" align="center">
                <Label>{k}</Label>
                <Lines widths={[70]} />
                <Pill icon />
              </Box>
            ))}
          </Box>
        </Box>
        <Box cols="2fr 1fr" gap={24}>
          <Box frame="solid" n={4} cols="repeat(4, 1fr)">
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} gap={6}>
                <Ph h={56} round style={{ width: 56 }} />
                <Lines widths={[80, 60]} />
              </Box>
            ))}
          </Box>
          <Box frame="dashed" gap={8} n={5}>
            <Lines widths={[90, 60]} />
            <Row>
              <Pill>07:00</Pill>
              <Pill solid>Send me the brief</Pill>
            </Row>
          </Box>
        </Box>
      </Box>
    </Figure>
  )
}

/* T4 — Pricing. */
export function PricingWireframe() {
  return (
    <Figure
      id="t4-pricing"
      code="T4"
      title="Pricing"
      serves="/pricing"
      slots={[
        { n: 1, text: 'Claim + billing note (store billing, cancel anytime)' },
        { n: 2, text: 'Plan columns from PLANS: price, people limit, systems, pair and group maps' },
        { n: 3, text: 'Recommended plan carries the notch and the solid CTA' },
        { n: 4, text: 'Comparison table: every limit in PLANS, one row each' },
        { n: 5, text: 'Billing FAQ' },
      ]}
    >
      <Box gap={22}>
        <Box cols="1fr 1fr" gap={24} n={1}>
          <Title size="lg" widths={[80, 50]} />
          <Lines widths={[90, 80, 40]} />
        </Box>
        <Box cols="repeat(4, 1fr)" gap={14} n={2}>
          {['Free', 'Explorer', 'Complete', 'Practitioner'].map((p, i) => (
            <Box key={p} frame="solid" gap={10} n={i === 2 ? 3 : undefined}>
              <Label>{p}</Label>
              <Num>{['$0', '$5', '$9', '$29'][i]}</Num>
              <Lines widths={[90, 80, 70, 85, 60]} />
              <Pill solid={i === 2}>Choose</Pill>
            </Box>
          ))}
        </Box>
        <Box frame="solid" gap={8} n={4}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Box key={i} cols="2fr repeat(4, 1fr)">
              <Lines widths={[60]} />
              {[0, 1, 2, 3].map((j) => (
                <Lines key={j} widths={[30]} />
              ))}
            </Box>
          ))}
        </Box>
        <Box cols="1fr 1fr" gap={20} n={5}>
          <Lines widths={[70, 96, 80]} />
          <Lines widths={[70, 96, 80]} />
        </Box>
      </Box>
    </Figure>
  )
}

/* T5 / T6 — Library index and article. */
export function LibraryWireframe() {
  return (
    <Figure
      id="t5-library"
      code="T5"
      title="Library index"
      serves="/learn · /app/library"
      slots={[
        { n: 1, text: 'Search field over every system and article' },
        { n: 2, text: 'Feature article with its banner artwork' },
        { n: 3, text: 'System shelf: one tile per reading system, asymmetric grid' },
        { n: 4, text: 'Article list: title, system, reading time' },
      ]}
    >
      <Box gap={20}>
        <Box cols="1fr 360px" align="center">
          <Title widths={[40]} />
          <Field label="Search" hint="Seal, gate, letter, planet…" n={1} />
        </Box>
        <Box cols="2fr 1fr 1fr" rows="180px 180px" gap={14} n={3}>
          <Box n={2} style={{ gridRow: 'span 2' }}>
            <Ph label="Feature article · banner artwork" h={374} />
          </Box>
          <Ph label="System" h={180} />
          <Ph label="System" h={180} />
          <Ph label="System" h={180} />
          <Ph label="System" h={180} />
        </Box>
        <Box frame="solid" gap={10} n={4}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} cols="1fr 100px 60px" align="center">
              <Lines widths={[60]} />
              <Pill>System</Pill>
              <Label>6 min</Label>
            </Box>
          ))}
        </Box>
      </Box>
    </Figure>
  )
}

export function ArticleWireframe() {
  return (
    <Figure
      id="t6-article"
      code="T6"
      title="Article"
      serves="/learn/[system] · library articles"
      slots={[
        { n: 1, text: 'Banner artwork with the title in a bottom-left notch' },
        { n: 2, text: 'Sticky contents rail' },
        { n: 3, text: 'Body, 65ch max, with inline live widgets (e.g. a seal lookup)' },
        { n: 4, text: 'Side card: try it on your own date (links to the map tool)' },
      ]}
    >
      <Box gap={22}>
        <Box n={1}>
          <Ph label="Banner artwork · title in notch" h={220} />
        </Box>
        <Box cols="200px 1fr 260px" gap={32}>
          <Box frame="dashed" gap={8} n={2} align="start">
            {[0, 1, 2, 3, 4].map((i) => (
              <Lines key={i} widths={[80]} />
            ))}
          </Box>
          <Box gap={14} n={3}>
            <Lines widths={[100, 96, 90, 98, 70]} />
            <Ph label="Inline widget" h={120} />
            <Lines widths={[100, 94, 88, 60]} />
          </Box>
          <Box frame="solid" gap={10} n={4} align="start">
            <Lines widths={[80, 60]} />
            <Field label="Your date" hint="YYYY-MM-DD" />
            <Pill solid>Open my map</Pill>
          </Box>
        </Box>
      </Box>
    </Figure>
  )
}

/* T7 — Plain document. */
export function DocumentWireframe() {
  return (
    <Figure
      id="t7-document"
      code="T7"
      title="Plain document"
      serves="/about · /terms · /privacy · /refund · /contact"
      slots={[
        { n: 1, text: 'Title and last-updated line' },
        { n: 2, text: 'Section rail' },
        { n: 3, text: 'Prose at 65ch' },
      ]}
    >
      <Box cols="220px 1fr" gap={36}>
        <Box gap={10} n={2} align="start">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Lines key={i} widths={[70]} />
          ))}
        </Box>
        <Box gap={16}>
          <Title widths={[50]} n={1} />
          <Box gap={14} n={3}>
            <Lines widths={[100, 96, 92, 60]} />
            <Lines widths={[100, 90, 96, 74]} />
            <Lines widths={[98, 92, 40]} />
          </Box>
        </Box>
      </Box>
    </Figure>
  )
}

/* T8 — Auth. */
export function AuthWireframe() {
  return (
    <Figure
      id="t8-auth"
      code="T8"
      title="Sign in · onboarding"
      serves="/login · /onboarding"
      slots={[
        { n: 1, text: 'Form card: email + password, Google, magic code; errors inline under fields' },
        { n: 2, text: 'Artwork panel with the user’s map preview (or today’s kin when signed out)' },
        { n: 3, text: 'Onboarding steps: name, birth date, time + place, Hebrew name; progress in the notch' },
      ]}
    >
      <Box cols="1fr 1fr" gap={28} h={460}>
        <Box frame="solid" gap={14} n={1} align="start">
          <Title widths={[60]} />
          <Field label="Email" hint="you@domain" />
          <Field label="Password" hint="••••••••" />
          <Pill solid>Sign in</Pill>
          <Pill icon>Continue with Google</Pill>
          <Box n={3} frame="dashed" gap={8}>
            <Row>
              <Pill solid>1</Pill>
              <Pill>2</Pill>
              <Pill>3</Pill>
              <Pill>4</Pill>
            </Row>
            <Lines widths={[80]} />
          </Box>
        </Box>
        <Box n={2}>
          <Ph label="Artwork + map preview" h={460} />
        </Box>
      </Box>
    </Figure>
  )
}

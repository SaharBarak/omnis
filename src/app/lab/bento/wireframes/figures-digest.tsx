import { Box, Figure, Label, Lines, Ph, Pill, Row, Value } from '@/components/bento-lab/wireframe/primitives'
import { DIGEST_SHAPE, DIGEST_TILES, tileName, tilePin, type FactId, type FactShape, type TileId } from '@/lib/atlas/digest-shape'
import { needsLabel } from '@/lib/atlas/readout'

/**
 * The digest drawn twice (BENTO_SITE.md, "The digest"): C1 the tile as a
 * component, C2 the containers that hold it. Every fact, label and order
 * comes from DIGEST_SHAPE, the table the built tile reads.
 */

/** What each fact draws, in words, for the placeholders. */
const SKETCH: Readonly<Record<FactId, { readonly mark: string; readonly value: string }>> = {
  kin: { mark: 'seal', value: 'Yellow Galactic Sun' },
  tone: { mark: 'bar-dot', value: 'Galactic' },
  guide: { mark: 'seal', value: 'Red Moon' },
  type: { mark: 'bodygraph', value: 'Projector' },
  profile: { mark: '1/3', value: 'Investigator/Martyr' },
  authority: { mark: 'centre', value: 'Emotional' },
  longcount: { mark: '', value: '13.0.12.3.15' },
  place: { mark: 'bar-dot', value: 'one per place' },
  lifePath: { mark: '7', value: 'The seeker' },
  birthday: { mark: '3', value: 'The voice' },
  expression: { mark: '5', value: 'The traveler' },
  sun: { mark: 'sign', value: 'Pisces' },
  moon: { mark: 'sign', value: 'Leo' },
  rising: { mark: 'sign', value: 'Virgo' },
}

const NOTE: Readonly<Record<TileId, string>> = {
  maya: 'Kin 60',
  body: 'Strategy  Wait for Invitation',
  longcount: "7 Manik' 0 Kumku",
  number: 'Life path',
  sky: 'Sun  12°',
}

/** What a fact waiting on the birth time and place says, as the tile says it. */
const NEEDS = needsLabel('time-and-place')

function Support({ fact, n }: { readonly fact: FactShape; readonly n?: number }) {
  const sketch = SKETCH[fact.id]
  return (
    <Box cols="auto 1fr" gap={4} align="center" n={n} style={{ flex: `${fact.weight} 1 0`, minWidth: 0 }}>
      <Ph h={16} label={sketch.mark} style={{ width: 22 }} />
      <Value size="sm">{sketch.value}</Value>
      <span style={{ gridColumn: '1 / -1' }}>
        <Label>{fact.label}</Label>
      </span>
    </Box>
  )
}

/** One tile at the wireframe's scale; `tags` numbers its slots for the anatomy legend. */
function TileSketch({ tile, tags = false }: { readonly tile: TileId; readonly tags?: boolean }) {
  const shape = DIGEST_SHAPE[tile]
  const lead = SKETCH[shape.lead.id]
  const pin = tilePin(tile)
  return (
    <Box frame="solid" gap={8}>
      <Box cols="1fr auto" align="center" gap={8}>
        <Box n={tags ? 1 : undefined} frame={tags ? 'dashed' : undefined}>
          <Label>{tileName(tile).toUpperCase()}</Label>
        </Box>
        {pin !== null && (
          <Box n={tags ? 2 : undefined} frame={tags ? 'dashed' : undefined}>
            <Pill>{pin}</Pill>
          </Box>
        )}
      </Box>
      <Box cols={lead.mark ? '44px 1fr' : '1fr'} gap={10} align="center" n={tags ? 3 : undefined} frame={tags ? 'dashed' : undefined}>
        {lead.mark && <Ph h={44} label={lead.mark} n={tags ? 4 : undefined} />}
        <Box gap={2}>
          <Value>{lead.value}</Value>
          <Label>{NOTE[tile]}</Label>
        </Box>
      </Box>
      <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
        {shape.supports.map((fact, i) => (
          <Support key={fact.id} fact={fact} n={tags && i === 0 ? 5 : undefined} />
        ))}
      </div>
    </Box>
  )
}

function CardSketch({ n }: { readonly n?: number }) {
  return (
    <Box frame="solid" gap={6} n={n} style={{ width: 240 }}>
      <Label>1 DREAMSPELL</Label>
      <Label>Kin 60</Label>
      <Value>Yellow Galactic Sun</Value>
      <Lines widths={[100, 88]} />
      <Row gap={12}>
        <Label>Wavespell</Label>
        <Label>Castle</Label>
        <Label>Court</Label>
      </Row>
    </Box>
  )
}

/* C1 — Digest tile: the component's anatomy, its five instances and the card a fact opens. */
export function DigestTileWireframe() {
  return (
    <Figure
      id="c1-digest-tile"
      code="C1"
      title="Digest tile"
      serves="AtlasDigest · one tile"
      slots={[
        { n: 1, text: "Name: micro caps, ink 2; a button that opens the system's card (catalog description, what it reads, what it needs)" },
        { n: 2, text: 'Pin toggle: the drawing\'s pin disc, concentric with the tile\'s corner; target 40 px wide (44 on touch), the head\'s height; "Bring Dreamspell forward", aria-pressed. Layers only' },
        { n: 3, text: "Lead: the system's main fact, one button: mark, value at the lead role, note at micro. Opens the lead's card" },
        { n: 4, text: "Lead mark: as tall as the lead's and note's em boxes, overhanging their trimmed lines; a number lead is the figure; the Long Count has none and starts at the edge" },
        { n: 5, text: 'Supports: mark beside value (small), label under it (micro, 400); shares the row by weight (Profile 2); each a button with its own card' },
        { n: 6, text: "Card: eyebrow (pin, name, layer stroke), label, value, meaning, facts, in the card's voice. Top layer, anchored to the fact" },
        { n: 7, text: 'States: rest on elevation 1; hover fills the fact, concentric radius; pressed tints the tile in its layer colour; a tour rings it (spot)' },
        { n: 8, text: 'Missing input: Human Design keeps its lead (empty bodygraph, the input it needs) and drops its supports; Rising and Expression show an open mark' },
      ]}
    >
      <Box cols="minmax(0, 312px) auto 1fr" gap={28} align="start">
        <TileSketch tile={DIGEST_TILES[0]} tags />
        <Box gap={6} align="center">
          <Label>hover / focus / tap →</Label>
        </Box>
        <CardSketch n={6} />
      </Box>

      <Box cols="repeat(auto-fit, minmax(250px, 1fr))" gap={12}>
        {DIGEST_TILES.map((tile) => (
          <TileSketch key={tile} tile={tile} />
        ))}
      </Box>

      <Box cols="repeat(4, minmax(0, 1fr))" gap={12} n={7}>
        {['Rest', 'Fact hovered', 'Pressed', 'Spot'].map((state) => (
          <Box key={state} frame={state === 'Rest' ? 'solid' : 'dashed'} gap={6}>
            <Label>{state}</Label>
            <Ph h={48} label={state === 'Fact hovered' ? 'fill inside the padding' : state === 'Pressed' ? 'layer edge + tint' : state === 'Spot' ? 'layer ring' : 'elevation 1'} />
          </Box>
        ))}
      </Box>

      <Box cols="minmax(0, 312px) 1fr" gap={28} n={8}>
        <Box frame="solid" gap={8}>
          <Label>{tileName('body').toUpperCase()}</Label>
          <Box cols="44px 1fr" gap={10} align="center">
            <Ph h={44} label="empty" />
            <Box gap={2}>
              <Value>{NEEDS}</Value>
            </Box>
          </Box>
        </Box>
        <Box frame="solid" gap={8}>
          <Label>{tileName('sky').toUpperCase()}</Label>
          <Row gap={12}>
            <Ph h={16} label="open" style={{ width: 22 }} />
            <Value>{NEEDS}</Value>
            <Label>Rising</Label>
          </Row>
        </Box>
      </Box>
    </Figure>
  )
}

/* C2 — Digest column: the containers that hold the tiles, and where the card opens in each. */
export function DigestColumnWireframe() {
  return (
    <Figure
      id="c2-digest-column"
      code="C2"
      title="Digest column"
      serves="Hero side column · map figure · people tool · phones"
      slots={[
        { n: 1, text: 'Hero, one person: the column has no panel; five tiles, one per row, share its height down to their content, then the column scrolls; the button keeps the tile gap' },
        { n: 2, text: 'The card hangs toward the inline start, over the stage, its top on the fact\'s top; it flips side or goes above or below to stay in the viewport' },
        { n: 3, text: 'Row container (map figure, tool findings): tiles wrap by their content; a tile alone on its row takes the whole row' },
        { n: 4, text: 'Phone: the tiles become a swiped row; the card docks to the bottom of the viewport and scrolls within half its height' },
      ]}
    >
      <Box cols="200px 1fr 250px" gap={24} h={520} n={1}>
        <Box frame="dashed" gap={10}>
          <Label>Claim</Label>
          <Lines widths={[90, 70, 50]} />
        </Box>
        <Box frame="dashed" gap={10} style={{ position: 'relative' }}>
          <Ph h={460} round label="Atlas stage" />
          <div style={{ position: 'absolute', top: 120, right: 12 }}>
            <CardSketch n={2} />
          </div>
        </Box>
        <Box rows={[...DIGEST_TILES.map(() => '1fr'), 'auto'].join(' ')} gap={6}>
          {DIGEST_TILES.map((tile) => (
            <Box key={tile} frame="solid" gap={4}>
              <Label>{tileName(tile).toUpperCase()}</Label>
              <Value>{SKETCH[DIGEST_SHAPE[tile].lead.id].value}</Value>
              <Lines widths={[80]} />
            </Box>
          ))}
          <Pill solid>Add a second person</Pill>
        </Box>
      </Box>

      <Box gap={10} n={3}>
        <Ph h={180} label="Map figure" />
        <Box cols="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
          {DIGEST_TILES.map((tile) => (
            <Box key={tile} frame="solid" gap={4}>
              <Label>{tileName(tile).toUpperCase()}</Label>
              <Lines widths={[70, 90]} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box cols="200px 1fr" gap={24} n={4}>
        <Box frame="solid" gap={8} style={{ width: 200 }}>
          <Ph h={150} round label="Map" />
          <div style={{ display: 'flex', gap: 6, overflow: 'hidden' }}>
            {DIGEST_TILES.map((tile) => (
              <div key={tile} style={{ flex: 'none', width: 150 }}>
                <Box frame="solid">
                  <Label>{tileName(tile).toUpperCase()}</Label>
                </Box>
              </div>
            ))}
          </div>
          <Label>Swipe for the next tile</Label>
          <Box frame="dashed" gap={4}>
            <Label>Card, docked</Label>
            <Lines widths={[100, 80]} />
          </Box>
        </Box>
        <Box gap={6}>
          <Label>A tap keeps the card; a second tap, Escape or a tap outside closes it</Label>
        </Box>
      </Box>
    </Figure>
  )
}

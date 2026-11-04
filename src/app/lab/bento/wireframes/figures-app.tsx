import { Box, Field, Figure, Label, Lines, Num, Ph, Pill, Row, Title } from '@/components/bento-lab/wireframe/primitives'

function AppFrame({ children, n }: { readonly children: React.ReactNode; readonly n?: number }) {
  return (
    <Box cols="200px 1fr" gap={24} h={560}>
      <Box rows="auto 1fr auto" gap={16} frame="solid" n={n}>
        <Row>
          <Ph h={22} round style={{ width: 22 }} />
          <Label>Pleiad</Label>
        </Row>
        <Box gap={10} align="start">
          {['Today', 'People', 'Circles', 'Calendar', 'Library', 'Systems', 'Settings'].map((k, i) => (
            <Row key={k}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid var(--wf-ink)', background: i === 1 ? 'var(--wf-ink)' : 'transparent' }} />
              <Label>{k}</Label>
            </Row>
          ))}
        </Box>
        <Box frame="dashed" gap={6}>
          <Lines widths={[70, 50]} />
          <Label>Plan · 7 / 15 people</Label>
        </Box>
      </Box>
      {children}
    </Box>
  )
}

/* T9 — App list: people, circles, boards. */
export function AppListWireframe() {
  return (
    <Figure
      id="t9-app-list"
      code="T9"
      title="App list"
      serves="/app/people · /app/groups · /app/boards"
      slots={[
        { n: 1, text: 'App sidebar: sections from the route table; plan usage from the single people count' },
        { n: 2, text: 'Header: count, search, filter by system, add person' },
        { n: 3, text: 'Person tiles: seal glyph, name, kin + sun sign + HD type; selecting two opens the pair' },
        { n: 4, text: 'Compare bar appears when two or more are selected' },
        { n: 5, text: 'Empty state: add the first person with the same birth fields as the public tool' },
      ]}
    >
      <AppFrame n={1}>
        <Box rows="auto 1fr auto" gap={16}>
          <Box cols="1fr auto" align="center" n={2}>
            <Title widths={[30]} />
            <Row>
              <Field label="" hint="Search people" />
              <Pill>Filter</Pill>
              <Pill solid icon>
                Add person
              </Pill>
            </Row>
          </Box>
          <Box cols="repeat(4, 1fr)" gap={12} n={3}>
            {Array.from({ length: 8 }, (_, i) => (
              <Box key={i} frame="solid" gap={8}>
                <Row>
                  <Ph h={36} round style={{ width: 36 }} />
                  <Lines widths={[70]} />
                </Row>
                <Lines widths={[90, 60]} />
              </Box>
            ))}
          </Box>
          <Box cols="1fr 1fr" gap={12}>
            <Box frame="solid" n={4}>
              <Row>
                <Label>2 selected</Label>
                <Pill solid>Open pair map</Pill>
                <Pill>Make a circle</Pill>
              </Row>
            </Box>
            <Box frame="dashed" n={5}>
              <Lines widths={[60, 80]} />
            </Box>
          </Box>
        </Box>
      </AppFrame>
    </Figure>
  )
}

/* T10 — App person: the atlas plus every system tab. */
export function AppPersonWireframe() {
  return (
    <Figure
      id="t10-app-person"
      code="T10"
      title="App person"
      serves="/app/people/[id]"
      slots={[
        { n: 1, text: 'Identity strip: name, birth data, completeness chips (time, place, Hebrew name missing)' },
        { n: 2, text: 'Person atlas, full size, layer switch in the top notch' },
        { n: 3, text: 'Readout table: every layer value as text (the atlas’s text model)' },
        { n: 4, text: 'System tabs: preferred systems only, in IA order; each tab is that system’s full reading' },
        { n: 5, text: 'Ties with your other people, strongest first, each opening the pair map' },
      ]}
    >
      <AppFrame>
        <Box rows="auto 1fr auto" gap={16}>
          <Box cols="1fr auto" align="center" n={1}>
            <Row>
              <Ph h={44} round style={{ width: 44 }} />
              <Title size="sm" widths={[100]} />
            </Row>
            <Row>
              <Pill icon>Add birth time</Pill>
              <Pill icon>Add Hebrew name</Pill>
              <Pill>Share</Pill>
            </Row>
          </Box>
          <Box cols="1.4fr 1fr" gap={16}>
            <Box n={2}>
              <Ph label="Person atlas · layer switch in notch" h={330} />
            </Box>
            <Box frame="solid" gap={9} n={3}>
              {['Kin', 'Tone', 'Oracle', 'Sun · Moon · Rising', 'HD type · profile', 'Authority', 'Life path', 'Expression'].map((k) => (
                <Box key={k} cols="110px 1fr" align="center">
                  <Label>{k}</Label>
                  <Lines widths={[70]} />
                </Box>
              ))}
            </Box>
          </Box>
          <Box cols="1.4fr 1fr" gap={16}>
            <Box frame="solid" gap={10} n={4}>
              <Row>
                {['Dreamspell', 'Tzolkin', 'Astrology', 'Human Design', 'Gematria', 'Numerology', '+4'].map((t, i) => (
                  <Pill key={t} solid={i === 0}>
                    {t}
                  </Pill>
                ))}
              </Row>
              <Lines widths={[90, 70]} />
            </Box>
            <Box frame="solid" gap={8} n={5}>
              {[0, 1, 2].map((i) => (
                <Box key={i} cols="28px 1fr 40px" align="center">
                  <Ph h={28} round />
                  <Lines widths={[70]} />
                  <Num>{['8.0', '3.4', '1.7'][i]}</Num>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </AppFrame>
    </Figure>
  )
}

/* T11 — App relation: pair and circle analysis. */
export function AppRelationWireframe() {
  return (
    <Figure
      id="t11-app-relation"
      code="T11"
      title="App relation"
      serves="/app/pair/[a]/[b] · /app/groups/[id]/analysis"
      slots={[
        { n: 1, text: 'The two people (or the circle) with a swap control' },
        { n: 2, text: 'Pair atlas: two wheels, only engine-found ties drawn, width by bits' },
        { n: 3, text: 'Tie table: tie, system, share of pairs, bits; sorted by bits' },
        { n: 4, text: 'Emergent Human Design: centres the pair defines that neither has alone' },
        { n: 5, text: 'Save to a board (plan-gated)' },
      ]}
    >
      <AppFrame>
        <Box rows="auto 1fr" gap={16}>
          <Box cols="1fr auto" align="center" n={1}>
            <Row>
              <Ph h={36} round style={{ width: 36 }} />
              <Pill icon />
              <Ph h={36} round style={{ width: 36 }} />
              <Title size="sm" widths={[100]} />
            </Row>
            <Pill solid n={5}>
              Save to board
            </Pill>
          </Box>
          <Box cols="1.3fr 1fr" gap={16}>
            <Box n={2}>
              <Ph label="Pair atlas · ties drawn by rarity" h={440} />
            </Box>
            <Box rows="1fr auto" gap={14}>
              <Box frame="solid" gap={9} n={3}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} cols="1fr 70px 50px 36px" align="center">
                    <Lines widths={[80]} />
                    <Pill>System</Pill>
                    <Label>0.4%</Label>
                    <Num>{(8 - i * 1.3).toFixed(1)}</Num>
                  </Box>
                ))}
              </Box>
              <Box n={4}>
                <Ph label="Emergent bodygraph" h={120} />
              </Box>
            </Box>
          </Box>
        </Box>
      </AppFrame>
    </Figure>
  )
}

/* T12 — App system page: numerology, BaZi, Gene Keys, oracles, Tree of Life, moon, calendars, settings. */
export function AppSystemWireframe() {
  return (
    <Figure
      id="t12-app-system"
      code="T12"
      title="App system page"
      serves="numerology · BaZi · Gene Keys · oracles · Tree of Life · moon · calendars · settings"
      slots={[
        { n: 1, text: 'System header with its mural banner in a notch, person picker' },
        { n: 2, text: 'Primary figure for the system (chart, pillars, spheres, tree, month grid)' },
        { n: 3, text: 'Readout rows, hairline-separated, no nested cards' },
        { n: 4, text: 'Plan gate: locked state names the plan that opens it' },
        { n: 5, text: 'Learn link into the matching library article' },
      ]}
    >
      <AppFrame>
        <Box rows="auto 1fr" gap={16}>
          <Box n={1}>
            <Ph label="Mural banner · title in notch · person picker" h={110} />
          </Box>
          <Box cols="1.2fr 1fr" gap={16}>
            <Box n={2}>
              <Ph label="System figure" h={380} />
            </Box>
            <Box rows="1fr auto auto" gap={12}>
              <Box frame="solid" gap={9} n={3}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <Box key={i} cols="110px 1fr" align="center">
                    <Label>Field</Label>
                    <Lines widths={[75]} />
                  </Box>
                ))}
              </Box>
              <Box frame="dashed" n={4}>
                <Row>
                  <Label>Opens on Explorer</Label>
                  <Pill solid>Upgrade</Pill>
                </Row>
              </Box>
              <Box n={5}>
                <Pill icon>Read about this system</Pill>
              </Box>
            </Box>
          </Box>
        </Box>
      </AppFrame>
    </Figure>
  )
}

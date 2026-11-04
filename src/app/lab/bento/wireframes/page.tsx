import { AppListWireframe, AppPersonWireframe, AppRelationWireframe, AppSystemWireframe } from './figures-app'
import { DigestColumnWireframe, DigestTileWireframe } from './figures-digest'
import {
  ArticleWireframe,
  AuthWireframe,
  BoardWireframe,
  DocumentWireframe,
  HomeWireframe,
  LibraryWireframe,
  PricingWireframe,
  ToolWireframe,
} from './figures-marketing'
import { MOTION_INDEX, MotionStoryboards } from './figures-motion'
import { wf } from '@/components/bento-lab/wireframe/primitives'

export const metadata = { title: 'Bento site · wireframes' }

const INDEX = [
  ['t1-home', 'T1 Home'],
  ['t2-tool', 'T2 Tool'],
  ['t3-board', 'T3 Board'],
  ['t4-pricing', 'T4 Pricing'],
  ['t5-library', 'T5 Library'],
  ['t6-article', 'T6 Article'],
  ['t7-document', 'T7 Document'],
  ['t8-auth', 'T8 Auth'],
  ['t9-app-list', 'T9 App list'],
  ['t10-app-person', 'T10 App person'],
  ['t11-app-relation', 'T11 App relation'],
  ['t12-app-system', 'T12 App system'],
  ['c1-digest-tile', 'C1 Digest tile'],
  ['c2-digest-column', 'C2 Digest column'],
] as const

/** Every page template of the bento site, greyscale, with the slot contract under each (BENTO_SITE.md). */
export default function WireframesPage() {
  return (
    <div className={wf.doc} data-print="wire">
      <header className={wf.index}>
        <h1>Bento site · wireframes</h1>
        <p>
          Twelve templates cover all 57 routes. Each numbered slot is a contract: the built page fills it with the data
          named in the legend, from the engine, the measured base rates or the plan table.
        </p>
        <ul className={wf.indexList}>
          {INDEX.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
          <li>
            <a href="#motion">Motion storyboards</a>
          </li>
        </ul>
      </header>
      <HomeWireframe />
      <ToolWireframe />
      <BoardWireframe />
      <PricingWireframe />
      <LibraryWireframe />
      <ArticleWireframe />
      <DocumentWireframe />
      <AuthWireframe />
      <AppListWireframe />
      <AppPersonWireframe />
      <AppRelationWireframe />
      <AppSystemWireframe />
      <DigestTileWireframe />
      <DigestColumnWireframe />
      <header id="motion" className={wf.index}>
        <h2>Motion storyboards</h2>
        <p>
          One storyboard per home section, drawn before the section is built (BENTO_MOTION.md). Frames are scroll or time
          positions; blue dashed arrows are the movement; the tag names the one engine that moves it. Under each strip,
          the frame a reduced-motion reader sees.
        </p>
        <ul className={wf.indexList}>
          {MOTION_INDEX.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
      </header>
      <MotionStoryboards />
    </div>
  )
}

import frame from './frame.module.css'
import type { Chapter } from '@/lib/design/palette-ids'
import { chapterOf, type V2Section } from '@/lib/design/v2-chapters'

/** What a section's element carries for its ground (BENTO_V2.md "Light and dark"). */
export interface GroundProps {
  readonly 'data-chapter': Chapter | undefined
  readonly className: string
}

/**
 * A section's ground as the props that carry it: its chapter, if it is not
 * the page's own, and with a chapter always the plate, which re-declares the
 * frame's aliases over the chapter's palette. One value, so the two never part.
 */
export const groundProps = (section: V2Section, className: string): GroundProps => {
  const chapter = chapterOf(section)
  return { 'data-chapter': chapter, className: chapter ? `${className} ${frame.plate}` : className }
}

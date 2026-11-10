/**
 * The steps of "Draw your map" (docs/redesign/BENTO_V2.md "Draw your map").
 * Each step is done or not by its own rule over what the visitor has given;
 * the current step is the first one not done, so an optional step that is
 * skipped stays current without holding back the steps after it.
 */

export type SketchStepId = 'day' | 'hour' | 'read'

export type SketchStepState = 'done' | 'current' | 'todo'

/** What the page knows about the visitor's map. */
export interface SketchProgress {
  /** A date that parses, and the sample has yielded to it. */
  readonly hasDate: boolean
  /** Both a birth time and a birth place. */
  readonly hasHour: boolean
  /** The map for the current input is drawn. */
  readonly drawn: boolean
}

export interface SketchStep {
  readonly id: SketchStepId
  readonly title: string
  readonly line: string
  readonly optional: boolean
  readonly done: (progress: SketchProgress) => boolean
}

export const SKETCH_STEPS: readonly SketchStep[] = Object.freeze([
  {
    id: 'day',
    title: 'Your birth date',
    line: 'The kin and the life path need nothing more.',
    optional: false,
    done: (p: SketchProgress) => p.hasDate,
  },
  {
    id: 'hour',
    title: 'Hour and place',
    line: 'Optional. They light the bodygraph and the rising sign.',
    optional: true,
    done: (p: SketchProgress) => p.hasHour,
  },
  {
    id: 'read',
    title: 'Read your map',
    line: 'Kin, gates and the sky, as soon as the date settles.',
    optional: false,
    done: (p: SketchProgress) => p.hasDate && p.drawn,
  },
])

export interface SketchStepView extends SketchStep {
  readonly state: SketchStepState
  /** One-based position, as the disc shows it. */
  readonly number: number
}

/** Every step with its state: done by its rule, current when it is the first not done, todo after that. */
export const sketchSteps = (progress: SketchProgress): readonly SketchStepView[] => {
  const current = SKETCH_STEPS.findIndex((step) => !step.done(progress))
  return SKETCH_STEPS.map((step, i) => ({
    ...step,
    number: i + 1,
    state: step.done(progress) ? 'done' : i === current ? 'current' : 'todo',
  }))
}

/** The disc's label: two digits, as the reference sets them. */
export const stepNumeral = (n: number): string => String(n).padStart(2, '0')

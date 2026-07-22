/**
 * App kit — the authed app's component grammar. Ported from the mobile
 * system (packages/mobile/src/components) into the landing-v2 visual
 * language. See docs/redesign/APP_DESIGN_CONTRACT.md for the rules.
 */

export { EASE_OUT, SPRING, fadeUp, staggerParent, VIEWPORT_ONCE, useCountUp } from './motion'
export { Eyebrow, Pill, Hairline, StatNumber, getFlavor, type AppFlavorKey, type AppFlavor } from './primitives'
export { PageSection, Rise, DataRow, StatWord, MeterBar, AddDataChip, LockedPage } from './scaffold'
export { SEAL_COLORS, toSealColor, type SealColor } from './seal-colors'
export { FlavorTabs, type FlavorTab } from './flavor-tabs'
export { FlapBoard, FlapValue, type FlapRow } from './split-flap'
export { Notice } from './notice'
export { SkeletonRow, SkeletonRows, SkeletonCard } from './skeleton-rows'

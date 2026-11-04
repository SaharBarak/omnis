/**
 * What one print records as it goes: the units it ran, the throws it kept
 * from spreading, the fallbacks the self-check took and the faces it lacked.
 * The report (report.mts) is read off it at the end.
 */
import type { FontNeed, PrintReport } from '../../plan/schema.mts';

export type UnitRecord = PrintReport['units'][number];
export type UnitKind = UnitRecord['kind'];
export type UnitStatus = UnitRecord['status'];
export type NodeRecord = PrintReport['nodes'][number];
export type Impurity = PrintReport['impure'][number];
export type Stray = PrintReport['strays'][number];
export type Fallback = PrintReport['fallbacks'][number];
export type Problem = PrintReport['errors'][number];

export interface Journal {
  readonly units: readonly UnitRecord[];
  readonly errors: readonly Problem[];
  readonly fallbacks: readonly Fallback[];
  readonly missingFonts: readonly FontNeed[];
  unit(record: UnitRecord): void;
  /** Records a throw once: the same message on the same key is one problem. */
  error(key: string, message: string): void;
  fallback(record: Fallback): void;
  missingFont(need: FontNeed): void;
}

export function createJournal(): Journal {
  const units: UnitRecord[] = [];
  const errors: Problem[] = [];
  const fallbacks: Fallback[] = [];
  const missingFonts: FontNeed[] = [];
  const seen = new Set<string>();
  return {
    units,
    errors,
    fallbacks,
    missingFonts,
    unit: (record) => {
      units.push(record);
    },
    error: (key, message) => {
      const id = JSON.stringify([key, message]);
      if (seen.has(id)) return;
      seen.add(id);
      errors.push({ key, message });
    },
    fallback: (record) => {
      fallbacks.push(record);
    },
    missingFont: (need) => {
      missingFonts.push(need);
    },
  };
}

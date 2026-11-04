/**
 * A unit of the print (docs/redesign/FIGMA_PRINT.md §3.3.2): timed, isolated so its
 * throw fails it alone, recorded, and committed as its own undo step.
 */
import { attempt } from './failure.mts';
import type { Journal, UnitKind, UnitStatus } from './journal.mts';

/** The panel's progress: told after every unit, and told of units the plan does not count before they run. */
export interface Progress {
  step(label: string): void;
  expect(count: number): void;
}

export interface Units {
  run(kind: UnitKind, key: string, work: () => UnitStatus | Promise<UnitStatus>): Promise<UnitStatus>;
  /** Announces `count` units no plan count holds (each prune the file calls for), before they run. */
  expect(count: number): void;
}

export function createUnits(journal: Journal, progress: Progress): Units {
  return {
    expect: (count) => {
      progress.expect(count);
    },
    async run(kind, key, work) {
      const started = Date.now();
      const status = await attempt(work).match(
        (done) => done,
        (message): UnitStatus => {
          journal.error(key, message);
          return 'failed';
        },
      );
      journal.unit({ kind, key, status, ms: Date.now() - started });
      figma.commitUndo();
      progress.step(`${kind} ${key}`);
      return status;
    },
  };
}

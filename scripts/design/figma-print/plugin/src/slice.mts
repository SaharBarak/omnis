/**
 * Time slicing (docs/redesign/FIGMA_PRINT.md §3.3): the main thread is the editor's,
 * so a unit hands it back once it has worked `sliceMs`, and the canvas draws
 * between slices.
 *
 * The turn goes through the panel, not a timer: a window the person is not
 * looking at has its timers throttled to one a second, then one a minute,
 * while a message round trip is answered at once, so a print runs at the
 * same pace behind another window as in front of it.
 */

export interface Slicer {
  /** Yields to the editor when the current slice has run out. */
  tick(): Promise<void>;
}

/** One turn handed to the editor: done once the panel has answered it. */
export type YieldToEditor = () => Promise<void>;

export function createSlicer(sliceMs: number, yieldToEditor: YieldToEditor): Slicer {
  let since = Date.now();
  return {
    async tick() {
      if (Date.now() - since < sliceMs) return;
      await yieldToEditor();
      since = Date.now();
    },
  };
}

/**
 * The turns the main thread hands the editor through the panel: `next` asks
 * the panel for turn n and waits for its answer, and `resume` is that
 * answer, given to the main thread's message handler.
 */
export function createTurns(ask: (turn: number) => void): { readonly next: YieldToEditor; readonly resume: (turn: number) => void } {
  const waiting = new Map<number, () => void>();
  let count = 0;
  return {
    next: () =>
      new Promise((resolve) => {
        const turn = ++count;
        waiting.set(turn, resolve);
        ask(turn);
      }),
    resume: (turn) => {
      waiting.get(turn)?.();
      waiting.delete(turn);
    },
  };
}

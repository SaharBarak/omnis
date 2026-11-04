/**
 * The plugin's main thread (docs/redesign/FIGMA_PRINT.md §3.3, §10). It opens the
 * panel, which decodes the plan this build carries and posts it; the main
 * thread proves it and prints it, the whole plan in one run, both prints and
 * both viewports. A launch prints once; hot reload launches again.
 */
import type { PlanBundle } from '../../plan/schema.mts';
import { readBundle } from './bundle.mts';
import { capturesOn, removeCaptures } from './captures.mts';
import { messageOf } from './failure.mts';
import { isToMain, type ToUi } from './messages.mts';
import { preparePages, type Pages } from './pages.mts';
import { progressSender, sendPngs, sendReport } from './receiver.mts';
import { printPlan } from './run.mts';
import { SETTINGS } from './settings.mts';
import { createTurns } from './slice.mts';

interface Session {
  bundle: PlanBundle | null;
  pages: Pages | null;
  running: boolean;
}

const session: Session = { bundle: null, pages: null, running: false };

const tell = (message: ToUi): void => {
  figma.ui.postMessage(message);
};

/** The editor's turns between slices, handed over through the panel (slice.mts). */
const turns = createTurns((turn) => {
  tell({ type: 'turn', turn });
});

const showState = (): void => {
  tell({
    type: 'state',
    plan: session.bundle ? { revision: session.bundle.revision, commit: session.bundle.stamp.commit, measuredAt: session.bundle.stamp.measuredAt } : null,
    running: session.running,
  });
};

/** Tells the receiver: the report, then the PNGs once it took the report. */
async function deliver(bundle: PlanBundle, printed: Awaited<ReturnType<typeof printPlan>>): Promise<void> {
  const filed = await sendReport(bundle.file.receiver, printed.report);
  if (filed.isErr()) {
    tell({ type: 'receiver', ok: false, message: `the report did not reach the receiver: ${filed.error}` });
    return;
  }
  const pngs = await sendPngs(bundle.file.receiver, bundle.revision, printed.frames);
  const failed = pngs.failures.length === 0 ? '' : `; ${String(pngs.failures.length)} failed: ${pngs.failures.join('; ')}`;
  tell({ type: 'receiver', ok: pngs.failures.length === 0, message: `the receiver filed the report and ${String(pngs.sent)} PNGs${failed}` });
}

async function printOnce(bundle: PlanBundle): Promise<void> {
  const step = progressSender(bundle.file.receiver, bundle.revision);
  const printed = await printPlan(
    bundle,
    (done, total, label) => {
      tell({ type: 'progress', done, total, label });
      step(done, total, label);
    },
    turns.next,
  );
  session.pages = printed.pages ?? session.pages;
  tell({ type: 'report', report: printed.report });
  if (session.pages) tell({ type: 'captures', captures: capturesOn(session.pages) });
  await deliver(bundle, printed);
}

/** The plan the panel posts, printed once: a second post while it prints, or after, prints nothing. */
async function accept(value: unknown): Promise<void> {
  if (session.bundle) return;
  const bundle = readBundle(value, figma.fileKey);
  if (bundle.isErr()) {
    tell({ type: 'fatal', message: bundle.error });
    return;
  }
  session.bundle = bundle.value;
  session.running = true;
  showState();
  try {
    await printOnce(bundle.value);
  } finally {
    session.running = false;
    showState();
  }
}

async function remove(ids: readonly string[]): Promise<void> {
  const { bundle } = session;
  if (!bundle || session.running) {
    tell({ type: 'removed', removed: 0, kept: ids.length });
    return;
  }
  const pages = session.pages ?? (await preparePages(bundle.file)).unwrapOr(null);
  if (!pages) {
    tell({ type: 'removed', removed: 0, kept: ids.length });
    return;
  }
  session.pages = pages;
  const result = await removeCaptures(ids, pages);
  figma.commitUndo();
  tell({ type: 'removed', ...result });
  tell({ type: 'captures', captures: capturesOn(pages) });
}

async function handle(message: unknown): Promise<void> {
  if (!isToMain(message)) return;
  switch (message.type) {
    case 'plan':
      return accept(message.bundle);
    case 'decode-failed':
      tell({ type: 'fatal', message: `the plan this build carries does not decode: ${message.message}` });
      return;
    case 'remove-captures':
      return remove(message.ids);
    case 'resume':
      turns.resume(message.turn);
      return;
  }
}

figma.showUI(__html__, { title: SETTINGS.panel.title, width: SETTINGS.panel.width, height: SETTINGS.panel.height, themeColors: true });
figma.ui.onmessage = (message: unknown) => {
  handle(message).catch((error: unknown) => {
    tell({ type: 'fatal', message: messageOf(error) });
  });
};
showState();

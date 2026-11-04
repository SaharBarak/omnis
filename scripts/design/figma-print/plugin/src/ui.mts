/**
 * The panel (docs/redesign/FIGMA_PRINT.md §3.3.1, §3.3.5). It decodes the plan this
 * build carries (gzip, then base64, in a script element the build writes)
 * and posts it to the main thread; then it shows the print's progress, its
 * report, what the receiver said, and the old captures on the plugin's
 * pages, with the one button that removes them.
 */
import type { PrintReport } from '../../plan/schema.mts';
import { isToUi, type Capture, type ToMain, type ToUi } from './messages.mts';

const post = (message: ToMain): void => {
  window.parent.postMessage({ pluginMessage: message }, '*');
};

function element<Kind extends HTMLElement>(id: string, kind: { new (): Kind; readonly prototype: Kind }): Kind {
  const found = document.getElementById(id);
  if (!(found instanceof kind)) throw new Error(`the panel has no #${id}`);
  return found;
}

const view = {
  plan: element('plan', HTMLParagraphElement),
  bar: element('bar', HTMLProgressElement),
  step: element('step', HTMLParagraphElement),
  fatal: element('fatal', HTMLParagraphElement),
  summary: element('summary', HTMLUListElement),
  errors: element('errors', HTMLOListElement),
  receiver: element('receiver', HTMLParagraphElement),
  report: element('report', HTMLTextAreaElement),
  copy: element('copy', HTMLButtonElement),
  captures: element('captures', HTMLUListElement),
  remove: element('remove', HTMLButtonElement),
  removal: element('removal', HTMLParagraphElement),
};

let listed: readonly Capture[] = [];
let running = false;

/** One line of a list. */
const item = (text: string): HTMLLIElement => {
  const node = document.createElement('li');
  node.textContent = text;
  return node;
};

const count = (n: number, one: string, many = `${one}s`): string => `${String(n)} ${n === 1 ? one : many}`;

function showReport(report: PrintReport): void {
  const statuses = ['built', 'unchanged', 'failed'] as const;
  const units = statuses.map((status) => count(report.units.filter((unit) => unit.status === status).length, status, status)).join(', ');
  const seconds = (Date.parse(report.finishedAt) - Date.parse(report.startedAt)) / 1000;
  view.summary.replaceChildren(
    item(`${count(report.units.length, 'unit')}: ${units}`),
    item(`${count(report.nodes.length, 'keyed node')}; purity read in ${count(report.read.length, 'unit')}: ${count(report.impure.length, 'binding')} to another print's variables, ${count(report.strays.length, 'layer')} of another print`),
    item(`${count(report.fallbacks.length, 'fallback')}, ${count(report.missingFonts.length, 'missing face')}`),
    item(`${count(report.errors.length, 'error')}, in ${seconds.toFixed(1)} s`),
  );
  view.errors.replaceChildren(...report.errors.map((problem) => item(`${problem.key}: ${problem.message}`)));
  view.report.value = JSON.stringify(report, null, 2);
  view.copy.disabled = false;
}

function showCaptures(captures: readonly Capture[]): void {
  listed = captures;
  view.captures.replaceChildren(...captures.map((capture) => item(`${capture.page}: ${capture.name} (${capture.type})`)));
  view.remove.disabled = running || captures.length === 0;
}

function show(message: ToUi): void {
  switch (message.type) {
    case 'turn':
      // The editor has had its turn once this message ran; the main thread goes on when it hears back.
      post({ type: 'resume', turn: message.turn });
      return;
    case 'state':
      running = message.running;
      view.plan.textContent = message.plan ? `plan ${message.plan.revision} · ${message.plan.commit.slice(0, 7)} · measured ${message.plan.measuredAt}` : 'no plan yet';
      view.remove.disabled = running || listed.length === 0;
      return;
    case 'progress':
      view.bar.max = Math.max(1, message.total);
      view.bar.value = message.done;
      view.step.textContent = `${String(message.done)} of ${String(message.total)} · ${message.label}`;
      return;
    case 'fatal':
      view.fatal.textContent = message.message;
      view.fatal.hidden = false;
      return;
    case 'report':
      showReport(message.report);
      return;
    case 'receiver':
      view.receiver.textContent = message.message;
      view.receiver.dataset.ok = String(message.ok);
      return;
    case 'captures':
      showCaptures(message.captures);
      return;
    case 'removed':
      view.removal.textContent = `${count(message.removed, 'capture')} removed${message.kept > 0 ? `, ${String(message.kept)} kept` : ''}`;
      return;
  }
}

/** Copies the report; a frame the editor grants no clipboard leaves it selected, for the person's own copy. */
async function copyReport(): Promise<void> {
  const copied = await navigator.clipboard.writeText(view.report.value).then(
    () => true,
    () => false,
  );
  if (!copied) view.report.select();
  view.copy.textContent = copied ? 'Copied' : 'Selected: copy it with the keyboard';
}

/** The plan this build carries: base64 of gzip of JSON. */
async function decodePlan(): Promise<unknown> {
  const text = element('print-plan', HTMLScriptElement).textContent.trim();
  const bytes = Uint8Array.from(atob(text), (character) => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const plan: unknown = JSON.parse(await new Response(stream).text());
  return plan;
}

window.addEventListener('message', (event: MessageEvent<unknown>) => {
  const data = event.data;
  const message = typeof data === 'object' && data !== null && 'pluginMessage' in data ? data.pluginMessage : undefined;
  if (isToUi(message)) show(message);
});
view.copy.addEventListener('click', () => {
  void copyReport();
});
view.remove.addEventListener('click', () => {
  view.remove.disabled = true;
  post({ type: 'remove-captures', ids: listed.map((capture) => capture.id) });
});

decodePlan().then(
  (bundle) => {
    post({ type: 'plan', bundle });
  },
  (error: unknown) => {
    post({ type: 'decode-failed', message: error instanceof Error ? error.message : String(error) });
  },
);

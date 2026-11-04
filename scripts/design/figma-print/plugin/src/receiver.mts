/**
 * The receiver (docs/redesign/FIGMA_PRINT.md §3.3.5, receiver.mjs): the report, then
 * a PNG of every route frame, posted to the loopback origin the plan names.
 * Local Network Access may keep the plugin from reaching it at all, so the
 * receiver is told, never waited on: the report shows in the panel either
 * way.
 */
import { err, ok, type Result } from 'neverthrow';
import type { PrintReport } from '../../plan/schema.mts';
import { attempt } from './failure.mts';
import { SETTINGS } from './settings.mts';

const timeout = (ms: number): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`no answer in ${String(ms)} ms`));
    }, ms);
  });

/** One POST, as Figma's sandbox `fetch` takes it, abandoned after the configured wait. */
async function post(url: string, contentType: string, body: string | Uint8Array<ArrayBuffer>): Promise<Result<number, string>> {
  const sent = await attempt(() => Promise.race([fetch(url, { method: 'POST', headers: { 'content-type': contentType }, body }), timeout(SETTINGS.timeoutMs)]));
  if (sent.isErr()) return err(`${url}: ${sent.error}`);
  const response = sent.value;
  if (response.ok) return ok(response.status);
  const answer = await attempt(() => response.text()).unwrapOr('');
  return err(`${url}: the receiver answered ${String(response.status)} ${answer}`.trim());
}

/**
 * The print's progress, one step at a time, so the print is followed from
 * the receiver: a step goes only when the one before it has an answer, so a
 * receiver that never answers holds back no more than one post.
 */
export function progressSender(origin: string, revision: string): (done: number, total: number, label: string) => void {
  let sending = false;
  return (done, total, label) => {
    if (sending) return;
    sending = true;
    void post(`${origin}/progress`, 'application/json; charset=utf-8', JSON.stringify({ revision, done, total, label })).finally(() => {
      sending = false;
    });
  };
}

export const sendReport = (origin: string, report: PrintReport): Promise<Result<number, string>> =>
  post(`${origin}/report`, 'application/json; charset=utf-8', JSON.stringify(report));

/** Each frame's PNG, under the revision printed: the keys sent, and why the others were not. */
export async function sendPngs(origin: string, revision: string, frames: ReadonlyMap<string, FrameNode>): Promise<{ readonly sent: number; readonly failures: readonly string[] }> {
  let sent = 0;
  const failures: string[] = [];
  for (const [key, frame] of frames) {
    const png = await attempt(() => frame.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: SETTINGS.exportScale } }));
    const posted = png.isOk() ? await post(`${origin}/png?key=${encodeURIComponent(key)}&revision=${encodeURIComponent(revision)}`, 'image/png', new Uint8Array(png.value)) : err(`${key}: ${png.error}`);
    if (posted.isOk()) sent += 1;
    else failures.push(posted.error);
  }
  return { sent, failures };
}

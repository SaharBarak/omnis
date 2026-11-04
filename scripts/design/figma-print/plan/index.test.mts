/**
 * What the planner refuses whatever the caller allows (docs/redesign/
 * FIGMA_PRINT.md §3.1, "Provenance"): a tree read across a change of its
 * source, and one whose page loaded again while it was read. `--allow-stale`
 * excuses a stale tree, never one of these. Each case runs the planner on a
 * tree of its own, in an output of its own.
 *
 *   node --test scripts/design/figma-print/plan/index.test.mts
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import type { RawPage } from './raw.mts';

const INDEX = path.join(import.meta.dirname, 'index.mts');
const ROUTE = '/lab/bento/wireframes';
const scratch = await mkdtemp(path.join(os.tmpdir(), 'figma-print-plan-'));
after(() => rm(scratch, { recursive: true, force: true }));

const inputs = { site: 'a7467f646fe7c87a', measure: '337c6dcef1e0a803' };
const stampOf = (over: Partial<RawPage['stamp']> = {}): RawPage['stamp'] => ({
  commit: 'c0ffee',
  dirty: [],
  inputs,
  inputsAfter: inputs,
  reloaded: false,
  base: 'http://localhost:3100',
  browser: '153.0.8010.12',
  buildId: 'development',
  measuredAt: '2026-11-04T00:00:00.000Z',
  ...over,
});

/** The planner's exit and its error output, for the route's one tree stamped `stamp`. */
async function planOf(stamp: RawPage['stamp'], args: readonly string[]): Promise<{ readonly status: number | null; readonly stderr: string }> {
  const out = await mkdtemp(path.join(scratch, 'out-'));
  const raw = path.join(out, 'raw');
  await mkdir(raw);
  await writeFile(path.join(raw, 'lab_bento_wireframes.wide.json'), JSON.stringify({ route: ROUTE, viewport: 'wide', stamp }));
  const result = spawnSync(process.execPath, [INDEX, `--routes=${ROUTE}`, ...args], { env: { PATH: process.env['PATH'] ?? '', FIGMA_PRINT_OUT: out, FIGMA_PRINT_RAW: raw }, encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr };
}

describe('the trees a bundle plans', () => {
  it('are refused when the source changed while they were read, stale allowed or not', async () => {
    const changed = await planOf(stampOf({ inputsAfter: { ...inputs, site: 'ffffffffffffffff' } }), ['--allow-stale']);
    assert.equal(changed.status, 1);
    assert.match(changed.stderr, /the source changed while it was read: \/lab\/bento\/wireframes wide/);
    assert.match(changed.stderr, /--allow-stale does not excuse it/);
  });

  it('are refused when the page loaded again while they were read, stale allowed or not', async () => {
    const reloaded = await planOf(stampOf({ reloaded: true }), ['--allow-stale']);
    assert.equal(reloaded.status, 1);
    assert.match(reloaded.stderr, /the page loaded again while it was read/);
  });

  it('are refused without the digests taken after the read', async () => {
    const { inputsAfter: _after, ...unstamped } = stampOf();
    const refused = await planOf(unstamped as RawPage['stamp'], ['--allow-stale']);
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /the source changed while it was read/);
  });
});

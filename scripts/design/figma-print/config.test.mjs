/**
 * Where the print's stages write (config.mjs): every path under one output,
 * which `FIGMA_PRINT_OUT` moves whole, and the measured trees, which
 * `FIGMA_PRINT_RAW` moves alone. Each case reads the table in a process of
 * its own, as the table is read once, at import.
 *
 *   node --test scripts/design/figma-print/config.test.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { APP } from './config.mjs';

const CONFIG_URL = new URL('./config.mjs', import.meta.url).href;

/** The output and the paths of the table as a process with only `env` reads them. */
const pathsWith = (env) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ['--input-type=module', '-e', `const { CONFIG, OUT } = await import(${JSON.stringify(CONFIG_URL)}); console.log(JSON.stringify({ out: OUT, raw: CONFIG.paths.raw, plans: CONFIG.paths.plans }));`],
      { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' }
    )
  );

describe('the print output', () => {
  it('is .figma-print in the app, the trees and the plans under it, where nothing moves it', () => {
    const out = path.join(APP, '.figma-print');
    assert.deepEqual(pathsWith({}), { out, raw: path.join(out, 'raw'), plans: path.join(out, 'plans') });
  });

  it('moves whole where FIGMA_PRINT_OUT names a directory, blank naming none', () => {
    assert.deepEqual(pathsWith({ FIGMA_PRINT_OUT: '/scratch/print' }), { out: '/scratch/print', raw: '/scratch/print/raw', plans: '/scratch/print/plans' });
    assert.equal(pathsWith({ FIGMA_PRINT_OUT: '  ' }).out, path.join(APP, '.figma-print'));
  });

  it('reads and writes the measured trees apart where FIGMA_PRINT_RAW names a directory, and nothing else with them', () => {
    assert.deepEqual(pathsWith({ FIGMA_PRINT_OUT: '/scratch/plan', FIGMA_PRINT_RAW: '/scratch/trees' }), { out: '/scratch/plan', raw: '/scratch/trees', plans: '/scratch/plan/plans' });
  });
});

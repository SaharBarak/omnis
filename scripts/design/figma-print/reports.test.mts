/**
 * The reports store: safe names, stamps, the previous report of a revision,
 * the envelope the receiver accepts, and writes a reader never sees half of.
 *
 *   node --test scripts/design/figma-print/reports.test.mts
 */
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { PROTOCOL } from './plan/schema.mts';
import { earlierNames, pngPath, reportNames, reportProblem, reportStamp, safeName, segmentOf, stampOf, writeAtomic } from './reports.mts';

describe('safe names', () => {
  it('keeps [A-Za-z0-9_-], replaces the rest, and adds a hash of the key', () => {
    assert.match(safeName('/votes|wide|design'), /^_votes_wide_design-[0-9a-f]{8}$/);
  });

  it('keeps keys that read alike apart', () => {
    assert.notEqual(safeName('/a|wide|wire'), safeName('/a/wide/wire'));
  });

  it('fits a file name however long the key', () => {
    const name = path.basename(pngPath('/r', 'rev', 'x'.repeat(1000)));
    assert.ok(Buffer.byteLength(name) <= 255);
  });

  it('keeps a plain revision as its directory, and makes any other safe', () => {
    assert.equal(segmentOf('5f2c0a91d3e4b7c8'), '5f2c0a91d3e4b7c8');
    for (const revision of ['..', '.', '../etc', 'a/b', '']) assert.match(segmentOf(revision), /^[A-Za-z0-9_-]*-[0-9a-f]{8}$/);
  });
});

describe('stamps', () => {
  it('writes a time in ISO 8601 basic format', () => {
    assert.equal(stampOf('2026-10-28T15:04:05.123Z'), '20261028T150405.123Z');
    assert.equal(stampOf('2026-10-28T17:04:05.123+02:00'), '20261028T150405.123Z');
  });

  it('refuses what does not read as a time', () => {
    assert.equal(stampOf('soon'), null);
    assert.equal(stampOf('+275760-09-13T00:00:00.000Z'), null);
  });

  it('files a report by its print start, or by its arrival when the start is unreadable', () => {
    const arrived = new Date('2026-10-28T16:00:00.000Z');
    assert.equal(reportStamp('2026-10-28T15:00:00.000Z', arrived), '20261028T150000.000Z');
    assert.equal(reportStamp(undefined, arrived), '20261028T160000.000Z');
  });

  it('lists the reports filed before a print started, newest first', () => {
    const names = ['20261028T150000.000Z.json', 'check.md', 'png', '20261028T140000.000Z.json', '20261028T160000.000Z.json', 'latest.json', '20261028T155959.999Z.json.0a.partial'];
    assert.deepEqual(reportNames(names), ['20261028T140000.000Z.json', '20261028T150000.000Z.json', '20261028T160000.000Z.json']);
    assert.deepEqual(earlierNames(names, '20261028T160000.000Z'), ['20261028T150000.000Z.json', '20261028T140000.000Z.json']);
    assert.deepEqual(earlierNames(names, '20261028T140000.000Z'), []);
  });
});

describe('the report envelope', () => {
  const report = { protocol: PROTOCOL, revision: 'r1', units: [], nodes: [] };

  it('accepts a report of this protocol with its revision, units and nodes', () => {
    assert.equal(reportProblem(report), null);
  });

  it('names what is missing', () => {
    assert.match(reportProblem([]) ?? '', /not a JSON object/);
    assert.match(reportProblem({ ...report, protocol: PROTOCOL - 1 }) ?? '', new RegExp(`protocol ${PROTOCOL - 1}`));
    assert.match(reportProblem({ ...report, revision: '' }) ?? '', /revision/);
    assert.match(reportProblem({ ...report, units: {} }) ?? '', /units/);
    assert.match(reportProblem({ ...report, nodes: undefined }) ?? '', /nodes/);
  });
});

describe('atomic writes', () => {
  it('writes the whole file under its name and leaves nothing beside it', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'figma-print-reports-'));
    try {
      const file = path.join(directory, 'deep', 'latest.json');
      await writeAtomic(file, '{"a":1}');
      await writeAtomic(file, '{"a":2}');
      assert.equal(await readFile(file, 'utf8'), '{"a":2}');
      assert.deepEqual(await readdir(path.dirname(file)), ['latest.json']);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

/**
 * The receiver (docs/redesign/FIGMA_PRINT.md §3.3): takes the plugin's print reports
 * and PNG exports and files them under CONFIG.paths.reports for the check.
 * It serves no plans, since the plugin carries its own, and no print waits
 * on it: Local Network Access may keep the plugin from reaching it at all.
 *
 * It listens on the loopback interface only, on both address families,
 * because `localhost` may resolve to either. Plugin requests carry a null
 * origin, so every response allows any origin; the Host check turns away a
 * page that rebinds its own name to a loopback address.
 *
 *   GET  /health                           {ok, revision} of the current plan bundle
 *   POST /report                           a PrintReport, as JSON
 *   POST /png?key=<key>[&revision=<rev>]   PNG bytes, filed under that revision,
 *                                          or else the current bundle's
 *   POST /progress                         {revision, done, total, label}: the
 *                                          running print's last step, kept as
 *                                          progress.json with when it came
 *
 * usage: node scripts/design/figma-print/receiver.mjs
 */
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { CONFIG } from './config.mjs';
import { latestPath, pngPath, progressPath, reportPath, reportProblem, reportStamp, writeAtomic } from './reports.mts';

const { host, port, bodyLimit } = CONFIG.receiver;
const ROOT = CONFIG.paths.reports;
/** The IPv4 and IPv6 loopback addresses. */
const LOOPBACK = ['127.0.0.1', '::1'];
/** Listen errors that mean the machine has no such address family, not that the port is taken. */
const NO_FAMILY = new Set(['EADDRNOTAVAIL', 'EAFNOSUPPORT']);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const literalOf = (address) => (address.includes(':') ? `[${address}]` : address);
/** The authorities a request may name: the configured host and each loopback literal, at the port. */
const AUTHORITIES = new Set([host, ...LOOPBACK.map(literalOf)].map((name) => `${name}:${port}`));

const messageOf = (error) => (error instanceof Error ? error.message : String(error));

/** What one request gets: a status, a JSON body or none, and what its log line adds. */
const answer = (status, body, note = '') => ({ status, body, note });
const refuse = (status, error) => answer(status, { ok: false, error }, error);

/** The revision a bundle's text names, or null. */
function revisionIn(text) {
  try {
    const revision = JSON.parse(text)?.revision;
    return typeof revision === 'string' && revision !== '' ? revision : null;
  } catch {
    return null;
  }
}

/** Reads the current bundle's revision, and reads it again only when the file changes. */
function revisionReader(file) {
  let known = { version: '', revision: null };
  return async () => {
    const info = await stat(file).catch(() => null);
    if (!info) return null;
    const version = `${info.mtimeMs}:${info.size}`;
    if (version !== known.version) known = { version, revision: await readFile(file, 'utf8').then(revisionIn, () => null) };
    return known.revision;
  };
}

const bundleRevision = revisionReader(CONFIG.paths.bundle);

/** The request's body, or null once it outgrows the limit (the answer then closes the connection). */
function bodyOf(request) {
  if (Number(request.headers['content-length']) > bodyLimit) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const take = (chunk) => {
      size += chunk.length;
      if (size <= bodyLimit) {
        chunks.push(chunk);
        return;
      }
      request.off('data', take);
      request.pause();
      resolve(null);
    };
    request.on('data', take);
    request.once('end', () => resolve(Buffer.concat(chunks)));
    request.once('error', reject);
  });
}

function jsonOf(bytes) {
  try {
    return { ok: true, value: JSON.parse(bytes.toString('utf8')) };
  } catch (error) {
    return { ok: false, error: `the body is not JSON: ${messageOf(error)}` };
  }
}

const tooLarge = () => refuse(413, `the body is over ${bodyLimit} bytes`);

async function health() {
  return answer(200, { ok: true, revision: await bundleRevision() });
}

/** Files a report under its revision and as the latest; a report from another file is refused, so latest.json always speaks for this one. */
async function takeReport(request) {
  const body = await bodyOf(request);
  if (body === null) return tooLarge();
  const parsed = jsonOf(body);
  if (!parsed.ok) return refuse(400, parsed.error);
  const problem = reportProblem(parsed.value);
  if (problem) return refuse(400, problem);
  const { revision, fileKey, startedAt } = parsed.value;
  if (typeof fileKey === 'string' && fileKey !== CONFIG.figma.fileKey) return refuse(409, `the report is of file ${fileKey}, and this pipeline prints ${CONFIG.figma.fileKey}`);
  const file = reportPath(ROOT, revision, reportStamp(startedAt, new Date()));
  await writeAtomic(file, body);
  await writeAtomic(latestPath(ROOT), body);
  return answer(200, { ok: true, path: file }, file);
}

async function takePng(request, url) {
  const key = url.searchParams.get('key');
  if (!key) return refuse(400, 'the key parameter is missing');
  const revision = url.searchParams.get('revision') || (await bundleRevision());
  if (!revision) return refuse(409, 'no revision to file the PNG under: pass one, or build the plan bundle first');
  const body = await bodyOf(request);
  if (body === null) return tooLarge();
  if (!body.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return refuse(400, 'the body is not a PNG');
  const file = pngPath(ROOT, revision, key);
  await writeAtomic(file, body);
  return answer(200, { ok: true, path: file }, file);
}

/** Keeps the running print's last step, so a print is followed without a look at the editor. */
async function takeProgress(request) {
  const body = await bodyOf(request);
  if (body === null) return tooLarge();
  const parsed = jsonOf(body);
  if (!parsed.ok) return refuse(400, parsed.error);
  const { revision, done, total, label } = parsed.value ?? {};
  if (typeof revision !== 'string' || !Number.isInteger(done) || !Number.isInteger(total) || typeof label !== 'string') return refuse(400, 'a step names its revision, done, total and label');
  await writeAtomic(progressPath(ROOT), `${JSON.stringify({ revision, done, total, label, at: new Date().toISOString() })}\n`);
  return answer(200, { ok: true }, `${done}/${total} ${label}`);
}

const ROUTES = new Map([
  ['GET /health', health],
  ['POST /report', takeReport],
  ['POST /png', takePng],
  ['POST /progress', takeProgress],
]);

async function outcomeOf(request) {
  const authority = request.headers.host?.toLowerCase() ?? '';
  if (!AUTHORITIES.has(authority)) return refuse(403, `${authority || 'a request without a host'} is not this receiver`);
  if (request.method === 'OPTIONS') return answer(204, null);
  const url = new URL(request.url ?? '/', `http://${authority}`);
  const route = ROUTES.get(`${request.method} ${url.pathname}`);
  return route ? route(request, url) : refuse(404, 'not found');
}

function send(response, { status, body }) {
  const json = body === null ? undefined : JSON.stringify(body);
  response.writeHead(status, {
    ...CORS,
    ...(json === undefined ? {} : { 'content-type': 'application/json; charset=utf-8' }),
    // A refusal can come before the body is read; closing keeps an unread body out of the next request.
    ...(status >= 400 ? { connection: 'close' } : {}),
  });
  response.end(json);
}

async function handle(request, response) {
  const started = performance.now();
  const outcome = await outcomeOf(request).catch((error) => refuse(500, messageOf(error)));
  send(response, outcome);
  const took = `${(performance.now() - started).toFixed(1)}ms`;
  console.log([new Date().toISOString(), request.method, request.url, outcome.status, took, outcome.note].filter(Boolean).join(' '));
}

/** Listens on one loopback address: the server, or null when the machine has no such address family. */
function listenOn(address) {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      handle(request, response).catch((error) => console.error(`receiver: ${messageOf(error)}`));
    });
    const failed = (error) => (NO_FAMILY.has(error.code) ? resolve(null) : reject(error));
    server.once('error', failed);
    server.listen({ host: address, port }, () => {
      server.off('error', failed);
      server.on('error', (error) => console.error(`receiver: ${address}: ${messageOf(error)}`));
      resolve(server);
    });
  });
}

const urlOf = (server) => {
  const { address, port: bound } = server.address();
  return `http://${literalOf(address)}:${bound}`;
};

async function start() {
  const settled = await Promise.allSettled(LOOPBACK.map(listenOn));
  const servers = settled.flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []));
  const failure = settled.find((result) => result.status === 'rejected');
  if (failure || servers.length === 0) {
    for (const server of servers) server.close();
    console.error(`receiver: cannot listen on port ${port}: ${failure ? messageOf(failure.reason) : 'this machine has no loopback address'}`);
    process.exitCode = 1;
    return;
  }
  const absent = LOOPBACK.filter((_, at) => settled[at]?.status === 'fulfilled' && settled[at].value === null);
  console.log(`receiver: ${servers.map(urlOf).join(' and ')}${absent.length > 0 ? ` (no ${absent.join(', ')} here)` : ''}, filing under ${ROOT}`);
  const stop = () => {
    for (const server of servers) {
      server.close();
      server.closeAllConnections();
    }
    console.log('receiver: stopped');
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

await start();

/**
 * The print's offline stages in one call (docs/redesign/FIGMA_PRINT.md §10): measure
 * the fixture build of HEAD (`serve-build.mjs`), plan, and rebuild the plugin bundle that carries
 * the plans. Each stage reads what the one before it wrote, so the run stops
 * at the first stage that fails, with that stage's exit code.
 *
 * usage: node scripts/design/figma-print/build.mjs [base-url] [--routes=/a,/b] [--no-measure]
 */
import { spawn } from 'node:child_process';
import { constants } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { APP, CONFIG } from './config.mjs';

const HERE = import.meta.dirname;
const USAGE = 'usage: node scripts/design/figma-print/build.mjs [base-url] [--routes=/a,/b] [--no-measure]';

const messageOf = (error) => (error instanceof Error ? error.message : String(error));

/** The run the arguments ask for, or why they ask for none. */
function runOf(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: { routes: { type: 'string' }, 'no-measure': { type: 'boolean', default: false } },
    });
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
  const { values, positionals } = parsed;
  if (positionals.length > 1) return { ok: false, error: `one base URL at most, not ${positionals.join(' ')}` };
  const [base] = positionals;
  if (base !== undefined && !URL.canParse(base)) return { ok: false, error: `${base} is not a URL` };
  const routes = values.routes?.split(',');
  if (routes?.some((route) => !route.startsWith('/'))) return { ok: false, error: `--routes takes paths that start with /, not ${values.routes}` };
  return { ok: true, base, routes, measure: !values['no-measure'] };
}

/** Runs one stage's script with this Node, in the app, on this terminal: its exit code. */
const script = (file, args) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(HERE, file), ...args], { cwd: APP, stdio: 'inherit' });
    child.once('error', (error) => {
      console.error(`build: ${file}: ${messageOf(error)}`);
      resolve(1);
    });
    // A stage killed by a signal exits the way a shell reports it: 128 plus the signal's number.
    child.once('exit', (code, signal) => resolve(code ?? 128 + (constants.signals[signal] ?? 0)));
  });

/** Rebuilds the plugin bundle around the new plans: 0, or 1 with the reason on stderr. */
async function bundlePlugin() {
  try {
    const { buildPlugin } = await import(pathToFileURL(path.join(CONFIG.paths.plugin, 'build-plugin.mjs')).href);
    if (typeof buildPlugin !== 'function') throw new Error('plugin/build-plugin.mjs exports no buildPlugin');
    await buildPlugin({ bundlePath: CONFIG.paths.bundle, outDir: path.join(CONFIG.paths.plugin, 'dist') });
    return 0;
  } catch (error) {
    console.error(`build: plugin: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
    return 1;
  }
}

const stagesOf = ({ base, routes, measure }) => {
  const only = routes ? [`--routes=${routes.join(',')}`] : [];
  return [
    { name: 'measure', skipped: measure ? null : '--no-measure', run: () => script('measure.mjs', [...(base ? [base] : []), ...only]) },
    { name: 'plan', skipped: null, run: () => script(path.join('plan', 'index.mts'), only) },
    { name: 'plugin', skipped: null, run: bundlePlugin },
  ];
};

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const say = (stage, outcome) => console.log(`build · ${stage} · ${outcome}`);

async function main(argv) {
  const run = runOf(argv);
  if (!run.ok) {
    console.error(`build: ${run.error}\n${USAGE}`);
    return 2;
  }
  for (const stage of stagesOf(run)) {
    if (stage.skipped) {
      say(stage.name, `skipped (${stage.skipped})`);
      continue;
    }
    const started = performance.now();
    const code = await stage.run();
    const took = seconds(performance.now() - started);
    if (code !== 0) {
      say(stage.name, `failed with exit ${code} · ${took}`);
      return code;
    }
    say(stage.name, `ok · ${took}`);
  }
  return 0;
}

process.exitCode = await main(process.argv.slice(2));

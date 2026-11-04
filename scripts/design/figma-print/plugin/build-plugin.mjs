/**
 * The plugin bundle (docs/redesign/FIGMA_PRINT.md §3.3, §10): the main thread as one
 * script, the panel as one HTML file with its script and the plan inlined,
 * and the manifest beside them, all generated from config.mjs. The plan
 * rides in the panel as base64 of gzip, in a script element of an inert
 * type, and the panel decodes it; nothing is fetched to print.
 *
 * usage: node scripts/design/figma-print/plugin/build-plugin.mjs [bundle.json] [out-dir]
 *
 * The manifest is written to the out dir's parent, so Figma desktop imports
 * plugin/manifest.json and finds the scripts in plugin/dist.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { CONFIG } from '../config.mjs';

const HERE = import.meta.dirname;
const SRC = path.join(HERE, 'src');
const USAGE = 'usage: node scripts/design/figma-print/plugin/build-plugin.mjs [bundle.json] [out-dir]';

/**
 * What the plugin shows, and how it lays out and exports what it prints.
 * The figma-print table (config.mjs) carries none of it yet; these entries
 * belong in CONFIG.figma beside the file they print into.
 */
export const PLUGIN = {
  name: 'Pleiad print',
  id: 'pleiad-print',
  panel: { width: 360, height: 640 },
  /** The scale each route frame's PNG is exported at. */
  exportScale: 0.5,
  /** px between blocks, sections and the frames in a section, and around what a section holds. */
  gutter: 120,
  /** px between the variants of a component set. */
  spacing: 40,
};

/** The places src/ui.html takes the build's output. */
const SLOT = { title: '<!--print:title-->', plan: '<!--print:plan-->', script: '<!--print:ui-script-->' };

/**
 * The Figma plugin sandbox runs ES2020, and the panel is an iframe; both take one classic script.
 * The module paths esbuild writes into a bundle are relative to the plugin, so the bytes are the
 * same wherever the build is run from.
 */
const ESBUILD = { bundle: true, format: 'iife', target: 'es2020', platform: 'browser', write: false, legalComments: 'none', logLevel: 'silent', charset: 'utf8', absWorkingDir: HERE };

/** The receiver's origin, the one the plan and the manifest both name. */
const receiverOrigin = () => `http://${CONFIG.receiver.host}:${CONFIG.receiver.port}`;

/** What the plugin reads as PRINT_SETTINGS (src/settings.mts), but its printer stamp. */
const settingsOf = () => ({
  namespace: CONFIG.figma.namespace,
  timeoutMs: CONFIG.receiver.holdMs,
  exportScale: PLUGIN.exportScale,
  gutter: PLUGIN.gutter,
  spacing: PLUGIN.spacing,
  panel: { title: PLUGIN.name, ...PLUGIN.panel },
});

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ENTITIES[character]);

/** A script inlined in an element: a `</script` or `<!--` inside it would end or bend the element, so each is escaped. */
const inlineScript = (code) => code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

async function scriptOf(entry, define, options = {}) {
  const result = await build({ ...ESBUILD, ...options, entryPoints: [path.join(SRC, entry)], define });
  const [output] = result.outputFiles;
  if (!output) throw new Error(`esbuild wrote nothing for ${entry}`);
  return output.text;
}

/**
 * The settings with the printer's stamp: the sha256 of the main thread as
 * built with every other setting and an empty stamp, its whitespace and
 * comments left out. The bytes are the same wherever the build runs, so the
 * stamp changes when what the plugin does, or the settings it does it with,
 * change, and a comment alone reprints nothing.
 */
async function stampedSettings() {
  const settings = settingsOf();
  const unstamped = await scriptOf('code.mts', { PRINT_SETTINGS: JSON.stringify({ ...settings, printer: '' }) }, { minifyWhitespace: true });
  return { ...settings, printer: createHash('sha256').update(unstamped).digest('hex') };
}

/** Puts a value in a template's slot, which must be there; a function replacement keeps `$` in the value literal. */
function fill(template, slot, value) {
  if (!template.includes(slot)) throw new Error(`src/ui.html has no ${slot}`);
  return template.replaceAll(slot, () => value);
}

function manifestOf(outDir, manifestDir) {
  const relative = (file) => path.relative(manifestDir, path.join(outDir, file)).split(path.sep).join('/');
  const origin = receiverOrigin();
  return {
    name: PLUGIN.name,
    id: PLUGIN.id,
    api: '1.0.0',
    main: relative('code.js'),
    ui: relative('ui.html'),
    editorType: ['figma'],
    documentAccess: 'dynamic-page',
    enablePrivatePluginApi: true,
    networkAccess: {
      allowedDomains: [origin],
      devAllowedDomains: [origin],
      reasoning: `The plugin posts its print report and the PNG of each route frame to the print receiver (scripts/design/figma-print/receiver.mjs), which listens on the loopback interface at ${origin}.`,
    },
  };
}

/**
 * Builds the plugin around a plan bundle: `<outDir>/code.js`, `<outDir>/ui.html`
 * and the manifest in the out dir's parent. Returns the files written.
 */
export async function buildPlugin({ bundlePath = CONFIG.paths.bundle, outDir = path.join(CONFIG.paths.plugin, 'dist') } = {}) {
  const text = await readFile(bundlePath, 'utf8');
  const plan = JSON.parse(text);
  const origin = receiverOrigin();
  if (plan?.file?.receiver !== origin) throw new Error(`the plan sends reports to ${plan?.file?.receiver}, and the manifest allows ${origin}; plan again`);
  const define = { PRINT_SETTINGS: JSON.stringify(await stampedSettings()) };
  const [code, ui, template] = await Promise.all([scriptOf('code.mts', define), scriptOf('ui.mts', define), readFile(path.join(SRC, 'ui.html'), 'utf8')]);
  const packed = gzipSync(Buffer.from(text, 'utf8')).toString('base64');
  const html = [
    [SLOT.title, escapeHtml(PLUGIN.name)],
    [SLOT.plan, `<script type="application/octet-stream" id="print-plan">${packed}</script>`],
    [SLOT.script, `<script>${inlineScript(ui)}</script>`],
  ].reduce((page, [slot, value]) => fill(page, slot, value), template);
  const manifestDir = path.dirname(outDir);
  const files = { code: path.join(outDir, 'code.js'), ui: path.join(outDir, 'ui.html'), manifest: path.join(manifestDir, 'manifest.json') };
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(files.code, code),
    writeFile(files.ui, html),
    writeFile(files.manifest, `${JSON.stringify(manifestOf(outDir, manifestDir), null, 2)}\n`),
  ]);
  return { ...files, revision: plan.revision, planBytes: Buffer.byteLength(text), packedBytes: packed.length };
}

if (import.meta.main) {
  const [bundlePath, outDir, ...rest] = process.argv.slice(2);
  if (rest.length > 0) {
    console.error(USAGE);
    process.exitCode = 2;
  } else {
    buildPlugin({ ...(bundlePath ? { bundlePath: path.resolve(bundlePath) } : {}), ...(outDir ? { outDir: path.resolve(outDir) } : {}) }).then(
      (built) => console.log(`plugin ${built.revision}: ${built.code}, ${built.ui} (plan ${built.planBytes} bytes, carried in ${built.packedBytes}), ${built.manifest}`),
      (error) => {
        console.error(`build-plugin: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
      },
    );
  }
}

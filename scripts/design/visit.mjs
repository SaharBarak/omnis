/**
 * How a design script visits the site (docs/redesign/FIGMA_PRINT.md §3.1): as
 * no one. Nothing that counts a visit runs and motion is reduced, so every
 * figure has landed.
 */

/** Hosts that count a visit: a capture is not one. */
const COUNTS_A_VISIT = /(^|\.)(googletagmanager\.com|google-analytics\.com|posthog\.com|i\.posthog\.com)$/;

/** A cold dev server compiles a route on its first visit. */
const LOAD_MS = 180_000;
/** How long a loaded page may take to fall quiet. */
const SETTLE_MS = 15_000;

/**
 * Opens `url` in a fresh page of `browser` at `viewport`.
 * @param {{ newPage: (options: object) => Promise<import('playwright').Page> }} browser
 * @param {string} url
 * @param {{ width: number, height: number }} viewport
 * @returns {Promise<{ page: import('playwright').Page, status: number }>} status 0 when the document never loaded
 */
export async function visit(browser, url, viewport) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  await page.route((target) => COUNTS_A_VISIT.test(target.hostname), (route) => route.abort());
  const response = await page.goto(url, { waitUntil: 'load', timeout: LOAD_MS }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => undefined);
  return { page, status: response?.status() ?? 0 };
}

/**
 * Whether the page shows `print`: the one root it prints inside names it.
 * A page has no switch between prints; each print is its own page state.
 * @param {import('playwright').Page} page
 * @param {string} root the root selector
 * @param {string} print
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function hasPrint(page, root, print) {
  const found = await page.evaluate((selector) => [...document.querySelectorAll(selector)].map((element) => element.getAttribute('data-print')), root);
  if (found.length !== 1) return { ok: false, error: `${found.length} elements match ${root}; a printed page has exactly one` };
  return found[0] === print ? { ok: true } : { ok: false, error: `the root prints ${found[0]}, not ${print}` };
}

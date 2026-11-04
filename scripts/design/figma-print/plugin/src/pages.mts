/**
 * The pages the plugin writes, by role (docs/redesign/FIGMA_PRINT.md §8):
 * found by the role they carry; on the first run, the one page no role
 * carries whose name the role names; or created while the file's plan allows
 * another page. Two pages one role could adopt, or one page two roles could,
 * stop the print before any page changes. No other page is read or written.
 */
import { err, ok, type Result } from 'neverthrow';
import type { FileSpec } from '../../plan/schema.mts';
import { attempt, attemptSync } from './failure.mts';
import { ENTRY, read, write } from './keys.mts';

export type PageSpec = FileSpec['pages'][number];
export type Role = PageSpec['role'];
export type Pages = ReadonlyMap<Role, PageNode>;

const byRole = (role: Role): PageNode | null => figma.root.children.find((page) => read(page, ENTRY.role) === role) ?? null;

/** The names a role may adopt a page by. */
const namesOf = (spec: PageSpec): ReadonlySet<string> => new Set([spec.name, ...spec.adopt]);

/** What each role will take: its keyed page, the one unclaimed page of its names, or a new page. */
type Choice = { readonly kind: 'keyed' | 'adopt'; readonly page: PageNode } | { readonly kind: 'create' };

/**
 * Every role's page, decided before any page changes: a page no role carries
 * is adopted only when it is the one page of the role's names and no other
 * role could take it, and new pages fit under the plan's page limit.
 */
function choose(file: FileSpec): Result<ReadonlyMap<Role, Choice>, string> {
  const free = figma.root.children.filter((page) => read(page, ENTRY.role) === '');
  const choices = new Map<Role, Choice>();
  for (const spec of file.pages) {
    const keyed = byRole(spec.role);
    if (keyed) {
      choices.set(spec.role, { kind: 'keyed', page: keyed });
      continue;
    }
    const named = free.filter((page) => namesOf(spec).has(page.name));
    if (named.length > 1) return err(`${named.length} pages could be the ${spec.role} page (${named.map((page) => page.name).join(', ')}); rename all but one`);
    const page = named[0];
    const rival = page ? file.pages.find((other) => other.role !== spec.role && byRole(other.role) === null && namesOf(other).has(page.name)) : undefined;
    if (page && rival) return err(`the page ${page.name} could be the ${spec.role} page or the ${rival.role} page; rename it`);
    choices.set(spec.role, page ? { kind: 'adopt', page } : { kind: 'create' });
  }
  const creating = [...choices.values()].filter((choice) => choice.kind === 'create').length;
  if (figma.root.children.length + creating > file.pageLimit) return err(`the print needs ${creating} new page(s), and the file has ${figma.root.children.length} of the ${file.pageLimit} its plan allows`);
  return ok(choices);
}

/** A new page; the file's plan refuses one past its page limit, and the refusal is the reason. */
const created = (spec: PageSpec): Result<PageNode, string> =>
  attemptSync(() => figma.createPage()).mapErr((message) => `the file has no ${spec.role} page, and a new one was refused: ${message}`);

function pageFor(spec: PageSpec, choice: Choice): Result<PageNode, string> {
  const page = choice.kind === 'create' ? created(spec) : ok(choice.page);
  return page.map((node) => {
    write(node, ENTRY.role, spec.role);
    if (node.name !== spec.name) node.name = spec.name;
    return node;
  });
}

async function pagesFor(file: FileSpec): Promise<Result<Pages, string>> {
  const chosen = choose(file);
  if (chosen.isErr()) return err(chosen.error);
  const pages = new Map<Role, PageNode>();
  for (const spec of file.pages) {
    const page = pageFor(spec, chosen.value.get(spec.role)!);
    if (page.isErr()) return err(page.error);
    await page.value.loadAsync();
    pages.set(spec.role, page.value);
  }
  return ok(pages);
}

/** Every page the plan writes, loaded; the first page that cannot be had stops the print, a page Figma refuses to find or load among them. */
export async function preparePages(file: FileSpec): Promise<Result<Pages, string>> {
  return attempt(() => pagesFor(file))
    .mapErr((message) => `the pages the plan writes could not be had: ${message}`)
    .andThen((pages) => pages);
}

/** A role's page; preflight proved every role the plan names has one. */
export function pageOf(pages: Pages, role: Role): PageNode {
  const page = pages.get(role);
  if (!page) throw new Error(`no ${role} page`);
  return page;
}

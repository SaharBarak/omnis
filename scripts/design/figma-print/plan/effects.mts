/**
 * Effect styles (docs/redesign/FIGMA_PRINT.md §6): a box that draws all its shadows
 * through one shadow token takes the token's effect style in its print, so
 * every card with that shadow shares one style. The wire print shares the
 * design print's style while it draws the token alike and the style binds no
 * variable, which would be one print's; otherwise it has a style of its own,
 * `wire:` and the design key, named `· wire`. A token whose value differs
 * between the viewports is a style per viewport, as a variable is.
 */
import { CONFIG } from '../config.mjs';
import { printOf, type RawPage } from './raw.mts';
import type { EffectSpec, EffectStyleSpec, PrintName, ViewportName } from './schema.mts';
import { PRIMARY } from './prints.mts';
import { tokenNameOf, twinOf } from './tokens.mts';

const PRINTS = CONFIG.prints as readonly PrintName[];

type Slot = `${PrintName}|${ViewportName}`;

const binds = (effects: readonly EffectSpec[]): boolean => effects.some((effect) => effect.color.variable !== undefined);

export class EffectStyles {
  private readonly styles = new Map<string, EffectStyleSpec>();
  /** Every token's value on the stage, by print and viewport. */
  private readonly values = new Map<string, Map<Slot, string>>();

  constructor(pages: readonly RawPage[] = []) {
    for (const page of pages) {
      for (const print of PRINTS) {
        for (const [name, value] of Object.entries(printOf(page, print).tokens)) {
          const seen = this.values.get(name) ?? new Map<Slot, string>();
          if (!seen.has(`${print}|${page.viewport}`)) seen.set(`${print}|${page.viewport}`, value.trim());
          this.values.set(name, seen);
        }
      }
    }
  }

  /** Whether two slots of a token hold different values, where both hold one. */
  private differs(token: string, a: Slot, b: Slot): boolean {
    const seen = this.values.get(token);
    const [left, right] = [seen?.get(a), seen?.get(b)];
    return left !== undefined && right !== undefined && left !== right;
  }

  /** The key of a shadow token's style at a viewport in a print, made from the effects of its first use there. */
  use(token: string, effects: readonly EffectSpec[], viewport: ViewportName, print: PrintName): string {
    const split = PRINTS.some((one) => this.differs(token, `${one}|wide`, `${one}|narrow`));
    const shared = split ? `effect:${token}@${viewport}` : `effect:${token}`;
    // A primary style that binds a variable binds the primary collection, so a twin print shares only a style that binds none.
    const own = print !== PRIMARY && (this.differs(token, `${PRIMARY}|${viewport}`, `${print}|${viewport}`) || binds(effects) || binds(this.styles.get(shared)?.effects ?? []));
    const key = own ? twinOf(shared, print) : shared;
    if (!this.styles.has(key)) this.styles.set(key, { key, name: `${tokenNameOf(token)}${split ? ` · ${viewport}` : ''}${own ? ` · ${print}` : ''}`, effects });
    return key;
  }

  build(): EffectStyleSpec[] {
    return [...this.styles.values()].sort((a, b) => a.key.localeCompare(b.key));
  }
}

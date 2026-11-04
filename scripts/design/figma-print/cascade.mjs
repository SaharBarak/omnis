/**
 * The cascade reads of the measure stage (docs/redesign/FIGMA_PRINT.md §3.1): from a
 * DevTools matched-styles answer, the authored token chain behind each bound
 * value and the declared keywords the computed style resolves away. Pure, so
 * the rules are tested without a browser.
 */
import { BOUND_PROPS, INHERITED, INITIAL_VALUES, KEYWORD_PROPS, KEYWORDS } from './config.mjs';

/**
 * Each axis's start and end sides by direction, in the horizontal writing
 * mode the site uses throughout (CSS Logical 1 §4): the block axis starts at
 * the top, and the inline axis at the right of a right-to-left box and at the
 * left of a left-to-right one.
 */
const AXES = {
  rtl: { block: ['top', 'bottom'], inline: ['right', 'left'] },
  ltr: { block: ['top', 'bottom'], inline: ['left', 'right'] },
};

/** The physical side of one logical edge (`inline`, `start`) in a box of `direction`. */
const sideOf = (axis, edge, direction) => AXES[direction][axis][edge === 'start' ? 0 : 1];

/** The physical property a logical one maps to: from right to left, `padding-inline-start` is `padding-right`, `inset-inline-start` is `right` and `border-start-end-radius` is `border-top-left-radius`. */
const physicalOf = (name, direction) =>
  name
    .replace(/^inset-(block|inline)-(start|end)$/, (_, axis, edge) => sideOf(axis, edge, direction))
    .replace(/^border-(start|end)-(start|end)-radius$/, (_, block, inline) => `border-${sideOf('block', block, direction)}-${sideOf('inline', inline, direction)}-radius`)
    .replace(/-(block|inline)-(start|end)(?=-|$)/, (_, axis, edge) => `-${sideOf(axis, edge, direction)}`);

/**
 * A logical table of config.mjs keyed by physical property for one direction:
 * each logical name becomes the physical one it maps to, each logical
 * candidate follows the physical longhand it cascades with (CSS Logical 1
 * §4), and every list ends with `all`, which sets any of them to a defaulting
 * keyword (CSS Cascade 5 §3.2).
 */
const physicalTable = (logical, direction) =>
  Object.fromEntries(
    Object.entries(logical).map(([name, candidates]) => [
      physicalOf(name, direction),
      [...candidates.flatMap((candidate) => [...new Set([physicalOf(candidate, direction), candidate])]), 'all'],
    ])
  );

/** The physical tables of both directions, derived once. */
const TABLES = Object.fromEntries(Object.keys(AXES).map((direction) => [direction, { bound: physicalTable(BOUND_PROPS, direction), keywords: physicalTable(KEYWORD_PROPS, direction) }]));

/** The cascade origins an answer holds, lowest first (CSS Cascade 5 §6.2); no user sheet reaches a headless read. */
const USER_AGENT = 0;
const AUTHOR = 1;
const ORIGINS = 2;

/** The first sort of the cascade (CSS Cascade 5 §6.1): normal declarations by origin, then every important one above them, in reverse origin order. */
const tierOf = (origin, important) => (important ? 2 * ORIGINS - 1 - origin : origin);

/** A value without the ` !important` Chrome keeps in it. */
const bareOf = (value) => value.replace(/\s*!\s*important\s*$/i, '');

/**
 * The declarations of one style the cascade reads. Where Chrome holds the
 * source (`style.range`) it appends every longhand it parsed after the source
 * declarations, a var() shorthand's empty, so only the source ones count; a
 * style without source (the user-agent sheet, presentational attributes)
 * lists its longhands only.
 */
const declarationsOf = (style) => (style.cssProperties ?? []).filter((property) => !style.range || property.range);

/** Whether precedence `a` outranks `b`, both compared entry by entry: the first that differs decides. */
function outranks(a, b) {
  const at = a.findIndex((entry, index) => entry !== b[index]);
  return at >= 0 && a[at] > b[at];
}

/**
 * The declaration that wins `candidates` in one context, ranked as the
 * cascade sorts (CSS Cascade 5 §6.1): origin and importance (tierOf); then
 * the element's own style attribute over any rule; then the layer, a later
 * one winning normal declarations and an earlier one important ones (§6.4),
 * so the unlayered win normal and lose important; then order, as CDP lists
 * rules by layer, specificity and order. An empty value is a longhand Chrome
 * could not serialise: an author one stands for a shorthand pending var()
 * and is skipped, a user-agent one is a system font's (a form control's
 * `font`) and still declares.
 */
function winnerIn(context, candidates) {
  let winner = null;
  let order = 0;
  for (const { declarations, origin, attached, layer } of context) {
    for (const property of declarations) {
      if (!candidates.includes(property.name) || property.disabled || property.parsedOk === false) continue;
      const value = bareOf(property.value ?? '');
      if (value === '' && !property.text && origin !== USER_AGENT) continue;
      const important = Boolean(property.important);
      order += 1;
      const rank = [tierOf(origin, important), attached, important ? -layer : layer, order];
      if (!winner || outranks(rank, winner.rank)) winner = { name: property.name, value, longhands: property.longhandProperties, origin, rank };
    }
  }
  return winner;
}

/** A cascade layer's key: its name, or where it has none (an anonymous `@layer {}`), where it starts. */
const layerKeyOf = (layer) => layer.text || `${layer.styleSheetId}:${layer.range?.startLine}:${layer.range?.startColumn}`;

/** One style of a context: the declarations the cascade reads, its origin, whether it is the element's style attribute, and its layer rank. */
const styleOf = (style, origin, attached, layer) => ({ declarations: declarationsOf(style), origin, attached, layer });

/**
 * The styles of one cascade context (the element's own entry or an
 * ancestor's) in the order CDP lists them. CDP lists matched rules in
 * cascade order, so the order the list first meets a layer path is its
 * rank. Presentational attributes, which Chrome cascades below every author
 * rule, rank under every layer.
 */
function contextOf(entry, attributesStyle) {
  const ranks = new Map();
  const rankOf = (rule) => {
    const key = `${rule.origin}|${(rule.layers ?? []).map(layerKeyOf).join('.')}`;
    if (!ranks.has(key)) ranks.set(key, ranks.size);
    return ranks.get(key);
  };
  return [
    ...(attributesStyle ? [styleOf(attributesStyle, AUTHOR, 0, -1)] : []),
    ...(entry.matchedCSSRules ?? []).filter(({ rule }) => rule.style).map(({ rule }) => styleOf(rule.style, rule.origin === 'user-agent' ? USER_AGENT : AUTHOR, 0, rankOf(rule))),
    ...(entry.inlineStyle ? [styleOf(entry.inlineStyle, AUTHOR, 1, 0)] : []),
  ];
}

/** The cascade contexts of one answer: the element's own, then each ancestor's, nearest first. */
const contextsOf = (match) => [contextOf(match, match.attributesStyle), ...(match.inherited ?? []).map((entry) => contextOf(entry))];

/** The `var()` names in a value, outermost first. */
const varsIn = (value) => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);

/** The `currentcolor` keyword in a value, not a custom property that spells it. */
const CURRENT = /(?<![\w-])currentcolor(?![\w-])/i;

/** Splits a value at its top-level `separator`s, outside any parentheses: a shorthand at its spaces, a radius at its slash. */
function partsOf(value, separator = ' ') {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const character of value.trim()) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === separator && depth === 0) {
      if (current) parts.push(current);
      current = '';
    } else current += character;
  }
  if (current) parts.push(current);
  return parts;
}

/** The shorthands that set the four physical sides, top, right, bottom and left in turn. */
const FOUR_SIDES = new Set(['padding', 'margin', 'inset', 'border-color', 'border-width']);

/** The logical shorthands that set one axis, its start then its end (CSS Logical 1 §4.2 to §4.5.3), capturing the axis. */
const PAIR = /^(?:padding|margin|inset)-(block|inline)$|^border-(block|inline)-(?:color|width)$/;

/** The component of a box shorthand (`padding`, `padding-inline`, `border-radius`, `gap`…) that sets one physical property in a box of `direction`. */
function componentOf(declName, value, physical, direction) {
  const parts = partsOf(declName === 'border-radius' ? (partsOf(value, '/')[0] ?? value) : value);
  const pick = (index) => parts[Math.min(index, parts.length - 1)] ?? value;
  const box4 = (index) => pick([[0, 0, 0, 0], [0, 1, 0, 1], [0, 1, 2, 1], [0, 1, 2, 3]][Math.max(0, Math.min(parts.length, 4) - 1)][index]);
  const side = /(?:^|-)(top|right|bottom|left)(?:-|$)/.exec(physical)?.[1];
  const pair = PAIR.exec(declName);
  if (FOUR_SIDES.has(declName)) return box4(['top', 'right', 'bottom', 'left'].indexOf(side));
  if (pair) return pick(AXES[direction][pair[1] ?? pair[2]].indexOf(side));
  if (declName === 'border-radius') return box4(['top-left', 'top-right', 'bottom-right', 'bottom-left'].indexOf(/^border-(.+)-radius$/.exec(physical)?.[1]));
  if (declName === 'gap' || declName === 'grid-gap') return pick(physical === 'row-gap' ? 0 : 1);
  return value;
}

/**
 * The value a winning declaration gives one physical property: Chrome's own
 * longhand of it where the shorthand names no var(), else the component of
 * the shorthand componentOf picks. A var() shorthand that opens with a
 * literal valid on its own has longhands too, parsed from that literal alone
 * (`padding: 0 var(--x)` lists every side `0px`), so they are never read.
 */
function valueFor(hit, physical, direction) {
  const longhand = varsIn(hit.value).length === 0 ? hit.longhands?.find((entry) => physicalOf(entry.name, direction) === physical) : undefined;
  return (bareOf(longhand?.value ?? '') || componentOf(hit.name, hit.value, physical, direction)).trim();
}

/** Where a defaulting keyword sends the read: to the parent, to the initial value, or nowhere this reads. */
const PARENT = Symbol('parent');
const INITIAL = Symbol('initial');
const UNREAD = Symbol('unread');

/** Whether a property inherits: one of INHERITED, or any custom property (CSS Variables 1 §2). */
const inheritsOf = (property) => property.startsWith('--') || INHERITED.has(property);

/**
 * The cascaded value one context gives a property, or where an explicit
 * defaulting keyword (CSS Cascade 5 §7.3) sends the read. `inherit`, and
 * `unset` or no declaration on a property that inherits, go to the parent;
 * `initial`, and `unset` or no declaration on one that does not, to the
 * initial value. `revert` rolls the cascade back to the origins below the
 * declaration's, so an author `revert` reads the user agent's declaration,
 * and acts as `unset` where that has none. `revert-layer` rolls back to the
 * layer below, which this does not read, so it gives nothing. A colour
 * declared `currentcolor` alone is the parent's colour (CSS Color 4 §15.5),
 * so it reads as `inherit`, and the parent's declaration, a mix's share
 * included, is the colour's.
 */
function cascadedIn(context, property, candidates, direction) {
  const inherits = inheritsOf(property);
  const hit = winnerIn(context, candidates);
  if (!hit) return inherits ? PARENT : INITIAL;
  const value = valueFor(hit, property, direction);
  const keyword = value.toLowerCase();
  switch (property === 'color' && keyword === 'currentcolor' ? 'inherit' : keyword) {
    case 'inherit':
      return PARENT;
    case 'unset':
      return inherits ? PARENT : INITIAL;
    case 'initial':
      return INITIAL;
    case 'revert':
      return cascadedIn(context.filter((style) => style.origin < hit.origin), property, candidates, direction);
    case 'revert-layer':
      return UNREAD;
    default:
      return value;
  }
}

/** A property's initial value as a declaration of context `at`, where INITIAL_VALUES knows it. */
const initialAt = (property, at) => (Object.hasOwn(INITIAL_VALUES, property) ? { value: INITIAL_VALUES[property], at } : null);

/**
 * The declared value that sets one property in a box of `direction`, and the
 * context that declares it, searching from context `from`: the element's
 * cascaded value, or for an inherited property it leaves undeclared, the
 * nearest ancestor's. A property that reaches its initial value has the one
 * INITIAL_VALUES gives, and none where that table has none.
 */
function declaredOf(contexts, property, candidates, direction, from = 0) {
  for (let at = from; at < contexts.length; at += 1) {
    const value = cascadedIn(contexts[at], property, candidates, direction);
    if (value === PARENT) continue;
    if (value === UNREAD) return null;
    return value === INITIAL ? initialAt(property, at) : { value, at };
  }
  return initialAt(property, contexts.length);
}

/**
 * Follows one custom property through the contexts it inherits from, from
 * the context whose declaration names it: the chain of names it aliases,
 * ending at the first declaration with no var().
 */
function chainOf(contexts, name, from, direction, seen = new Set()) {
  if (seen.has(name)) return [name];
  seen.add(name);
  const declared = declaredOf(contexts, name, [name], direction, from);
  const [next] = declared ? varsIn(declared.value) : [];
  return next ? [name, ...chainOf(contexts, next, declared.at, direction, seen)] : [name];
}

/** The token chains of a declared value: each var() it names, then, where it names `currentcolor`, the colour chains `current` gives. */
const chainsOf = (contexts, declared, direction, current) => [...varsIn(declared.value).map((name) => chainOf(contexts, name, declared.at, direction)), ...(CURRENT.test(declared.value) ? current() : [])];

/**
 * The colour chains of context `from` and the ones it inherits from. A
 * `currentcolor` mixed into a `color` value is the parent's colour (CSS
 * Color 4 §15.5), so it reads the next context's chains; one alone
 * cascadedIn already reads as `inherit`.
 */
function colorChainsOf(contexts, from, direction) {
  const declared = declaredOf(contexts, 'color', TABLES[direction].bound.color, direction, from);
  return declared ? chainsOf(contexts, declared, direction, () => colorChainsOf(contexts, declared.at + 1, direction)) : [];
}

/**
 * The authored token chains behind each bound property of one element, its
 * logical sides mapped by its `direction`, each from the value declaredOf
 * finds. A property naming `currentcolor` other than `color` (a hairline
 * border, a tinted background, a border colour left at its initial value)
 * takes the element's own colour chains: that keyword resolves against the
 * element's colour even where it is inherited (CSS Color 4 §15.5). One set
 * to `currentcolor` alone is that colour, so it takes the colour's binding
 * whole, its value too, and the plan reads a mix's share from it.
 */
export function bindingsOf(match, direction = 'rtl') {
  const contexts = contextsOf(match);
  const bind = {};
  for (const [physical, candidates] of Object.entries(TABLES[direction].bound)) {
    const declared = declaredOf(contexts, physical, candidates, direction);
    if (!declared) continue;
    if (physical !== 'color' && declared.value.toLowerCase() === 'currentcolor') {
      if (bind.color) bind[physical] = { ...bind.color };
      continue;
    }
    const current = () => (physical === 'color' ? colorChainsOf(contexts, declared.at + 1, direction) : (bind.color?.chains ?? []));
    const chains = chainsOf(contexts, declared, direction, current);
    if (chains.length > 0) bind[physical] = { value: declared.value, chains };
  }
  return bind;
}

/**
 * The declared keywords of one element that its computed style resolves away,
 * by physical property, its logical sides mapped by its `direction`, the user
 * agent's included (a `dialog`'s `auto` margins). A property nothing
 * declares, or one reset to its initial value, has that value, so an
 * undeclared inset is `auto`.
 */
export function keywordsOf(match, direction = 'rtl') {
  const contexts = contextsOf(match);
  const keywords = {};
  for (const [physical, candidates] of Object.entries(TABLES[direction].keywords)) {
    const value = declaredOf(contexts, physical, candidates, direction)?.value.toLowerCase();
    if (KEYWORDS.includes(value)) keywords[physical] = value;
  }
  return keywords;
}

/**
 * The cascade reads (docs/redesign/FIGMA_PRINT.md §3.1) on DevTools matched-styles
 * answers built by hand: each case is one rule of how an authored token
 * reaches a computed value.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bindingsOf, keywordsOf } from './cascade.mjs';

/** One author rule, its declarations in source order. */
const rule = (declarations) => ({ rule: { origin: 'regular', style: { cssProperties: Object.entries(declarations).map(([name, value]) => ({ name, value })) } } });

/** A matched-styles answer: the element's own rules, then each ancestor's, nearest first. */
const match = (own, ...ancestors) => ({ matchedCSSRules: own.map(rule), inherited: ancestors.map((rules) => ({ matchedCSSRules: rules.map(rule) })) });

/*
 * Answers shaped as CSS.getMatchedStylesForNode gives them, as headless
 * Chromium answered for the same rules: a stylesheet's rule lists its source
 * declarations with their text and range, then every longhand it parsed
 * with no range; a value keeps its ` !important`; a user-agent rule lists
 * longhands only.
 */

/** Any source range: the reads ask only whether one is there. */
const RANGE = { startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 };

/** A value as Chrome lists it, ` !important` kept. */
const listed = (value, important) => (important ? `${value} !important` : value);

/** A source declaration, and for a shorthand without var() the longhands Chrome serialised. */
const source = (name, value, { important = false, longhands } = {}) => ({
  name,
  value: listed(value, important),
  text: `${name}: ${listed(value, important)};`,
  range: RANGE,
  important,
  ...(longhands ? { longhandProperties: Object.entries(longhands).map(([longhand, part]) => ({ name: longhand, value: listed(part, important) })) } : {}),
});

/** A longhand Chrome appends after the source declarations: empty, but for an ` !important`, where its shorthand waits on a var(). */
const parsed = (name, value, important = false) => ({ name, value: listed(value, important), important });

/** A stylesheet rule in the cascade layer path `layers`. */
const sheet = (properties, layers = []) => ({ rule: { origin: 'regular', layers: layers.map((text) => ({ text })), style: { range: RANGE, cssProperties: properties } } });

/** A user-agent rule. */
const agent = (longhands) => ({ rule: { origin: 'user-agent', layers: [], style: { cssProperties: Object.entries(longhands).map(([name, value]) => ({ name, value })) } } });

/** An answer of such rules: the element's, then each ancestor's, nearest first. */
const answer = (own, ...ancestors) => ({ matchedCSSRules: own, inherited: ancestors.map((rules) => ({ matchedCSSRules: rules })) });

/** An ancestor that colours its text with `token`. */
const inked = (token) => [sheet([source('color', `var(${token})`), parsed('color', `var(${token})`)])];

describe('bound colours', () => {
  it('take the parent token through a reset that declares inherit', () => {
    const bind = bindingsOf(match([{ color: 'inherit' }], [{ color: 'var(--np-ink)' }]));
    assert.deepEqual(bind.color, { value: 'var(--np-ink)', chains: [['--np-ink']] });
  });

  it('take the parent token through currentcolor', () => {
    const bind = bindingsOf(match([{ color: 'currentcolor' }], [{ color: 'var(--np-paper)' }]));
    assert.deepEqual(bind.color?.chains, [['--np-paper']]);
  });

  it('give a border drawn in currentcolor the element colour chain', () => {
    const bind = bindingsOf(match([{ color: 'var(--np-red-ink)', 'border-block-end': '1px solid currentcolor' }]));
    assert.deepEqual(bind['border-bottom-color']?.chains, [['--np-red-ink']]);
  });

  it('give a background mixed from currentcolor the element colour chain', () => {
    const bind = bindingsOf(match([{ background: 'color-mix(in srgb, currentcolor 12%, transparent)' }], [{ color: 'var(--np-ink)' }]));
    assert.deepEqual(bind['background-color']?.chains, [['--np-ink']]);
  });

  it('leave a literal unbound', () => {
    assert.equal(bindingsOf(match([{ color: '#191816' }])).color, undefined);
  });

  it('follow a token through the aliases its ancestors declare', () => {
    const bind = bindingsOf(match([{ color: 'var(--np-ink)' }], [{ '--np-ink': 'var(--press-ink)' }]));
    assert.deepEqual(bind.color?.chains, [['--np-ink', '--press-ink']]);
  });
});

describe('defaulting keywords', () => {
  it('take the parent token through inherit on a property that does not inherit', () => {
    const bind = bindingsOf(match([{ 'background-color': 'inherit' }], [{ 'background-color': 'var(--np-paper)' }]));
    assert.deepEqual(bind['background-color'], { value: 'var(--np-paper)', chains: [['--np-paper']] });
  });

  it('read only the parent through inherit on a property that does not inherit', () => {
    assert.equal(bindingsOf(match([{ 'border-radius': 'inherit' }], [], [{ 'border-radius': 'var(--bento-fillet)' }]))['border-top-right-radius'], undefined);
  });

  it('take the parent token through unset on a property that inherits', () => {
    assert.deepEqual(bindingsOf(match([{ color: 'unset' }], [{ color: 'var(--np-ink)' }])).color?.chains, [['--np-ink']]);
  });

  it('leave unset unbound on a property that does not inherit', () => {
    assert.equal(bindingsOf(match([{ padding: 'unset' }], [{ padding: 'var(--space-2)' }]))['padding-top'], undefined);
  });

  it('leave initial unbound', () => {
    assert.equal(bindingsOf(match([{ color: 'initial' }], [{ color: 'var(--np-ink)' }])).color, undefined);
  });

  it('read revert where the user agent declares nothing as unset', () => {
    assert.deepEqual(bindingsOf(match([{ color: 'revert' }], [{ color: 'var(--np-ink)' }])).color?.chains, [['--np-ink']]);
    assert.equal(bindingsOf(match([{ padding: 'revert' }], [{ padding: 'var(--space-2)' }]))['padding-top'], undefined);
  });

  it('leave revert-layer unbound rather than read the parent', () => {
    assert.equal(bindingsOf(match([{ color: 'revert-layer' }], [{ color: 'var(--np-ink)' }])).color, undefined);
  });

  it('read the all shorthand as the keyword of every property it sets', () => {
    const bind = bindingsOf(match([{ color: 'var(--np-red)', 'padding-top': 'var(--space-2)', all: 'unset' }], [{ color: 'var(--np-ink)' }]));
    assert.deepEqual([bind.color?.chains, bind['padding-top']], [[['--np-ink']], undefined]);
  });

  it('follow a custom property declared inherit to its parent declaration', () => {
    const bind = bindingsOf(match([{ '--np-ink': 'inherit', color: 'var(--np-ink)' }], [{ '--np-ink': 'var(--press-ink)' }]));
    assert.deepEqual(bind.color?.chains, [['--np-ink', '--press-ink']]);
  });
});

describe('bound boxes', () => {
  it('do not inherit a property that does not inherit', () => {
    assert.equal(bindingsOf(match([], [{ 'background-color': 'var(--np-paper)' }]))['background-color'], undefined);
  });

  it('resolve the inline start to the right of a right-to-left box', () => {
    assert.deepEqual(bindingsOf(match([{ 'padding-inline-start': 'var(--space-2)' }]))['padding-right'], { value: 'var(--space-2)', chains: [['--space-2']] });
  });

  it('resolve the inline start to the left of a left-to-right box', () => {
    const bind = bindingsOf(match([{ 'padding-inline-start': 'var(--space-2)' }]), 'ltr');
    assert.deepEqual([bind['padding-left'], bind['padding-right']], [{ value: 'var(--space-2)', chains: [['--space-2']] }, undefined]);
  });

  it('give a logical pair its start then its end along the direction', () => {
    const pair = match([{ 'padding-inline': 'var(--space-2) var(--space-4)' }]);
    const sides = (direction) => ['padding-right', 'padding-left'].map((side) => bindingsOf(pair, direction)[side]?.value);
    assert.deepEqual(sides('rtl'), ['var(--space-2)', 'var(--space-4)']);
    assert.deepEqual(sides('ltr'), ['var(--space-4)', 'var(--space-2)']);
  });

  it('split a border colour pair between its start and end sides', () => {
    const bind = bindingsOf(match([{ 'border-block-color': 'var(--np-ink) var(--np-red)' }]));
    assert.deepEqual([bind['border-top-color']?.chains, bind['border-bottom-color']?.chains], [[['--np-ink']], [['--np-red']]]);
  });

  it('turn a logical corner with the direction', () => {
    const corner = match([{ 'border-start-start-radius': 'var(--bento-fillet)' }]);
    assert.deepEqual([Object.keys(bindingsOf(corner)), Object.keys(bindingsOf(corner, 'ltr'))], [['border-top-right-radius'], ['border-top-left-radius']]);
  });

  it('split a radius at its own slash, not at one inside calc()', () => {
    const bind = bindingsOf(match([{ padding: 'calc(var(--space-12) / 2) var(--space-4)', 'border-radius': 'var(--space-2) var(--space-4) / 1px' }]));
    const values = ['padding-top', 'padding-right', 'border-top-left-radius', 'border-top-right-radius'].map((physical) => bind[physical]?.value);
    assert.deepEqual(values, ['calc(var(--space-12) / 2)', 'var(--space-4)', 'var(--space-2)', 'var(--space-4)']);
  });
});

describe('declared keywords', () => {
  // Every inset starts `auto`, so an element that declares none has four.
  const FREE = { top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' };
  const insets = (keywords) => Object.fromEntries(Object.entries(keywords).filter(([name]) => name in FREE));

  it('record auto margins by physical side', () => {
    assert.deepEqual(keywordsOf(match([{ 'margin-block-start': 'auto' }])), { ...FREE, 'margin-top': 'auto' });
    assert.deepEqual(keywordsOf(match([{ margin: '0 auto' }])), { ...FREE, 'margin-right': 'auto', 'margin-left': 'auto' });
  });

  it('record an auto margin on the side the element direction gives it', () => {
    assert.deepEqual(keywordsOf(match([{ 'margin-inline-end': 'auto' }]), 'ltr'), { ...FREE, 'margin-right': 'auto' });
    assert.deepEqual(keywordsOf(match([{ 'margin-inline-end': 'auto' }])), { ...FREE, 'margin-left': 'auto' });
  });

  it('record the insets a box leaves auto, declared or not', () => {
    assert.deepEqual(insets(keywordsOf(match([{ inset: '0' }]))), {});
    assert.deepEqual(insets(keywordsOf(match([{ top: '0', 'inset-inline-start': '1rem' }]))), { bottom: 'auto', left: 'auto' });
    assert.deepEqual(insets(keywordsOf(match([{ 'inset-inline-start': '1rem' }]), 'ltr')), { top: 'auto', right: 'auto', bottom: 'auto' });
    assert.deepEqual(insets(keywordsOf(match([{ 'inset-block': '0 auto', 'inset-inline': 'auto 0' }]))), { bottom: 'auto', right: 'auto' });
  });

  it('read an inset reset to its initial value as auto', () => {
    assert.deepEqual(insets(keywordsOf(match([{ inset: '0' }, { top: 'initial', left: 'unset' }]))), { top: 'auto', left: 'auto' });
  });
});

describe('important declarations', () => {
  const SIDES = ['top', 'right', 'bottom', 'left'];
  // `.b { color: inherit !important; padding: var(--x) !important; margin-inline: auto !important }`
  const important = answer(
    [
      sheet([
        source('color', 'inherit', { important: true }),
        source('padding', 'var(--x)', { important: true }),
        source('margin-inline', 'auto', { important: true, longhands: { 'margin-inline-start': 'auto', 'margin-inline-end': 'auto' } }),
        parsed('color', 'inherit', true),
        ...SIDES.map((side) => parsed(`padding-${side}`, '', true)),
        parsed('margin-inline-start', 'auto', true),
        parsed('margin-inline-end', 'auto', true),
      ]),
    ],
    inked('--ink')
  );

  it('bind without the !important Chrome keeps in a value', () => {
    const bind = bindingsOf(important);
    assert.deepEqual([bind.color, bind['padding-top'], bind['padding-left']], [{ value: 'var(--ink)', chains: [['--ink']] }, ...Array(2).fill({ value: 'var(--x)', chains: [['--x']] })]);
  });

  it('read a keyword written important', () => {
    const keywords = keywordsOf(important);
    assert.deepEqual([keywords['margin-right'], keywords['margin-left']], ['auto', 'auto']);
  });

  it('keep a mix bare of its !important, as the tint share reads it', () => {
    const mix = 'color-mix(in srgb, var(--ink) 40%, transparent)';
    const bind = bindingsOf(answer([sheet([source('background-color', mix, { important: true }), parsed('background-color', mix, true)])]));
    assert.equal(bind['background-color']?.value, mix);
  });

  it('skip a longhand empty but for its !important where Chrome lists no source', () => {
    const sourceless = { rule: { origin: 'regular', style: { cssProperties: [{ name: 'padding', value: 'var(--x) !important', text: 'padding: var(--x) !important;', important: true }, parsed('padding-top', '', true)] } } };
    assert.deepEqual(bindingsOf(answer([sourceless]))['padding-top']?.chains, [['--x']]);
  });
});

describe('source declarations', () => {
  it('read the source declarations, not the longhands Chrome appends after them', () => {
    // Masthead.module.css: `padding: 0; padding-block: var(--space-1)`.
    const masthead = answer([
      sheet([
        source('padding', '0', { longhands: { 'padding-top': '0px', 'padding-right': '0px', 'padding-bottom': '0px', 'padding-left': '0px' } }),
        source('padding-block', 'var(--space-1)'),
        ...['top', 'right', 'bottom', 'left'].map((side) => parsed(`padding-${side}`, '0px')),
        parsed('padding-block-start', ''),
        parsed('padding-block-end', ''),
      ]),
    ]);
    const bind = bindingsOf(masthead);
    assert.deepEqual(['padding-top', 'padding-bottom', 'padding-right'].map((side) => bind[side]?.chains), [[['--space-1']], [['--space-1']], undefined]);
  });

  it('let a later literal shorthand override a token side', () => {
    const literal = answer([sheet([source('padding-inline', 'var(--space-1)'), source('padding', '0', { longhands: { 'padding-right': '0px', 'padding-left': '0px' } }), parsed('padding-right', '0px'), parsed('padding-left', '0px')])]);
    assert.equal(bindingsOf(literal)['padding-right'], undefined);
  });

  it('read a var() shorthand by its components, not the longhands Chrome parses from its leading literal', () => {
    // Bento.module.css: `padding-block: 0 var(--space-3)`, which Chrome lists as both sides `0px`.
    const padded = answer([sheet([source('padding-block', '0 var(--space-3)', { longhands: { 'padding-block-start': '0px', 'padding-block-end': '0px' } })])]);
    assert.deepEqual([bindingsOf(padded)['padding-top'], bindingsOf(padded)['padding-bottom']?.chains], [undefined, [['--space-3']]]);
    // Bento.module.css: `margin-block: auto calc(-1 * var(--bento-tile-pad))`, which Chrome lists as both sides `auto`.
    const cut = answer([sheet([source('margin-block', 'auto calc(-1 * var(--bento-tile-pad))', { longhands: { 'margin-block-start': 'auto', 'margin-block-end': 'auto' } })])]);
    const keywords = keywordsOf(cut);
    assert.deepEqual([keywords['margin-top'], keywords['margin-bottom']], ['auto', undefined]);
  });

  it("take a literal shorthand's side from the longhand Chrome serialised", () => {
    const tabbed = answer([sheet([source('margin', '0\tauto', { longhands: { 'margin-top': '0px', 'margin-right': 'auto', 'margin-bottom': '0px', 'margin-left': 'auto' } })])]);
    const keywords = keywordsOf(tabbed);
    assert.deepEqual([keywords['margin-right'], keywords['margin-left'], keywords['margin-top']], ['auto', 'auto', undefined]);
  });
});

describe('border colours', () => {
  it('give a colour a border shorthand leaves out, which Chrome lists as initial, the element colour chain', () => {
    // `.c { color: var(--red); border-block-end: 1px solid }`
    const hairline = answer([
      sheet([
        source('color', 'var(--red)'),
        source('border-block-end', '1px solid', { longhands: { 'border-block-end-width': '1px', 'border-block-end-style': 'solid', 'border-block-end-color': 'initial' } }),
        parsed('color', 'var(--red)'),
        parsed('border-block-end-color', 'initial'),
      ]),
    ]);
    assert.deepEqual(bindingsOf(hairline)['border-bottom-color'], { value: 'var(--red)', chains: [['--red']] });
  });

  it("give one set to currentcolor alone the element colour's value, a mix's share included", () => {
    const mix = 'color-mix(in srgb, var(--ink) 40%, transparent)';
    const tinted = answer([sheet([source('color', mix), source('border-color', 'currentcolor', { longhands: Object.fromEntries(['top', 'right', 'bottom', 'left'].map((side) => [`border-${side}-color`, 'currentcolor'])) })])]);
    assert.deepEqual(bindingsOf(tinted)['border-top-color'], { value: mix, chains: [['--ink']] });
  });

  it('give one declared initial, unset or revert, or not declared, the element colour chain', () => {
    for (const declared of [{ 'border-color': 'initial' }, { 'border-color': 'unset' }, { 'border-top-color': 'revert' }, {}]) {
      const bind = bindingsOf(match([{ color: 'var(--np-ink)', ...declared }], [{ 'border-color': 'var(--np-red)' }]));
      assert.deepEqual(bind['border-top-color']?.chains, [['--np-ink']], JSON.stringify(declared));
    }
  });

  it('read revert as the user agent colour where it declares one', () => {
    const table = answer([agent({ 'border-top-color': 'gray' }), sheet([source('color', 'var(--ink)'), source('border-top-color', 'revert')])]);
    assert.equal(bindingsOf(table)['border-top-color'], undefined);
  });
});

describe('cascade layers', () => {
  const colour = (token, important = false) => [source('color', `var(${token})`, { important }), parsed('color', `var(${token})`, important)];

  it('let an important declaration in an earlier layer beat a later layer and the unlayered', () => {
    const layered = answer([sheet(colour('--a', true), ['a', 'inner']), sheet(colour('--b', true), ['a']), sheet(colour('--c', true), ['b']), sheet(colour('--plain', true))]);
    assert.deepEqual(bindingsOf(layered).color?.chains, [['--a']]);
  });

  it('let a normal declaration in a later layer win, and the unlayered last', () => {
    assert.deepEqual(bindingsOf(answer([sheet(colour('--a'), ['a']), sheet(colour('--b'), ['b'])])).color?.chains, [['--b']]);
    assert.deepEqual(bindingsOf(answer([sheet(colour('--a'), ['a']), sheet(colour('--plain'))])).color?.chains, [['--plain']]);
  });

  it("let the style attribute's important declaration beat every layer's", () => {
    const attached = { ...answer([sheet(colour('--a', true), ['a'])]), inlineStyle: { range: RANGE, cssProperties: colour('--inline', true) } };
    assert.deepEqual(bindingsOf(attached).color?.chains, [['--inline']]);
  });

  it('rank two anonymous layers apart', () => {
    const anonymous = (line) => ({ text: '', range: { startLine: line, startColumn: 7 }, styleSheetId: 'sheet' });
    const rules = [sheet(colour('--first', true)), sheet(colour('--second', true))];
    rules[0].rule.layers = [anonymous(1)];
    rules[1].rule.layers = [anonymous(2)];
    assert.deepEqual(bindingsOf(answer(rules)).color?.chains, [['--first']]);
  });
});

describe('user-agent rules', () => {
  it("end inheritance at the user agent's declaration", () => {
    assert.equal(bindingsOf(answer([agent({ color: 'buttontext' })], inked('--ink'))).color, undefined);
    assert.equal(bindingsOf(answer([], [agent({ color: '-webkit-link' })], inked('--ink'))).color, undefined);
  });

  it('end inheritance at a system font, which Chrome lists empty', () => {
    const control = answer([agent({ 'font-size': '', 'font-family': '' })], [sheet([source('font-size', 'var(--text-base)')])]);
    assert.equal(bindingsOf(control)['font-size'], undefined);
  });

  it('lose to an author rule in any layer', () => {
    const reset = answer([agent({ color: 'buttontext' }), sheet([source('color', 'inherit')], ['base'])], inked('--ink'));
    assert.deepEqual(bindingsOf(reset).color?.chains, [['--ink']]);
  });

  it('rank under presentational attributes, which rank under every author rule', () => {
    const attributesStyle = { cssProperties: [{ name: 'color', value: 'rgb(255, 0, 0)' }] };
    assert.equal(bindingsOf({ ...answer([agent({ color: 'inherit' })], inked('--ink')), attributesStyle }).color, undefined);
    assert.deepEqual(bindingsOf({ ...answer([sheet(inked('--own')[0].rule.style.cssProperties, ['base'])]), attributesStyle }).color?.chains, [['--own']]);
  });

  it("record the user agent's auto margins and insets", () => {
    const dialog = agent({ position: 'absolute', 'inset-inline-start': '0px', 'inset-inline-end': '0px', 'margin-top': 'auto', 'margin-right': 'auto', 'margin-bottom': 'auto', 'margin-left': 'auto' });
    const sides = { top: 'auto', bottom: 'auto', 'margin-top': 'auto', 'margin-right': 'auto', 'margin-bottom': 'auto', 'margin-left': 'auto' };
    assert.deepEqual(keywordsOf(answer([dialog])), sides);
    assert.deepEqual(keywordsOf(answer([dialog, sheet([source('margin', '0', { longhands: { 'margin-top': '0px', 'margin-right': '0px', 'margin-bottom': '0px', 'margin-left': '0px' } })])])), { top: 'auto', bottom: 'auto' });
  });
});

describe('currentcolor in a colour', () => {
  const mixed = (share) => [sheet([source('color', `color-mix(in srgb, currentcolor ${share}%, transparent)`), parsed('color', 'color-mix(in srgb, currentcolor, transparent)')])];

  it('give a colour mixed from currentcolor the parent colour chain, and the source value', () => {
    const bind = bindingsOf(answer(mixed(50), inked('--ink')));
    assert.deepEqual(bind.color, { value: 'color-mix(in srgb, currentcolor 50%, transparent)', chains: [['--ink']] });
    assert.deepEqual(bind['border-top-color']?.chains, [['--ink']]);
  });

  it('give a colour declared currentcolor alone the parent declaration, so a mix keeps its share', () => {
    const mix = 'color-mix(in srgb, var(--ink) 40%, transparent)';
    const bind = bindingsOf(answer([sheet([source('color', 'currentColor')])], [sheet([source('color', mix)])]));
    assert.deepEqual(bind.color, { value: mix, chains: [['--ink']] });
  });

  it('follow currentcolor up through every colour that mixes it', () => {
    assert.deepEqual(bindingsOf(answer(mixed(50), mixed(80), inked('--ink'))).color?.chains, [['--ink']]);
  });
});

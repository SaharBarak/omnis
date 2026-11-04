/**
 * Computed CSS values read as numbers, colours, gradients and shadows. Every
 * input is a Chrome computed value, which is already resolved and
 * normalised; nothing here reads authored CSS.
 */
import type { Affine, Rgba } from './schema.mts';

export const px = (value: string | undefined): number => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Splits at top-level separators, ignoring those inside parentheses. */
export function splitTop(value: string, separator: ',' | ' '): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of value) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === separator && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** A computed colour: `rgb()`, `rgba()`, `color(srgb …)`, `#hex` or `transparent`. */
export function color(value: string): Rgba | null {
  const text = value.trim();
  if (text === 'transparent') return [0, 0, 0, 0];
  const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
  if (rgb) {
    const parts = rgb[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
    const [r = 0, g = 0, b = 0, a = 1] = parts;
    return [clamp01(r / 255), clamp01(g / 255), clamp01(b / 255), clamp01(a)];
  }
  const srgb = /^color\(srgb\s+([^)]+)\)$/.exec(text);
  if (srgb) {
    const [channels, alpha] = srgb[1]!.split('/');
    const [r = 0, g = 0, b = 0] = channels!.trim().split(/\s+/).map(Number);
    return [clamp01(r), clamp01(g), clamp01(b), alpha === undefined ? 1 : clamp01(Number(alpha))];
  }
  const hex = /^#([0-9a-f]{3,8})$/i.exec(text);
  if (hex) {
    const digits = hex[1]!.length <= 4 ? [...hex[1]!].map((d) => d + d).join('') : hex[1]!;
    const channel = (at: number): number => Number.parseInt(digits.slice(at, at + 2), 16) / 255;
    return [channel(0), channel(2), channel(4), digits.length === 8 ? channel(6) : 1];
  }
  return null;
}

export const isClear = (rgba: Rgba | null): boolean => rgba === null || rgba[3] === 0;

/** `#rrggbbaa`, the key colours compare by. */
export const hexOf = (rgba: Rgba): string =>
  `#${rgba.map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;

export interface Shadow {
  readonly inset: boolean;
  readonly x: number;
  readonly y: number;
  readonly blur: number;
  readonly spread: number;
  readonly color: Rgba;
}

/** A computed `box-shadow` list; Chrome writes each as `color x y blur spread [inset]`. */
export function shadows(value: string): Shadow[] {
  if (value === 'none') return [];
  return splitTop(value, ',').flatMap((one) => {
    const parts = splitTop(one, ' ');
    const inset = parts.includes('inset');
    const colorPart = parts.find((part) => color(part) !== null);
    const lengths = parts.filter((part) => part !== 'inset' && part !== colorPart).map(px);
    const rgba = colorPart ? color(colorPart) : null;
    if (!rgba) return [];
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
    return [{ inset, x, y, blur, spread, color: rgba }];
  });
}

export interface Stop {
  readonly at: number;
  readonly color: Rgba;
}

export interface Gradient {
  readonly kind: 'linear' | 'radial';
  /** Stops over the whole line, a repeating gradient already expanded into them. */
  readonly stops: readonly Stop[];
  readonly transform: Affine;
  /** The tile a `background-size` repeats it at, in px; absent when it covers the box. */
  readonly tile?: readonly [number, number];
}

/** The most stops a repeating gradient expands into before it is read as its mean colour. */
const MAX_STOPS = 512;

/** The colour at `at` along a resolved stop list. */
function colorAt(stops: readonly Stop[], at: number): Rgba {
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) return [0, 0, 0, 0];
  if (at <= first.at) return first.color;
  if (at >= last.at) return last.color;
  for (let index = 1; index < stops.length; index += 1) {
    const to = stops[index]!;
    const from = stops[index - 1]!;
    if (at > to.at) continue;
    const span = to.at - from.at;
    const t = span <= 0 ? 1 : (at - from.at) / span;
    return [0, 1, 2, 3].map((channel) => from.color[channel]! + (to.color[channel]! - from.color[channel]!) * t) as unknown as Rgba;
  }
  return last.color;
}

/**
 * A repeating gradient's stops laid end to end across [0, 1], the way CSS
 * repeats them along the line, with the colours at both ends interpolated in.
 */
function repeated(stops: readonly Stop[]): Stop[] | null {
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) return null;
  const period = last.at - first.at;
  if (period <= 0) return [...stops];
  const from = Math.floor((0 - first.at) / period);
  const to = Math.ceil((1 - first.at) / period);
  if ((to - from + 1) * stops.length > MAX_STOPS) {
    // Too fine to spell out: one period's mean colour, flat across the line.
    const mean = meanAlong(stops);
    return [{ at: 0, color: mean }, { at: 1, color: mean }];
  }
  const line: Stop[] = [];
  for (let k = from; k <= to; k += 1) for (const stop of stops) line.push({ at: stop.at + k * period, color: stop.color });
  const inside = line.filter((stop) => stop.at > 0 && stop.at < 1);
  return [{ at: 0, color: colorAt(line, 0) }, ...inside, { at: 1, color: colorAt(line, 1) }];
}

/** The mean colour of a stop list across its own span, premultiplied. */
function meanAlong(stops: readonly Stop[]): Rgba {
  const first = stops[0]!.at;
  const span = stops[stops.length - 1]!.at - first;
  const samples = 256;
  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (let index = 0; index < samples; index += 1) {
    const [r, g, b, a] = colorAt(stops, first + (span * (index + 0.5)) / samples);
    alpha += a;
    red += r * a;
    green += g * a;
    blue += b * a;
  }
  return alpha === 0 ? [0, 0, 0, 0] : [red / alpha, green / alpha, blue / alpha, alpha / samples];
}

/** True when every stop is one colour: the gradient paints a flat colour. */
export const isFlat = (gradient: Gradient): boolean => gradient.stops.every((stop) => hexOf(stop.color) === hexOf(gradient.stops[0]!.color));

/** Applies a 2x3 affine map to a point. */
const apply = ([[a, b, c], [d, e, f]]: Affine, [x, y]: readonly [number, number]): readonly [number, number] => [a * x + b * y + c, d * x + e * y + f];

/**
 * The mean colour a gradient paints over its box (or tile), sampled on a
 * grid: how a pattern Figma cannot tile is printed as one flat tint.
 */
export function meanOf(gradient: Gradient): Rgba {
  const samples = 24;
  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (let row = 0; row < samples; row += 1) {
    for (let column = 0; column < samples; column += 1) {
      const point = apply(gradient.transform, [(column + 0.5) / samples, (row + 0.5) / samples]);
      const at = gradient.kind === 'linear' ? point[0] : Math.hypot(point[0] - 0.5, point[1] - 0.5) * 2;
      const [r, g, b, a] = colorAt(gradient.stops, at);
      alpha += a;
      red += r * a;
      green += g * a;
      blue += b * a;
    }
  }
  return alpha === 0 ? [0, 0, 0, 0] : [red / alpha, green / alpha, blue / alpha, alpha / (samples * samples)];
}

type Point = readonly [number, number];

/** Inverts an affine map given as the images of the gradient-space origin, x and y unit vectors. */
function invert([[a, b, c], [d, e, f]]: Affine): Affine {
  const det = a * e - b * d;
  return [
    [e / det, -b / det, (b * f - c * e) / det],
    [-d / det, a / det, (c * d - a * f) / det],
  ];
}

/** A stop position: a percentage of the line, a px length along it, or a calc() of both. */
function stopAt(text: string, length: number): number | null {
  const calc = /^calc\((.+)\)$/.exec(text);
  if (calc) {
    const expression = calc[1]!.replace(/\s+/g, ' ');
    const match = /^([\d.]+)%\s*([+-])\s*([\d.]+)px$/.exec(expression);
    if (match) {
      const percent = Number(match[1]) / 100;
      const delta = Number(match[3]) / length;
      return match[2] === '+' ? percent + delta : percent - delta;
    }
    return null;
  }
  if (text.endsWith('%')) return Number.parseFloat(text) / 100;
  if (text.endsWith('px')) return length > 0 ? Number.parseFloat(text) / length : 0;
  return null;
}

/** Stops with every missing or backwards position resolved as CSS resolves them. */
function stopsOf(parts: readonly string[], length: number): Stop[] {
  const raw = parts.flatMap((part) => {
    const tokens = splitTop(part, ' ');
    const rgba = color(tokens[0] ?? '');
    if (!rgba) return [];
    const positions = tokens.slice(1).map((token) => stopAt(token, length));
    return positions.length === 0 ? [{ color: rgba, at: null as number | null }] : positions.map((at) => ({ color: rgba, at }));
  });
  if (raw.length === 0) return [];
  if (raw[0]!.at === null) raw[0]!.at = 0;
  if (raw[raw.length - 1]!.at === null) raw[raw.length - 1]!.at = 1;
  let max = 0;
  for (const stop of raw) {
    if (stop.at !== null) {
      stop.at = Math.max(stop.at, max);
      max = stop.at;
    }
  }
  for (let index = 0; index < raw.length; index += 1) {
    if (raw[index]!.at !== null) continue;
    let end = index;
    while (raw[end]!.at === null) end += 1;
    const from = raw[index - 1]!.at!;
    const to = raw[end]!.at!;
    for (let fill = index; fill < end; fill += 1) raw[fill]!.at = from + ((to - from) * (fill - index + 1)) / (end - index + 1);
  }
  return raw.map((stop) => ({ at: stop.at!, color: stop.color }));
}

const SIDE_ANGLES: Readonly<Record<string, number>> = {
  'to top': 0,
  'to right': 90,
  'to bottom': 180,
  'to left': 270,
};

/**
 * The angle of a `to <corner>` direction in a w × h box: the line points into
 * the corner's quadrant, perpendicular to the diagonal joining the two
 * neighbouring corners.
 */
function cornerAngle(direction: string, w: number, h: number): number | null {
  const corner = /^to (top|bottom) (left|right)$|^to (left|right) (top|bottom)$/.exec(direction);
  if (!corner) return null;
  const vertical = corner[1] ?? corner[4];
  const horizontal = corner[2] ?? corner[3];
  const theta = (Math.atan2(h, w) * 180) / Math.PI;
  if (vertical === 'top') return horizontal === 'right' ? theta : 360 - theta;
  return horizontal === 'right' ? 180 - theta : 180 + theta;
}

function linear(args: readonly string[], w: number, h: number, repeating: boolean): Gradient | null {
  let angle = 180;
  let rest = args;
  const first = args[0] ?? '';
  if (/deg$/.test(first)) {
    angle = Number.parseFloat(first);
    rest = args.slice(1);
  } else if (first.startsWith('to ')) {
    angle = SIDE_ANGLES[first] ?? cornerAngle(first, w, h) ?? 180;
    rest = args.slice(1);
  }
  const radians = (angle * Math.PI) / 180;
  const direction: Point = [Math.sin(radians), -Math.cos(radians)];
  const length = Math.abs(w * direction[0]) + Math.abs(h * direction[1]);
  const resolved = stopsOf(rest, length);
  const stops = repeating ? repeated(resolved) : resolved;
  if (!stops || stops.length === 0 || w === 0 || h === 0) return null;
  // Gradient space: (0, 0.5) is the line's start, (1, 0.5) its end. The map
  // below sends gradient space into the box's normalised space; Figma wants
  // its inverse.
  const start: Point = [0.5 - (direction[0] * length) / 2 / w, 0.5 - (direction[1] * length) / 2 / h];
  const along: Point = [(direction[0] * length) / w, (direction[1] * length) / h];
  const across: Point = [(-direction[1] * length) / w, (direction[0] * length) / h];
  const toBox: Affine = [
    [along[0], across[0], start[0] - across[0] / 2],
    [along[1], across[1], start[1] - across[1] / 2],
  ];
  return { kind: 'linear', stops, transform: invert(toBox) };
}

function radial(args: readonly string[], w: number, h: number, repeating: boolean): Gradient | null {
  let shape = args[0] ?? '';
  let rest = args;
  let center: Point = [w / 2, h / 2];
  let rx = 0;
  let ry = 0;
  const isShape = /^(circle|ellipse)|^at |closest|farthest|^\d/.test(shape) && color(splitTop(shape, ' ')[0] ?? '') === null;
  if (isShape) rest = args.slice(1);
  else shape = '';
  const at = /\bat\s+(\S+)(?:\s+(\S+))?/.exec(shape);
  if (at) {
    const position = (token: string | undefined, size: number): number => {
      if (!token || token === 'center') return size / 2;
      if (token === 'left' || token === 'top') return 0;
      if (token === 'right' || token === 'bottom') return size;
      return token.endsWith('%') ? (Number.parseFloat(token) / 100) * size : px(token);
    };
    center = [position(at[1], w), position(at[2] ?? 'center', h)];
  }
  const circle = shape.startsWith('circle') || (!shape.startsWith('ellipse') && /\d+px(?!\s+\d)/.test(shape.split(' at ')[0] ?? ''));
  const sizeText = shape.split(' at ')[0]!.replace(/^(circle|ellipse)\s*/, '').trim();
  const dx = [center[0], w - center[0]];
  const dy = [center[1], h - center[1]];
  const keyword = sizeText || 'farthest-corner';
  if (/^\d/.test(keyword)) {
    const [first, second] = keyword.split(/\s+/);
    rx = first!.endsWith('%') ? (Number.parseFloat(first!) / 100) * w : px(first);
    ry = second ? (second.endsWith('%') ? (Number.parseFloat(second) / 100) * h : px(second)) : rx;
  } else {
    const side = (pick: (...values: number[]) => number): [number, number] => [pick(...dx), pick(...dy)];
    if (keyword === 'closest-side') [rx, ry] = side(Math.min);
    else if (keyword === 'farthest-side') [rx, ry] = side(Math.max);
    else {
      const [sx, sy] = keyword === 'closest-corner' ? side(Math.min) : side(Math.max);
      if (circle) rx = ry = Math.hypot(sx, sy);
      else {
        rx = sx * Math.SQRT2;
        ry = sy * Math.SQRT2;
      }
    }
    if (circle && keyword.endsWith('side')) rx = ry = keyword === 'closest-side' ? Math.min(rx, ry) : Math.max(rx, ry);
  }
  const resolved = stopsOf(rest, rx);
  const stops = repeating ? repeated(resolved) : resolved;
  if (!stops || stops.length === 0 || rx === 0 || ry === 0 || w === 0 || h === 0) return null;
  const toBox: Affine = [
    [(2 * rx) / w, 0, center[0] / w - rx / w],
    [0, (2 * ry) / h, center[1] / h - ry / h],
  ];
  return { kind: 'radial', stops, transform: invert(toBox) };
}

/** One layer's `background-size` against the box: the tile it repeats at, or null when it covers the box. */
function tileOf(size: string | undefined, repeat: string | undefined, w: number, h: number): readonly [number, number] | null {
  if (!size || /^(auto|auto auto|cover|contain)$/.test(size.trim()) || /^no-repeat/.test(repeat?.trim() ?? '')) return null;
  const [first = 'auto', second = 'auto'] = size.trim().split(/\s+/);
  const length = (token: string, of: number): number | null => (token === 'auto' ? null : token.endsWith('%') ? (Number.parseFloat(token) / 100) * of : px(token));
  const tw = length(first, w);
  const th = length(second, h) ?? tw;
  const tile: readonly [number, number] = [tw ?? th ?? w, th ?? w];
  return tile[0] >= w - 0.5 && tile[1] >= h - 0.5 ? null : tile;
}

/**
 * Every layer of a computed `background-image`, top layer first, for a w × h
 * box. A layer `background-size` repeats at a smaller tile is resolved in its
 * tile and carries the tile's size.
 */
export function gradients(value: string, w: number, h: number, sizes = 'auto', repeats = 'repeat'): { readonly layers: Gradient[]; readonly unread: string[] } {
  if (value === 'none') return { layers: [], unread: [] };
  const layers: Gradient[] = [];
  const unread: string[] = [];
  const sizeList = splitTop(sizes, ',');
  const repeatList = splitTop(repeats, ',');
  splitTop(value, ',').forEach((layer, at) => {
    const match = /^(repeating-)?(linear|radial)-gradient\((.*)\)$/s.exec(layer);
    if (!match) {
      if (layer !== 'none') unread.push(layer.slice(0, 80));
      return;
    }
    // CSS cycles a shorter size or repeat list over the layers.
    const tile = tileOf(sizeList[at % Math.max(1, sizeList.length)], repeatList[at % Math.max(1, repeatList.length)], w, h);
    const [bw, bh] = tile ?? [w, h];
    const args = splitTop(match[3]!, ',');
    const gradient = match[2] === 'linear' ? linear(args, bw, bh, Boolean(match[1])) : radial(args, bw, bh, Boolean(match[1]));
    if (gradient) layers.push(tile ? { ...gradient, tile } : gradient);
    else unread.push(layer.slice(0, 80));
  });
  return { layers, unread };
}

/** The first family of a computed `font-family` list. */
export const familiesOf = (value: string): string[] =>
  splitTop(value, ',').map((family) => family.replace(/^["']|["']$/g, '').trim());

/** A computed 2D `matrix(a, b, c, d, e, f)`. */
export function matrixOf(value: string): readonly [number, number, number, number, number, number] | null {
  const match = /^matrix\(([^)]+)\)$/.exec(value);
  if (!match) return null;
  const values = match[1]!.split(',').map(Number);
  return values.length === 6 ? (values as unknown as readonly [number, number, number, number, number, number]) : null;
}

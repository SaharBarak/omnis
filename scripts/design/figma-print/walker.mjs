/**
 * Chrome's layout unit, in px. Chrome lays boxes out in sixty-fourths of a
 * pixel, so a box or lead read at that grain is the one it laid out, where a
 * coarser grain drifts across a long run of boxes.
 */
export const LAYOUT_UNIT = 1 / 64;

/**
 * The in-page half of `measure.mjs` (docs/redesign/FIGMA_PRINT.md §3.1): it reads the
 * rendered page and returns it as a tree of boxes, computed styles and text
 * line boxes. Playwright serialises this function into the page, so it closes
 * over nothing and imports nothing: the layout unit it rounds to comes in its
 * options.
 *
 * Every element under the root gets a `data-fp` id in document order on the
 * first call, so the second print's walk names the same elements and the
 * DevTools protocol can find them. That attribute is the only write to the
 * page; the line probes are added after the walk and removed before it returns.
 *
 * @param {{ root: string, styleProps: readonly string[], placeholderProps: readonly string[], layoutUnit: number }} options
 */
export function walk(options) {
  const roots = document.querySelectorAll(options.root);
  if (roots.length !== 1) throw new Error(`${roots.length} elements match ${options.root}; a printed page has exactly one`);
  const root = roots[0];
  const sx = window.scrollX;
  const sy = window.scrollY;
  const round = (value) => Math.round(value / options.layoutUnit) * options.layoutUnit;
  const boxOf = (rect) => [round(rect.left + sx), round(rect.top + sy), round(rect.width), round(rect.height)];

  let next = Number(root.getAttribute('data-fp-next') ?? '0');
  const idOf = (element) => {
    let id = element.getAttribute('data-fp');
    if (id === null) {
      id = String(next++);
      element.setAttribute('data-fp', id);
    }
    return id;
  };
  idOf(root);
  for (const element of root.querySelectorAll('*')) idOf(element);
  root.setAttribute('data-fp-next', String(next));

  /** Distinct computed-style dictionaries, shared by index. */
  const styles = [];
  const styleIndex = new Map();
  const intern = (dict) => {
    const key = JSON.stringify(dict);
    let index = styleIndex.get(key);
    if (index === undefined) {
      index = styles.length;
      styles.push(dict);
      styleIndex.set(key, index);
    }
    return index;
  };
  const read = (computed, props) => {
    const dict = {};
    for (const prop of props) dict[prop] = computed.getPropertyValue(prop);
    return dict;
  };

  const dataOf = (element) => {
    const data = {};
    for (const attribute of element.attributes) {
      if (attribute.name.startsWith('data-') && attribute.name !== 'data-fp' && attribute.name !== 'data-fp-next') {
        data[attribute.name.slice(5)] = attribute.value;
      }
    }
    return data;
  };
  const ATTRS = ['aria-label', 'aria-hidden', 'aria-pressed', 'role', 'dir', 'href', 'type', 'placeholder', 'alt', 'hreflang', 'lang'];
  const attrsOf = (element) => {
    const attrs = {};
    for (const name of ATTRS) {
      const value = element.getAttribute(name);
      if (value !== null) attrs[name] = value;
    }
    return attrs;
  };

  const lineBoxesOf = (textNode) => {
    const range = document.createRange();
    range.selectNodeContents(textNode);
    return [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map(boxOf);
  };

  /*
   * Chrome reports text as glyph rects, and a line box sits off their centre
   * by however the face's metrics round. One hidden line per distinct face,
   * size and line height measures it: the probe's own box is its line box, so
   * a text's `lead` is how far its line box starts above its glyph rect.
   */
  const LEAD_PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-variant', 'font-feature-settings', 'font-variation-settings', 'line-height'];
  const leadKeyOf = (computed) => JSON.stringify(LEAD_PROPS.map((prop) => computed.getPropertyValue(prop)));
  const awaitingLead = [];
  const measureLeads = () => {
    const samples = new Map();
    for (const { key, sample } of awaitingLead) if (!samples.has(key)) samples.set(key, sample);
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position: absolute; top: 0; left: 0; visibility: hidden; pointer-events: none';
    const probes = new Map();
    for (const [key, sample] of samples) {
      const probe = document.createElement('div');
      probe.style.cssText = 'position: absolute; top: 0; left: 0; margin: 0; padding: 0; border: 0; white-space: pre';
      JSON.parse(key).forEach((value, at) => probe.style.setProperty(LEAD_PROPS[at], value));
      probe.textContent = sample;
      host.append(probe);
      probes.set(key, probe);
    }
    document.body.append(host);
    const leads = new Map();
    for (const [key, probe] of probes) {
      const range = document.createRange();
      range.selectNodeContents(probe);
      const glyphs = [...range.getClientRects()].find((rect) => rect.height > 0);
      if (glyphs) leads.set(key, round(glyphs.top - probe.getBoundingClientRect().top));
    }
    host.remove();
    for (const { kid, key } of awaitingLead) if (leads.has(key)) kid.lead = leads.get(key);
  };

  /*
   * An SVG written so it imports without the page's CSS (docs/redesign/
   * FIGMA_PRINT.md §3.1, "Drawings"): every computed paint, dash and text
   * property on its shapes, every element's own transform as a matrix, a
   * `pathLength` dash in the shape's real length, a marker expanded into
   * shapes at each vertex it marks, and each shape named by its node id,
   * which the importer keeps as the layer's name. A container keeps its own
   * opacity only: the paints it would pass down are already on its shapes.
   * Content in `defs` keeps the paints it declares, not those it inherits
   * there, so a `use` that draws it still passes its own down. What the
   * importer cannot be given is listed as unread.
   */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_PAINT = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity'];
  const SVG_STOP = ['stop-color', 'stop-opacity'];
  /** Paints no element inherits (SVG 2 §13, Pservers §6.3, Color 4 §15.4), which a defs element therefore always declares or defaults. */
  const SVG_OWN = new Set(['opacity', ...SVG_STOP]);
  const SVG_TEXT = ['font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-anchor', 'dominant-baseline'];
  const SVG_SHAPES = new Set(['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text']);
  const SVG_PAINTED = new Set([...SVG_SHAPES, 'tspan', 'use']);
  /** The elements markers apply to (SVG 2 §13.7, "markable elements"). */
  const SVG_MARKABLE = new Set(['path', 'line', 'polyline', 'polygon']);
  /** Elements whose `x`, `y` or viewport place their content beside their transform, so their transform stays as authored. */
  const SVG_PLACED = new Set(['svg', 'use', 'symbol', 'foreignObject']);
  /** The SVG `preserveAspectRatio` alignments by their DOM constant (SVGPreserveAspectRatio), as the share of the free space before the box on each axis. */
  const ALIGNS = { 2: [0, 0], 3: [0.5, 0], 4: [1, 0], 5: [0, 0.5], 6: [0.5, 0.5], 7: [1, 0.5], 8: [0, 1], 9: [0.5, 1], 10: [1, 1] };
  const ALIGN_NONE = 1;
  const MEET = 1;
  const EPSILON = 1e-6;
  /** A shape's layer id: its node id, which the plan keys its paint bindings by. */
  const layerIdOf = (fp) => `fp-${fp}`;
  const invisible = (computed) => computed.visibility !== 'visible';
  const hasVisibleDescendant = (element) => [...element.querySelectorAll('*')].some((one) => !invisible(getComputedStyle(one)) && getComputedStyle(one).display !== 'none');
  const writePaint = (element, copy) => {
    const computed = getComputedStyle(element);
    for (const prop of SVG_PAINTED.has(element.tagName) ? SVG_PAINT : ['opacity']) {
      const value = computed.getPropertyValue(prop);
      if (value) copy.setAttribute(prop, value);
    }
    if (element.tagName === 'text' || element.tagName === 'tspan') for (const prop of SVG_TEXT) copy.setAttribute(prop, computed.getPropertyValue(prop));
    return computed;
  };
  /** A defs element's paints: each one its declarations set, not one it only inherits from the defs it sits in. */
  const writeOwnPaint = (element, copy) => {
    const computed = getComputedStyle(element);
    const parent = element.parentElement ? getComputedStyle(element.parentElement) : null;
    for (const prop of [...SVG_PAINT, ...SVG_STOP]) {
      const value = computed.getPropertyValue(prop);
      if (value && (SVG_OWN.has(prop) || parent === null || parent.getPropertyValue(prop) !== value)) copy.setAttribute(prop, value);
    }
  };
  const isIdentity = (m) => Math.abs(m.a - 1) < EPSILON && Math.abs(m.b) < EPSILON && Math.abs(m.c) < EPSILON && Math.abs(m.d - 1) < EPSILON && Math.abs(m.e) < EPSILON && Math.abs(m.f) < EPSILON;
  const matrixText = (m) => `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((n) => Number(n.toFixed(6))).join(' ')})`;
  /**
   * An element's own transform, whatever set it (the attribute, a CSS
   * `transform` with its origin and box), as its parent's screen matrix
   * undone from its own; written on the copy as a matrix, or dropped where it
   * is the identity. Null where the element draws nowhere.
   */
  const writeTransform = (element, copy) => {
    const own = element.getScreenCTM?.();
    const parent = element.parentElement?.getScreenCTM?.();
    if (!own || !parent) return null;
    const local = parent.inverse().multiply(own);
    copy.removeAttribute('transform');
    if (!isIdentity(local)) copy.setAttribute('transform', matrixText(local));
    return local;
  };
  /** A dash normalised by `pathLength`, in the shape's own length. */
  const realDash = (element, copy, computed) => {
    const declared = Number(element.getAttribute('pathLength'));
    copy.removeAttribute('pathLength');
    if (!(declared > 0) || typeof element.getTotalLength !== 'function') return;
    const scale = element.getTotalLength() / declared;
    const dash = computed.getPropertyValue('stroke-dasharray');
    if (dash && dash !== 'none') copy.setAttribute('stroke-dasharray', dash.split(/[\s,]+/).filter(Boolean).map((part) => String(Number.parseFloat(part) * scale)).join(' '));
    const offset = Number.parseFloat(computed.getPropertyValue('stroke-dashoffset'));
    if (offset) copy.setAttribute('stroke-dashoffset', String(offset * scale));
  };
  const degrees = (from, to) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  /** Where a shape's start or end lies, and the direction its line runs there, in degrees. */
  const endOf = (shape, which) => {
    if (typeof shape.getTotalLength !== 'function') return null;
    const total = shape.getTotalLength();
    if (!(total > 0)) return null;
    const step = Math.min(total, 0.5);
    const [from, to] = which === 'end' ? [total - step, total] : [0, step];
    const a = shape.getPointAtLength(from);
    const b = shape.getPointAtLength(to);
    const at = which === 'end' ? b : a;
    return { x: at.x, y: at.y, angle: degrees(a, b) };
  };
  /**
   * The interior vertices of a polyline or polygon, each with the bisector of
   * the directions in and out of it (SVG 2 §13.7.4), none for a line; null for
   * a path, whose vertices the DOM does not list.
   */
  const midsOf = (shape) => {
    if (shape.tagName === 'line') return [];
    if (!shape.points) return null;
    const points = [...shape.points].map((point) => ({ x: point.x, y: point.y }));
    const vertices = shape.tagName === 'polygon' && points.length > 1 ? [...points, points[0]] : points;
    return vertices.slice(1, -1).map((at, index) => {
      const into = (degrees(vertices[index], at) * Math.PI) / 180;
      const out = (degrees(at, vertices[index + 2]) * Math.PI) / 180;
      return { x: at.x, y: at.y, angle: (Math.atan2(Math.sin(into) + Math.sin(out), Math.cos(into) + Math.cos(out)) * 180) / Math.PI };
    });
  };
  const markerAt = (computed, which) => {
    const id = /#([^"')]+)/.exec(computed.getPropertyValue(`marker-${which}`))?.[1];
    const marker = id ? document.getElementById(id) : null;
    return marker?.tagName === 'marker' ? marker : null;
  };
  /**
   * The drawing's shapes by node id, each with the markup ids that draw it:
   * one for a shape drawn in place, one per vertex for a marker's shape.
   */
  const shapesOf = () => {
    const byId = new Map();
    const draw = (element, copy) => {
      const fp = element.getAttribute('data-fp');
      if (fp === null || !SVG_SHAPES.has(element.tagName)) return;
      const computed = getComputedStyle(element);
      const shape = byId.get(fp) ?? { id: fp, cls: [...element.classList], fill: computed.getPropertyValue('fill'), stroke: computed.getPropertyValue('stroke'), layers: [] };
      const layer = shape.layers.length === 0 ? layerIdOf(fp) : `${layerIdOf(fp)}.${shape.layers.length}`;
      shape.layers.push(layer);
      byId.set(fp, shape);
      copy.setAttribute('id', layer);
    };
    return { draw, list: () => [...byId.values()] };
  };
  /** A viewBox fitted to a viewport by `preserveAspectRatio` (SVG 2 §8.2), as `x' = sx·x + tx`, `y' = sy·y + ty`. */
  const viewBoxFit = (box, width, height, fit) => {
    if (!box || !(box.width > 0) || !(box.height > 0)) return { sx: 1, sy: 1, tx: 0, ty: 0 };
    const [sx, sy] = [width / box.width, height / box.height];
    if (fit.align === ALIGN_NONE) return { sx, sy, tx: -box.x * sx, ty: -box.y * sy };
    const scale = fit.meetOrSlice === MEET ? Math.min(sx, sy) : Math.max(sx, sy);
    const [ax, ay] = ALIGNS[fit.align] ?? ALIGNS[6];
    return { sx: scale, sy: scale, tx: ax * (width - box.width * scale) - box.x * scale, ty: ay * (height - box.height * scale) - box.y * scale };
  };
  /** Whether a marker's content reaches past its viewport, in viewBox units. */
  const spills = (marker, view, width, height) => {
    const [left, top, right, bottom] = [-view.tx / view.sx, -view.ty / view.sy, (width - view.tx) / view.sx, (height - view.ty) / view.sy];
    return [...marker.children].some((part) => {
      const box = typeof part.getBBox === 'function' ? part.getBBox() : null;
      return box !== null && (box.x < left - EPSILON || box.y < top - EPSILON || box.x + box.width > right + EPSILON || box.y + box.height > bottom + EPSILON);
    });
  };
  /**
   * A marker's shapes as a group at the vertex it marks (SVG 2 §13.7): in the
   * shape's own transform and opacity, turned by its orient, scaled by its
   * units, its reference point on the vertex, its viewBox fitted to its
   * viewport, and clipped to that viewport where its overflow hides what
   * spills past it.
   */
  const expandedMarker = (marker, vertex, which, shape, draw, clips) => {
    const orient = marker.getAttribute('orient') ?? '0';
    const angle = orient === 'auto' ? vertex.angle : orient === 'auto-start-reverse' ? vertex.angle + (which === 'start' ? 180 : 0) : Number.parseFloat(orient) || 0;
    const units = (marker.getAttribute('markerUnits') ?? 'strokeWidth') === 'strokeWidth' ? shape.strokeWidth : 1;
    const [width, height] = [marker.markerWidth.baseVal.value, marker.markerHeight.baseVal.value];
    const view = viewBoxFit(marker.viewBox.baseVal, width, height, marker.preserveAspectRatio.baseVal);
    const [refX, refY] = [view.sx * marker.refX.baseVal.value + view.tx, view.sy * marker.refY.baseVal.value + view.ty];
    const placed = document.createElementNS(SVG_NS, 'g');
    placed.setAttribute('transform', `${shape.local && !isIdentity(shape.local) ? `${matrixText(shape.local)} ` : ''}translate(${vertex.x} ${vertex.y}) rotate(${angle}) scale(${units}) translate(${-refX} ${-refY})`);
    placed.setAttribute('opacity', shape.opacity);
    if (/^(hidden|clip)$/.test(getComputedStyle(marker).overflow) && spills(marker, view, width, height)) placed.setAttribute('clip-path', `url(#${clips.add(width, height)})`);
    const fitted = document.createElementNS(SVG_NS, 'g');
    fitted.setAttribute('transform', `matrix(${view.sx} 0 0 ${view.sy} ${view.tx} ${view.ty})`);
    for (const part of marker.children) {
      const copy = part.cloneNode(true);
      for (const [source, target] of [[part, copy], ...[...part.querySelectorAll('*')].map((element, at) => [element, copy.querySelectorAll('*')[at]])]) {
        target.removeAttribute('class');
        target.removeAttribute('style');
        target.removeAttribute('data-fp');
        writePaint(source, target);
        draw(source, target);
      }
      fitted.append(copy);
    }
    placed.append(fitted);
    return placed;
  };
  /** The clip paths of a drawing's markers, one per viewport size, in a `defs` of the drawing. */
  const clipsOf = (clone, drawing) => {
    const made = new Map();
    let defs = null;
    const add = (width, height) => {
      const size = `${width}x${height}`;
      if (made.has(size)) return made.get(size);
      const id = `clip-${drawing}-${made.size}`;
      defs ??= clone.insertBefore(document.createElementNS(SVG_NS, 'defs'), clone.firstChild);
      const clip = defs.appendChild(document.createElementNS(SVG_NS, 'clipPath'));
      clip.setAttribute('id', id);
      const rect = clip.appendChild(document.createElementNS(SVG_NS, 'rect'));
      for (const [name, value] of [['x', 0], ['y', 0], ['width', width], ['height', height]]) rect.setAttribute(name, String(value));
      made.set(size, id);
      return id;
    };
    return { add };
  };
  const svgOf = (svg, box) => {
    const clone = svg.cloneNode(true);
    const source = [svg, ...svg.querySelectorAll('*')];
    const target = [clone, ...clone.querySelectorAll('*')];
    const shapes = shapesOf();
    const clips = clipsOf(clone, svg.getAttribute('data-fp'));
    const unread = new Set();
    const skipped = new Set();
    source.forEach((element, index) => {
      const copy = target[index];
      copy.removeAttribute('class');
      copy.removeAttribute('style');
      copy.removeAttribute('data-fp');
      if (skipped.has(element.parentElement)) {
        skipped.add(element);
        return;
      }
      const computed = getComputedStyle(element);
      // `display` hides a whole subtree; `visibility` only what no descendant makes visible again.
      if (computed.display === 'none' || (invisible(computed) && !hasVisibleDescendant(element))) {
        copy.setAttribute('display', 'none');
        skipped.add(element);
        return;
      }
      if (invisible(computed)) copy.setAttribute('visibility', computed.visibility);
      if (element === svg) return;
      if (element.closest('marker') !== null) return;
      if (element.closest('defs, symbol, clipPath, mask, pattern, linearGradient, radialGradient') !== null) {
        if (SVG_PAINTED.has(element.tagName) || element.tagName === 'stop') writeOwnPaint(element, copy);
        return;
      }
      writePaint(element, copy);
      const local = SVG_PLACED.has(element.tagName) ? null : writeTransform(element, copy);
      if (!SVG_SHAPES.has(element.tagName)) return;
      realDash(element, copy, computed);
      shapes.draw(element, copy);
      if (!SVG_MARKABLE.has(element.tagName)) return;
      const shape = { local, opacity: computed.opacity, strokeWidth: Number.parseFloat(computed.getPropertyValue('stroke-width')) || 1 };
      const vertices = {
        start: () => [endOf(element, 'start')],
        mid: () => midsOf(element),
        end: () => [endOf(element, 'end')],
      };
      const placed = [];
      for (const [which, of] of Object.entries(vertices)) {
        copy.removeAttribute(`marker-${which}`);
        const marker = markerAt(computed, which);
        if (!marker) continue;
        const at = of();
        if (at === null) unread.add(`marker-${which} on a <${element.tagName}>`);
        for (const vertex of at ?? []) if (vertex) placed.push(expandedMarker(marker, vertex, which, shape, shapes.draw, clips));
      }
      copy.after(...placed);
    });
    for (const marker of clone.querySelectorAll('marker')) marker.remove();
    clone.setAttribute('width', String(box[2]));
    clone.setAttribute('height', String(box[3]));
    clone.setAttribute('xmlns', SVG_NS);
    return { markup: clone.outerHTML, shapes: shapes.list(), unread: [...unread] };
  };

  const visit = (element, parentId, index, at) => {
    const computed = getComputedStyle(element);
    const id = element.getAttribute('data-fp');
    const tag = element.tagName.toLowerCase();
    const node = {
      id,
      parent: parentId,
      index,
      at,
      tag,
      cls: [...element.classList],
      data: dataOf(element),
      attrs: attrsOf(element),
      box: boxOf(element.getBoundingClientRect()),
      style: intern(read(computed, options.styleProps)),
    };
    if (computed.display === 'none') {
      node.none = true;
      return node;
    }
    if (tag === 'svg') {
      const drawing = svgOf(element, node.box);
      node.svg = drawing.markup;
      node.shapes = drawing.shapes;
      if (drawing.unread.length > 0) node.unread = drawing.unread;
      return node;
    }
    if (tag === 'img') {
      node.img = { src: element.currentSrc || element.src, natural: [element.naturalWidth, element.naturalHeight] };
      return node;
    }
    if (tag === 'canvas') {
      node.canvas = { size: [element.width, element.height] };
      return node;
    }
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const value = tag === 'select' ? element.selectedOptions?.[0]?.textContent ?? '' : element.value;
      node.field = { value, placeholder: element.getAttribute('placeholder') ?? '', placeholderStyle: read(getComputedStyle(element, '::placeholder'), options.placeholderProps) };
      return node;
    }
    const kids = [];
    let elementIndex = 0;
    element.childNodes.forEach((child, childIndex) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        kids.push(visit(child, id, elementIndex++, childIndex));
      } else if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() !== '') {
        const kid = { text: child.nodeValue, at: childIndex, lines: lineBoxesOf(child) };
        awaitingLead.push({ kid, key: leadKeyOf(computed), sample: child.nodeValue.replace(/\s+/g, ' ').trim().slice(0, 48) });
        kids.push(kid);
      }
    });
    if (kids.length > 0) node.kids = kids;
    return node;
  };

  const tree = visit(root, null, 0, 0);
  measureLeads();

  const stageStyle = getComputedStyle(root);
  const tokenNames = new Set();
  const collect = (rules) => {
    for (const rule of rules) {
      if (rule.style) for (const name of rule.style) if (name.startsWith('--')) tokenNames.add(name);
      if (rule.cssRules) collect(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      collect(sheet.cssRules);
    } catch {
      /* a cross-origin sheet declares no token of ours */
    }
  }
  const tokens = {};
  for (const name of [...tokenNames].sort()) tokens[name] = stageStyle.getPropertyValue(name).trim();

  const fonts = [...document.fonts].filter((face) => face.status === 'loaded').map((face) => ({ family: face.family.replace(/^["']|["']$/g, ''), weight: face.weight, style: face.style }));

  return {
    url: location.pathname,
    lang: document.documentElement.lang,
    dir: getComputedStyle(document.documentElement).direction,
    viewport: [window.innerWidth, window.innerHeight],
    page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    print: root.getAttribute('data-print'),
    root: tree,
    styles,
    tokens,
    fonts,
  };
}

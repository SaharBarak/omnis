# Canvas Editor Component Specification

> **Status:** COMPLETE
> **Phase:** 4 (Canvas Editor + Dashboard)
> **Implemented:** Drag-and-drop boards, templates, PNG/SVG/PDF export

## Overview

The Canvas Editor is a full-featured visual workspace for creating, arranging, and annotating symbolic system outputs. Users can build "boards" with draggable nodes, layers, annotations, and multiple views.

---

## Core Concepts

### Board
```typescript
interface Board {
  id: BoardId;
  ownerId: UserId;
  name: string;
  description?: string;
  template?: BoardTemplate;
  canvas: CanvasState;
  layers: Layer[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  thumbnail?: string;           // Auto-generated preview
}

type BoardTemplate =
  | 'blank'
  | 'relationship-map'
  | 'family-tree'
  | 'yearly-overview'
  | 'personal-profile'
  | 'group-analysis';
```

### Canvas State
```typescript
interface CanvasState {
  width: number;
  height: number;
  viewBox: ViewBox;
  background: Background;
  grid: GridSettings;
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  annotations: Annotation[];
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;                 // 0.1 - 5.0
}

interface Background {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: { from: string; to: string; angle: number };
  imageUrl?: string;
}

interface GridSettings {
  visible: boolean;
  size: number;                 // Grid cell size
  snap: boolean;                // Snap to grid
  color: string;
}
```

---

## Canvas Nodes

### Node Types
```typescript
type CanvasNode =
  | PersonNode
  | CardNode
  | ChartNode
  | TextNode
  | ImageNode
  | ShapeNode
  | GroupNode;

interface BaseNode {
  id: NodeId;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  locked: boolean;
  visible: boolean;
  layerId: LayerId;
  zIndex: number;
  style: NodeStyle;
}

interface NodeStyle {
  opacity: number;
  shadow?: ShadowStyle;
  border?: BorderStyle;
}
```

### Person Node
```typescript
interface PersonNode extends BaseNode {
  type: 'person';
  personId: PersonId;
  display: PersonDisplayMode;
  showSystems: SystemType[];
}

type PersonDisplayMode =
  | 'avatar'         // Just photo/icon
  | 'mini'           // Avatar + name
  | 'card'           // Full A5 card
  | 'detailed';      // Expanded with all systems
```

### Card Node
```typescript
interface CardNode extends BaseNode {
  type: 'card';
  personId: PersonId;
  system: SystemType;
  variant: CardVariant;
}

type CardVariant =
  | 'a5-full'        // Complete A5 card
  | 'compact'        // Condensed version
  | 'oracle-only'    // Just the oracle diagram
  | 'sign-only';     // Just the sign/seal
```

### Chart Node
```typescript
interface ChartNode extends BaseNode {
  type: 'chart';
  chartType: ChartType;
  data: ChartData;
}

type ChartType =
  | 'compatibility-matrix'
  | 'element-distribution'
  | 'timeline'
  | 'bodygraph'
  | 'natal-chart';
```

### Text Node
```typescript
interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  textStyle: TextStyle;
}

interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  alignment: 'right' | 'center' | 'left';
  direction: 'rtl' | 'ltr';
}
```

### Shape Node
```typescript
interface ShapeNode extends BaseNode {
  type: 'shape';
  shape: Shape;
  fill: FillStyle;
  stroke: StrokeStyle;
}

type Shape =
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'arrow'
  | 'line'
  | 'path';
```

### Group Node
```typescript
interface GroupNode extends BaseNode {
  type: 'group';
  childIds: NodeId[];
  collapsed: boolean;
  label?: string;
}
```

---

## Connections

### Connection Types
```typescript
interface CanvasConnection {
  id: ConnectionId;
  type: ConnectionType;
  sourceId: NodeId;
  targetId: NodeId;
  sourceAnchor: Anchor;
  targetAnchor: Anchor;
  style: ConnectionStyle;
  label?: string;
  layerId: LayerId;
}

type ConnectionType =
  | 'relationship'   // Based on relationship data
  | 'flow'           // Directional arrow
  | 'line'           // Simple line
  | 'curve';         // Bezier curve

type Anchor = 'top' | 'right' | 'bottom' | 'left' | 'center' | 'auto';

interface ConnectionStyle {
  color: string;
  width: number;
  dash?: number[];
  startMarker?: Marker;
  endMarker?: Marker;
}

type Marker = 'none' | 'arrow' | 'circle' | 'diamond';
```

---

## Layers

### Layer System
```typescript
interface Layer {
  id: LayerId;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;
  color: string;                // Layer indicator color
}

// Default layers
const defaultLayers: Layer[] = [
  { id: 'background', name: 'רקע', order: 0 },
  { id: 'people', name: 'אנשים', order: 1 },
  { id: 'connections', name: 'קשרים', order: 2 },
  { id: 'annotations', name: 'הערות', order: 3 },
  { id: 'overlay', name: 'שכבת-על', order: 4 },
];
```

### System Layers
Each symbolic system can be a separate layer:
```typescript
const systemLayers: Layer[] = [
  { id: 'dreamspell', name: 'דרימספל', order: 10 },
  { id: 'tzolkin', name: 'צולקין', order: 11 },
  { id: 'astrology', name: 'אסטרולוגיה', order: 12 },
  { id: 'human-design', name: 'יומן אדם', order: 13 },
  { id: 'gematria', name: 'גימטריה', order: 14 },
];
```

---

## Annotations

### Annotation Types
```typescript
type Annotation =
  | StickyNote
  | Highlight
  | Callout
  | Freehand;

interface StickyNote extends BaseNode {
  type: 'sticky';
  content: string;
  color: StickyColor;
}

type StickyColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

interface Highlight extends BaseNode {
  type: 'highlight';
  targetIds: NodeId[];
  color: string;
  label?: string;
}

interface Callout extends BaseNode {
  type: 'callout';
  targetId: NodeId;
  content: string;
  pointer: 'top' | 'right' | 'bottom' | 'left';
}

interface Freehand {
  id: NodeId;
  type: 'freehand';
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  layerId: LayerId;
}
```

---

## Editor UI Layout

### Main Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [💾] [↩️] [↪️]  |  [🔍-] 100% [🔍+]  |  Board Name     [⚙️]    │
├────────┬────────────────────────────────────────────────┬───────┤
│        │                                                │       │
│  Tool  │                                                │ Props │
│  bar   │                                                │ Panel │
│        │                                                │       │
│ [🖱️]   │              Canvas Area                       │ ───── │
│ [📝]   │                                                │       │
│ [⬜]   │         (Infinite scroll/pan)                  │ Node  │
│ [↗️]   │                                                │ props │
│ [📌]   │                                                │       │
│ [🎨]   │                                                │ ───── │
│        │                                                │       │
│        │                                                │ Style │
│        │                                                │       │
├────────┴────────────────────────────────────────────────┴───────┤
│  Layers: [👁️ רקע] [👁️ אנשים] [👁️ קשרים] [👁️ הערות]  [+ שכבה]  │
└─────────────────────────────────────────────────────────────────┘
```

### Toolbar
```typescript
interface ToolbarTool {
  id: ToolId;
  name: string;
  icon: string;
  shortcut: string;
  cursor: string;
}

const tools: ToolbarTool[] = [
  { id: 'select', name: 'בחירה', icon: '🖱️', shortcut: 'V', cursor: 'default' },
  { id: 'hand', name: 'גרירה', icon: '✋', shortcut: 'H', cursor: 'grab' },
  { id: 'text', name: 'טקסט', icon: '📝', shortcut: 'T', cursor: 'text' },
  { id: 'shape', name: 'צורה', icon: '⬜', shortcut: 'R', cursor: 'crosshair' },
  { id: 'line', name: 'קו', icon: '↗️', shortcut: 'L', cursor: 'crosshair' },
  { id: 'sticky', name: 'פתק', icon: '📌', shortcut: 'N', cursor: 'crosshair' },
  { id: 'pen', name: 'עט', icon: '✏️', shortcut: 'P', cursor: 'crosshair' },
  { id: 'highlight', name: 'הדגשה', icon: '🎨', shortcut: 'G', cursor: 'crosshair' },
];
```

### Properties Panel
```
┌─────────────────────────────┐
│  Person Node                │
├─────────────────────────────┤
│                             │
│  Position                   │
│  X: [150]  Y: [200]         │
│                             │
│  Size                       │
│  W: [200]  H: [280]         │
│                             │
│  Display Mode               │
│  [Card            ▼]        │
│                             │
│  Show Systems               │
│  [✓] Dreamspell             │
│  [✓] Tzolkin                │
│  [ ] Astrology              │
│  [ ] Human Design           │
│                             │
│  Style                      │
│  Opacity: [────●──] 100%    │
│  Shadow:  [✓]               │
│  Border:  [ ]               │
│                             │
│  Layer                      │
│  [People          ▼]        │
│                             │
│  [🔒 Lock]  [👁️ Hide]       │
│                             │
└─────────────────────────────┘
```

---

## Interactions

### Selection
```typescript
interface SelectionState {
  selectedIds: Set<NodeId>;
  selectionBox?: SelectionBox;
  transformHandle?: TransformHandle;
}

interface SelectionBox {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

type TransformHandle =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'rotation';
```

### Drag & Drop
```typescript
interface DragState {
  isDragging: boolean;
  draggedIds: NodeId[];
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  snapToGrid: boolean;
}

// Drag from sidebar (add new nodes)
interface DragFromLibrary {
  type: 'person' | 'shape' | 'icon';
  data: unknown;
}
```

### Keyboard Shortcuts
```typescript
const shortcuts = {
  // Tools
  'v': 'select',
  'h': 'hand',
  't': 'text',
  'r': 'shape',
  'l': 'line',

  // Actions
  'delete': 'deleteSelected',
  'backspace': 'deleteSelected',
  'ctrl+c': 'copy',
  'ctrl+v': 'paste',
  'ctrl+d': 'duplicate',
  'ctrl+z': 'undo',
  'ctrl+shift+z': 'redo',
  'ctrl+a': 'selectAll',
  'escape': 'deselect',

  // View
  'ctrl+0': 'fitToScreen',
  'ctrl+=': 'zoomIn',
  'ctrl+-': 'zoomOut',
  'space': 'panMode',

  // Layers
  'ctrl+]': 'bringForward',
  'ctrl+[': 'sendBackward',
  'ctrl+shift+]': 'bringToFront',
  'ctrl+shift+[': 'sendToBack',

  // Alignment
  'ctrl+shift+l': 'alignLeft',
  'ctrl+shift+r': 'alignRight',
  'ctrl+shift+c': 'alignCenter',
  'ctrl+shift+t': 'alignTop',
  'ctrl+shift+b': 'alignBottom',
  'ctrl+shift+m': 'alignMiddle',
};
```

---

## Templates

### Relationship Map Template
```typescript
const relationshipMapTemplate: BoardTemplate = {
  id: 'relationship-map',
  name: 'מפת קשרים',
  description: 'תצוגה ויזואלית של קשרים בין אנשים',
  thumbnail: '/templates/relationship-map.png',
  defaultLayers: ['background', 'people', 'connections', 'annotations'],
  defaultView: 'graph',
  autoPopulate: true,            // Auto-add all people
  autoConnect: true,             // Auto-add relationships
};
```

### Family Tree Template
```typescript
const familyTreeTemplate: BoardTemplate = {
  id: 'family-tree',
  name: 'עץ משפחה',
  description: 'תצוגה היררכית של המשפחה',
  thumbnail: '/templates/family-tree.png',
  defaultLayers: ['background', 'people', 'connections'],
  layout: 'hierarchical',
  filterRelationships: ['family'],
};
```

### Yearly Overview Template
```typescript
const yearlyOverviewTemplate: BoardTemplate = {
  id: 'yearly-overview',
  name: 'סקירה שנתית',
  description: 'מפת שנה עם מחזורים ותחזיות',
  thumbnail: '/templates/yearly.png',
  defaultLayers: ['timeline', 'events', 'annotations'],
  timeRange: { start: 'year-start', end: 'year-end' },
};
```

---

## Export

### Export Formats
```typescript
type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  scale: number;                 // 1 = original, 2 = 2x resolution
  background: boolean;           // Include background
  selection?: NodeId[];          // Export only selection
  quality?: number;              // JPEG quality 0-1
}

async function exportBoard(
  board: Board,
  options: ExportOptions
): Promise<Blob> {
  // Render canvas to desired format
}
```

### PDF Export
```typescript
interface PDFExportOptions extends ExportOptions {
  format: 'pdf';
  pageSize: 'a4' | 'a3' | 'letter' | 'custom';
  orientation: 'portrait' | 'landscape';
  margin: number;
  includeMetadata: boolean;
}
```

### Print CSS
```css
@media print {
  .canvas-editor {
    /* Hide UI elements */
  }

  .canvas-content {
    width: 100%;
    height: auto;
  }

  .node {
    break-inside: avoid;
  }
}
```

---

## Collaboration (Future)

### Real-time Sync
```typescript
interface CollaborationState {
  boardId: BoardId;
  participants: Participant[];
  cursors: Map<UserId, CursorPosition>;
  selections: Map<UserId, NodeId[]>;
}

interface Participant {
  userId: UserId;
  name: string;
  avatar: string;
  color: string;                 // Cursor/selection color
  isOnline: boolean;
}
```

### Conflict Resolution
```typescript
// Use CRDTs or operational transforms for conflict-free editing
type Operation =
  | { type: 'add'; node: CanvasNode }
  | { type: 'delete'; nodeId: NodeId }
  | { type: 'move'; nodeId: NodeId; position: Position }
  | { type: 'update'; nodeId: NodeId; changes: Partial<CanvasNode> };
```

---

## State Management

### Canvas Store
```typescript
interface CanvasStore {
  // State
  board: Board | null;
  canvas: CanvasState;
  history: HistoryState;
  selection: SelectionState;
  activeTool: ToolId;
  activeLayer: LayerId;

  // Actions
  loadBoard: (boardId: BoardId) => Promise<void>;
  saveBoard: () => Promise<void>;

  // Nodes
  addNode: (node: CanvasNode) => void;
  updateNode: (id: NodeId, changes: Partial<CanvasNode>) => void;
  deleteNode: (id: NodeId) => void;
  moveNode: (id: NodeId, position: Position) => void;
  resizeNode: (id: NodeId, size: Size) => void;

  // Selection
  select: (ids: NodeId[]) => void;
  addToSelection: (id: NodeId) => void;
  clearSelection: () => void;

  // Layers
  addLayer: (layer: Layer) => void;
  toggleLayerVisibility: (id: LayerId) => void;
  toggleLayerLock: (id: LayerId) => void;
  reorderLayers: (order: LayerId[]) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

### History (Undo/Redo)
```typescript
interface HistoryState {
  past: CanvasState[];
  future: CanvasState[];
  maxSize: number;               // Limit history size
}

function pushHistory(state: CanvasStore): void {
  state.history.past.push(structuredClone(state.canvas));
  state.history.future = [];

  if (state.history.past.length > state.history.maxSize) {
    state.history.past.shift();
  }
}
```

---

## API Endpoints

```
# Boards
GET    /api/boards                 # List user's boards
POST   /api/boards                 # Create board
GET    /api/boards/:id             # Get board
PATCH  /api/boards/:id             # Update board (auto-save)
DELETE /api/boards/:id             # Delete board
POST   /api/boards/:id/duplicate   # Duplicate board

# Export
POST   /api/boards/:id/export      # Export board to file
GET    /api/boards/:id/thumbnail   # Get board thumbnail

# Templates
GET    /api/templates              # List available templates
POST   /api/boards/from-template   # Create board from template
```

---

## Performance Considerations

### Virtualization
```typescript
// Only render nodes visible in viewport
function getVisibleNodes(
  nodes: CanvasNode[],
  viewBox: ViewBox
): CanvasNode[] {
  return nodes.filter(node => {
    return isRectIntersecting(
      nodeToRect(node),
      viewBoxToRect(viewBox)
    );
  });
}
```

### Throttling
```typescript
// Throttle expensive operations during interaction
const throttledSave = throttle(saveBoard, 2000);
const throttledRerender = throttle(rerender, 16);   // 60fps
```

### Web Workers
```typescript
// Offload heavy calculations to web workers
const layoutWorker = new Worker('/workers/layout.js');

layoutWorker.postMessage({
  type: 'calculateLayout',
  nodes: nodes,
  algorithm: 'force-directed',
});
```

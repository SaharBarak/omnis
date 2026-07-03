// Canvas Editor / Board Types for OmnisX Phase 4
// Domain types for boards, canvas nodes, connections, layers, and annotations

import type { Board as BoardRow, BoardShare } from './database.types'

// ============================================================================
// BOARD TYPES
// ============================================================================

export type BoardTemplate =
  | 'blank'
  | 'relationship-map'
  | 'family-tree'
  | 'yearly-overview'
  | 'personal-profile'
  | 'group-analysis'

export type BoardId = string
export type NodeId = string
export type ConnectionId = string
export type LayerId = string

// Board template configurations
export const BOARD_TEMPLATES: Record<BoardTemplate, { name: string; nameHebrew: string; description: string; descriptionHebrew: string; icon: string }> = {
  'blank': {
    name: 'Blank Canvas',
    nameHebrew: 'קנבס ריק',
    description: 'Start with an empty canvas',
    descriptionHebrew: 'התחל עם קנבס ריק',
    icon: '📄',
  },
  'relationship-map': {
    name: 'Relationship Map',
    nameHebrew: 'מפת קשרים',
    description: 'Visual network of people and relationships',
    descriptionHebrew: 'רשת ויזואלית של אנשים וקשרים',
    icon: '🕸️',
  },
  'family-tree': {
    name: 'Family Tree',
    nameHebrew: 'עץ משפחה',
    description: 'Hierarchical family structure',
    descriptionHebrew: 'מבנה משפחה היררכי',
    icon: '🌳',
  },
  'yearly-overview': {
    name: 'Yearly Overview',
    nameHebrew: 'סקירה שנתית',
    description: 'Timeline with cycles and forecasts',
    descriptionHebrew: 'ציר זמן עם מחזורים ותחזיות',
    icon: '📅',
  },
  'personal-profile': {
    name: 'Personal Profile',
    nameHebrew: 'פרופיל אישי',
    description: 'Single person with all systems',
    descriptionHebrew: 'אדם יחיד עם כל המערכות',
    icon: '👤',
  },
  'group-analysis': {
    name: 'Group Analysis',
    nameHebrew: 'ניתוח קבוצתי',
    description: 'Group dynamics and compatibility',
    descriptionHebrew: 'דינמיקה קבוצתית ותאימות',
    icon: '👥',
  },
}

// ============================================================================
// CANVAS STATE
// ============================================================================

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
  zoom: number // 0.1 - 5.0
}

export interface Background {
  type: 'solid' | 'gradient' | 'image'
  color?: string
  gradient?: { from: string; to: string; angle: number }
  imageUrl?: string
}

export interface GridSettings {
  visible: boolean
  size: number // Grid cell size in pixels
  snap: boolean // Snap to grid
  color: string
}

export interface CanvasState {
  width: number
  height: number
  viewBox: ViewBox
  background: Background
  grid: GridSettings
  nodes: CanvasNode[]
  connections: CanvasConnection[]
  annotations: Annotation[]
}

// Default canvas state
export const DEFAULT_CANVAS_STATE: CanvasState = {
  width: 1920,
  height: 1080,
  viewBox: { x: 0, y: 0, width: 1920, height: 1080, zoom: 1 },
  background: { type: 'solid', color: '#FFFFFF' },
  grid: { visible: true, size: 20, snap: true, color: '#E5E7EB' },
  nodes: [],
  connections: [],
  annotations: [],
}

// ============================================================================
// LAYER TYPES
// ============================================================================

export interface Layer {
  id: LayerId
  name: string
  visible: boolean
  locked: boolean
  opacity: number // 0-1
  order: number
  color: string // Layer indicator color
}

// Default layers
export const DEFAULT_LAYERS: Layer[] = [
  { id: 'background', name: 'רקע', visible: true, locked: false, opacity: 1, order: 0, color: '#9CA3AF' },
  { id: 'people', name: 'אנשים', visible: true, locked: false, opacity: 1, order: 1, color: '#3B82F6' },
  { id: 'connections', name: 'קשרים', visible: true, locked: false, opacity: 1, order: 2, color: '#10B981' },
  { id: 'annotations', name: 'הערות', visible: true, locked: false, opacity: 1, order: 3, color: '#F59E0B' },
]

// System-specific layers
export const SYSTEM_LAYERS: Layer[] = [
  { id: 'dreamspell', name: 'דרימספל', visible: true, locked: false, opacity: 1, order: 10, color: '#EF4444' },
  { id: 'tzolkin', name: 'צולקין', visible: true, locked: false, opacity: 1, order: 11, color: '#F97316' },
  { id: 'astrology', name: 'אסטרולוגיה', visible: true, locked: false, opacity: 1, order: 12, color: '#8B5CF6' },
  { id: 'human-design', name: 'יומן אדם', visible: true, locked: false, opacity: 1, order: 13, color: '#EC4899' },
  { id: 'gematria', name: 'גימטריה', visible: true, locked: false, opacity: 1, order: 14, color: '#06B6D4' },
]

// ============================================================================
// NODE TYPES
// ============================================================================

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface ShadowStyle {
  color: string
  blur: number
  offsetX: number
  offsetY: number
}

export interface BorderStyle {
  color: string
  width: number
  radius: number
  style: 'solid' | 'dashed' | 'dotted'
}

export interface NodeStyle {
  opacity: number
  shadow?: ShadowStyle
  border?: BorderStyle
}

interface BaseNode {
  id: NodeId
  type: string
  position: Position
  size: Size
  rotation: number
  locked: boolean
  visible: boolean
  layerId: LayerId
  zIndex: number
  style: NodeStyle
}

// Person display modes
export type PersonDisplayMode = 'avatar' | 'mini' | 'card' | 'detailed'

// System types for filtering
export type SystemType = 'dreamspell' | 'tzolkin' | 'longcount' | 'humandesign' | 'astrology' | 'gematria'

export interface PersonNode extends BaseNode {
  type: 'person'
  personId: string
  display: PersonDisplayMode
  showSystems: SystemType[]
}

// Card variants
export type CardVariant = 'a5-full' | 'compact' | 'oracle-only' | 'sign-only'

export interface CardNode extends BaseNode {
  type: 'card'
  personId: string
  system: SystemType
  variant: CardVariant
}

// Chart types
export type ChartType = 'compatibility-matrix' | 'element-distribution' | 'timeline' | 'bodygraph' | 'natal-chart'

export interface ChartData {
  personIds?: string[]
  groupId?: string
  startDate?: string
  endDate?: string
  options?: Record<string, unknown>
}

export interface ChartNode extends BaseNode {
  type: 'chart'
  chartType: ChartType
  data: ChartData
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  alignment: 'right' | 'center' | 'left'
  direction: 'rtl' | 'ltr'
  lineHeight?: number
}

export interface TextNode extends BaseNode {
  type: 'text'
  content: string
  textStyle: TextStyle
}

export interface ImageNode extends BaseNode {
  type: 'image'
  src: string
  alt?: string
  fit: 'contain' | 'cover' | 'fill'
}

// Shape types
export type ShapeType = 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line' | 'path'

export interface FillStyle {
  type: 'solid' | 'gradient' | 'none'
  color?: string
  gradient?: { from: string; to: string; angle: number }
}

export interface StrokeStyle {
  color: string
  width: number
  dash?: number[]
}

export interface ShapeNode extends BaseNode {
  type: 'shape'
  shape: ShapeType
  fill: FillStyle
  stroke: StrokeStyle
  points?: Position[] // For path/polygon
}

export interface GroupNode extends BaseNode {
  type: 'group'
  childIds: NodeId[]
  collapsed: boolean
  label?: string
}

// Sticky note color type (moved here so StickyNote can use it in CanvasNode union)
export type StickyColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple'

export interface StickyNote extends BaseNode {
  type: 'sticky'
  content: string
  color: StickyColor
}

// Union type for all nodes
export type CanvasNode =
  | PersonNode
  | CardNode
  | ChartNode
  | TextNode
  | ImageNode
  | ShapeNode
  | GroupNode
  | StickyNote

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionType = 'relationship' | 'flow' | 'line' | 'curve'
export type Anchor = 'top' | 'right' | 'bottom' | 'left' | 'center' | 'auto'
export type Marker = 'none' | 'arrow' | 'circle' | 'diamond'

export interface ConnectionStyle {
  color: string
  width: number
  dash?: number[]
  startMarker?: Marker
  endMarker?: Marker
}

export interface CanvasConnection {
  id: ConnectionId
  type: ConnectionType
  sourceId: NodeId
  targetId: NodeId
  sourceAnchor: Anchor
  targetAnchor: Anchor
  style: ConnectionStyle
  label?: string
  layerId: LayerId
}

// ============================================================================
// ANNOTATION TYPES
// ============================================================================

// Note: StickyColor type is defined above (near StickyNote) to allow inclusion in CanvasNode type

export const STICKY_COLORS: Record<StickyColor, string> = {
  yellow: '#FEF3C7',
  pink: '#FCE7F3',
  blue: '#DBEAFE',
  green: '#D1FAE5',
  purple: '#EDE9FE',
}

// Note: StickyNote interface is defined above (near CanvasNode union) to allow inclusion in CanvasNode type

export interface Highlight extends BaseNode {
  type: 'highlight'
  targetIds: NodeId[]
  color: string
  label?: string
}

export interface Callout extends BaseNode {
  type: 'callout'
  targetId: NodeId
  content: string
  pointer: 'top' | 'right' | 'bottom' | 'left'
}

export interface Freehand {
  id: NodeId
  type: 'freehand'
  points: Position[]
  color: string
  width: number
  layerId: LayerId
}

export type Annotation = StickyNote | Highlight | Callout | Freehand

// ============================================================================
// TOOLBAR & TOOLS
// ============================================================================

export type ToolId = 'select' | 'hand' | 'text' | 'shape' | 'line' | 'sticky' | 'pen' | 'highlight'

export interface Tool {
  id: ToolId
  name: string
  nameHebrew: string
  icon: string
  shortcut: string
  cursor: string
}

export const TOOLS: Tool[] = [
  { id: 'select', name: 'Select', nameHebrew: 'בחירה', icon: 'MousePointer2', shortcut: 'V', cursor: 'default' },
  { id: 'hand', name: 'Hand', nameHebrew: 'גרירה', icon: 'Hand', shortcut: 'H', cursor: 'grab' },
  { id: 'text', name: 'Text', nameHebrew: 'טקסט', icon: 'Type', shortcut: 'T', cursor: 'text' },
  { id: 'shape', name: 'Shape', nameHebrew: 'צורה', icon: 'Square', shortcut: 'R', cursor: 'crosshair' },
  { id: 'line', name: 'Line', nameHebrew: 'קו', icon: 'Minus', shortcut: 'L', cursor: 'crosshair' },
  { id: 'sticky', name: 'Sticky', nameHebrew: 'פתק', icon: 'StickyNote', shortcut: 'N', cursor: 'crosshair' },
  { id: 'pen', name: 'Pen', nameHebrew: 'עט', icon: 'Pencil', shortcut: 'P', cursor: 'crosshair' },
  { id: 'highlight', name: 'Highlight', nameHebrew: 'הדגשה', icon: 'Highlighter', shortcut: 'G', cursor: 'crosshair' },
]

// ============================================================================
// SELECTION & INTERACTION
// ============================================================================

export interface SelectionBox {
  start: Position
  end: Position
}

export type TransformHandle =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'rotation'

export interface SelectionState {
  selectedIds: Set<NodeId>
  selectionBox?: SelectionBox
  transformHandle?: TransformHandle
}

export interface DragState {
  isDragging: boolean
  draggedIds: NodeId[]
  startPosition: Position
  currentPosition: Position
  snapToGrid: boolean
}

// ============================================================================
// HISTORY (UNDO/REDO)
// ============================================================================

export interface HistoryState {
  past: CanvasState[]
  future: CanvasState[]
  maxSize: number
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  scale: number // 1 = original, 2 = 2x resolution
  background: boolean
  selection?: NodeId[]
  quality?: number // JPEG quality 0-1
}

export interface PDFExportOptions extends ExportOptions {
  format: 'pdf'
  pageSize: 'a4' | 'a3' | 'letter' | 'custom'
  orientation: 'portrait' | 'landscape'
  margin: number
  includeMetadata: boolean
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export interface CreateBoardInput {
  name: string
  description?: string
  template?: BoardTemplate
}

export interface UpdateBoardInput {
  name?: string
  description?: string | null
  canvas?: CanvasState
  layers?: Layer[]
  thumbnail?: string | null
  isPublic?: boolean
}

export interface CreateBoardShareInput {
  permissions?: 'view' | 'comment' | 'edit'
  expiresAt?: string
  maxViews?: number
  password?: string
}

// ============================================================================
// EXTENDED TYPES
// ============================================================================

export interface BoardWithStats extends BoardRow {
  nodeCount: number
  shareCount?: number
}

export interface BoardShareWithUrl extends BoardShare {
  url: string
}

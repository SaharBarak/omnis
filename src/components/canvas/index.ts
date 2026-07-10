// Canvas Editor Components for Pleiad Phase 4

export { CanvasProvider, useCanvas } from './canvas-context'
export { CanvasEditor } from './canvas-editor'
export { CanvasToolbar } from './canvas-toolbar'
export { PropertiesPanel } from './properties-panel'
export { LayersPanel } from './layers-panel'
export { ConnectionPropertiesPanel } from './connection-properties'

// Node components
export { PersonCanvasNode } from './nodes/person-node'
export { TextCanvasNode } from './nodes/text-node'
export { ShapeCanvasNode } from './nodes/shape-node'
export { StickyCanvasNode } from './nodes/sticky-node'

// Annotation node components
export { HighlightCanvasNode } from './nodes/highlight-node'
export { CalloutCanvasNode } from './nodes/callout-node'
export { FreehandCanvasNode } from './nodes/freehand-node'

// Edge components
export { RelationshipEdge, FlowEdge, LineEdge, CurveEdge, edgeTypes } from './edges'

// Hooks
export { useKeyboardShortcuts } from './use-keyboard-shortcuts'

// Dialogs
export { ExportDialog } from './export-dialog'
export { TemplateSelector, InlineTemplateSelector } from './template-selector'

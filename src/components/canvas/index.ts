// Canvas Editor Components for Omnis Phase 4

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

// Edge components
export { RelationshipEdge, FlowEdge, LineEdge, CurveEdge, edgeTypes } from './edges'

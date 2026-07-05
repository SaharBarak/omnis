import { RelationshipEdge } from './relationship-edge'
import { FlowEdge } from './flow-edge'
import { LineEdge } from './line-edge'
import { CurveEdge } from './curve-edge'

export { RelationshipEdge } from './relationship-edge'
export { FlowEdge } from './flow-edge'
export { LineEdge } from './line-edge'
export { CurveEdge } from './curve-edge'

export const edgeTypes = {
  relationship: RelationshipEdge,
  flow: FlowEdge,
  line: LineEdge,
  curve: CurveEdge,
}

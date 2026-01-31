# Relationships Component Specification

> **Status:** COMPLETE
> **Phase:** 2 (Relationship Graph + Groups)
> **Implemented:** Graph visualization, compatibility analysis, group dynamics

## Overview

The Relationships component models connections between people, enabling network visualization and group analysis across symbolic systems.

---

## Data Model

### Relationship Entity
```typescript
interface Relationship {
  id: RelationshipId;
  ownerId: UserId;
  person1Id: PersonId;
  person2Id: PersonId;
  type: RelationshipType;
  subtype?: string;              // Custom subtype
  bidirectional: boolean;        // true = mutual, false = directional
  strength: RelationshipStrength;
  startDate?: ISODate;           // When relationship started
  endDate?: ISODate;             // If relationship ended
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

type RelationshipType =
  | 'family'
  | 'romantic'
  | 'friend'
  | 'professional'
  | 'other';

interface RelationshipSubtypes {
  family: [
    'parent-child',
    'child-parent',
    'sibling',
    'grandparent-grandchild',
    'aunt-uncle-niece-nephew',
    'cousin',
    'in-law',
    'step-family',
  ];
  romantic: [
    'spouse',
    'partner',
    'dating',
    'ex',
  ];
  friend: [
    'close-friend',
    'friend',
    'acquaintance',
  ];
  professional: [
    'colleague',
    'manager-report',
    'mentor-mentee',
    'business-partner',
    'client',
  ];
}

type RelationshipStrength = 1 | 2 | 3 | 4 | 5;
// 1 = Distant, 5 = Very close
```

### Relationship with Computed Data
```typescript
interface RelationshipWithAnalysis extends Relationship {
  person1: Person;
  person2: Person;
  analysis: {
    dreamspell?: DreamspellCompatibility;
    tzolkin?: TzolkinCompatibility;
    astrology?: AstrologyCompatibility;
    humanDesign?: HumanDesignCompatibility;
    gematria?: GematriaCompatibility;
  };
}
```

---

## Relationship Types Detail

### Family Relationships
```typescript
interface FamilyRelationship extends Relationship {
  type: 'family';
  subtype: FamilySubtype;
  generation: number;            // 0 = same generation, +1 = parent, -1 = child
  bloodRelated: boolean;
}

type FamilySubtype =
  | 'parent'      // person1 is parent of person2
  | 'child'       // person1 is child of person2
  | 'sibling'     // same generation, blood related
  | 'spouse'      // married
  | 'grandparent'
  | 'grandchild'
  | 'aunt-uncle'
  | 'niece-nephew'
  | 'cousin'
  | 'in-law'
  | 'step';

// Automatically infer reverse relationships
function inferReverseRelationship(subtype: FamilySubtype): FamilySubtype {
  const reversals: Partial<Record<FamilySubtype, FamilySubtype>> = {
    'parent': 'child',
    'child': 'parent',
    'grandparent': 'grandchild',
    'grandchild': 'grandparent',
    'aunt-uncle': 'niece-nephew',
    'niece-nephew': 'aunt-uncle',
  };
  return reversals[subtype] || subtype;
}
```

### Family Tree Inference
```typescript
// Given parent-child relationships, infer siblings
function inferSiblings(relationships: Relationship[]): Relationship[] {
  const parentChildMap = new Map<PersonId, PersonId[]>(); // parent -> children

  // Build parent-children map
  for (const rel of relationships) {
    if (rel.subtype === 'parent') {
      const children = parentChildMap.get(rel.person1Id) || [];
      children.push(rel.person2Id);
      parentChildMap.set(rel.person1Id, children);
    }
  }

  // Infer sibling relationships
  const siblings: Relationship[] = [];
  for (const children of parentChildMap.values()) {
    if (children.length > 1) {
      for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
          siblings.push({
            id: generateId(),
            person1Id: children[i],
            person2Id: children[j],
            type: 'family',
            subtype: 'sibling',
            bidirectional: true,
            inferred: true,  // Mark as system-generated
          });
        }
      }
    }
  }

  return siblings;
}
```

---

## Network Graph

### Graph Data Structure
```typescript
interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
}

interface GraphNode {
  id: PersonId;
  person: Person;
  position?: { x: number; y: number };
  size: number;                  // Based on connection count
  color: string;                 // Based on primary tag or system
  selected: boolean;
  pinned: boolean;               // User-fixed position
}

interface GraphEdge {
  id: RelationshipId;
  source: PersonId;
  target: PersonId;
  relationship: Relationship;
  weight: number;                // Based on strength
  color: string;                 // Based on relationship type
  style: 'solid' | 'dashed';     // Active vs historical
}

interface GraphCluster {
  id: string;
  name: string;
  personIds: PersonId[];
  color: string;
  expanded: boolean;
}
```

### Graph Visualization
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 -] [🔍 +]  [⟳ Reset]  [📌 Lock]      [Filter ▼]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     ┌───┐                                   │
│                     │Mom├────────────┐                      │
│                     └─┬─┘            │                      │
│                       │              │                      │
│              ┌────────┴────────┐     │                      │
│              │                 │     │                      │
│            ┌─┴─┐             ┌─┴─┐ ┌─┴─┐                    │
│            │You│─────────────│Sis│ │Dad│                    │
│            └─┬─┘             └───┘ └───┘                    │
│              │                                              │
│     ┌────────┼────────┐                                     │
│     │        │        │                                     │
│   ┌─┴─┐    ┌─┴─┐    ┌─┴─┐                                  │
│   │Kid│    │Kid│    │Par│                                  │
│   └───┘    └───┘    └───┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Legend:
━━━ Family (red)
--- Friend (blue)
... Professional (gray)
─── Romantic (pink)
```

### Graph Interactions
```typescript
interface GraphInteractions {
  // Navigation
  zoom: (delta: number) => void;
  pan: (dx: number, dy: number) => void;
  fitToScreen: () => void;
  centerOnNode: (nodeId: PersonId) => void;

  // Selection
  selectNode: (nodeId: PersonId) => void;
  selectEdge: (edgeId: RelationshipId) => void;
  selectMultiple: (nodeIds: PersonId[]) => void;
  clearSelection: () => void;

  // Layout
  pinNode: (nodeId: PersonId, position: { x: number; y: number }) => void;
  unpinNode: (nodeId: PersonId) => void;
  runLayout: (algorithm: LayoutAlgorithm) => void;

  // Filtering
  showOnlyType: (type: RelationshipType) => void;
  highlightPath: (from: PersonId, to: PersonId) => void;
  expandCluster: (clusterId: string) => void;
  collapseCluster: (clusterId: string) => void;
}

type LayoutAlgorithm =
  | 'force-directed'   // Default, organic layout
  | 'hierarchical'     // Tree-like, good for family
  | 'circular'         // Nodes in circle
  | 'grid';            // Aligned grid
```

---

## Group Analysis

### Group Definition
```typescript
interface Group {
  id: GroupId;
  ownerId: UserId;
  name: string;
  description?: string;
  personIds: PersonId[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Predefined group types
type GroupPreset =
  | 'immediate-family'   // Parents + siblings + children
  | 'extended-family'    // All family relationships
  | 'household'          // People living together
  | 'friend-group'
  | 'work-team';
```

### Group Analysis Results
```typescript
interface GroupAnalysis {
  group: Group;
  people: Person[];

  // Per-system analysis
  dreamspell: {
    kinDistribution: Record<number, PersonId[]>;
    sealDistribution: Record<number, PersonId[]>;
    toneDistribution: Record<number, PersonId[]>;
    colorBalance: Record<ColorFamily, number>;
    oracleConnections: OracleConnection[];
  };

  tzolkin: {
    signDistribution: Record<number, PersonId[]>;
    toneDistribution: Record<number, PersonId[]>;
    trecenaOverlaps: TrecenaOverlap[];
  };

  gematria: {
    totalValue: number;
    averageValue: number;
    matchingPairs: GematriaPair[];
  };

  // Compatibility matrices
  compatibilityMatrix: CompatibilityMatrix;
}

interface CompatibilityMatrix {
  system: SystemType;
  matrix: Array<{
    person1Id: PersonId;
    person2Id: PersonId;
    score: number;          // 0-100
    aspects: string[];      // What contributes to score
  }>;
}
```

### Compatibility Visualization
```
┌─────────────────────────────────────────────────────────────┐
│  תאימות קבוצתית - דרימספל                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         ליאור    מיכל     דני      שרה                     │
│  ליאור    —      85%      62%      78%                     │
│  מיכל    85%      —       71%      59%                     │
│  דני     62%     71%       —       83%                     │
│  שרה     78%     59%      83%       —                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  חוזקות הקבוצה:                                             │
│  • 3 אנשים עם חותם אדום (אנרגיה פעילה)                     │
│  • צמד אנלוגי: ליאור ↔ שרה                                │
│  • מגוון טונים מלא (1-13)                                  │
│                                                             │
│  אתגרי הקבוצה:                                              │
│  • חסרה אנרגיה צהובה (יצירתיות)                            │
│  • דני ← מיכל: קשר אנטיפוד (מתח)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Compatibility Rules per System

### Dreamspell Compatibility
```typescript
interface DreamspellCompatibility {
  person1Kin: number;
  person2Kin: number;
  score: number;
  connections: DreamspellConnection[];
}

interface DreamspellConnection {
  type: 'analog' | 'antipode' | 'occult' | 'guide' | 'same-seal' | 'same-tone' | 'same-color';
  description: string;
  harmony: 'supportive' | 'challenging' | 'transformative' | 'neutral';
}

function calculateDreamspellCompatibility(kin1: number, kin2: number): DreamspellCompatibility {
  const oracle1 = calculateOracle(kin1);
  const oracle2 = calculateOracle(kin2);

  const connections: DreamspellConnection[] = [];

  // Check if person2 appears in person1's oracle
  if (oracle1.analog === oracle2.seal) {
    connections.push({
      type: 'analog',
      description: 'תמיכה הדדית',
      harmony: 'supportive',
    });
  }

  if (oracle1.antipode === oracle2.seal) {
    connections.push({
      type: 'antipode',
      description: 'אתגר וצמיחה',
      harmony: 'challenging',
    });
  }

  if (oracle1.occult === oracle2.seal) {
    connections.push({
      type: 'occult',
      description: 'כוח נסתר משותף',
      harmony: 'transformative',
    });
  }

  // Same seal = kindred spirits
  if (oracle1.seal === oracle2.seal) {
    connections.push({
      type: 'same-seal',
      description: 'אותו חותם - נשמות תאומות',
      harmony: 'supportive',
    });
  }

  // Same tone = similar expression
  if (oracle1.tone === oracle2.tone) {
    connections.push({
      type: 'same-tone',
      description: 'אותו טון - הרמוניה בביטוי',
      harmony: 'supportive',
    });
  }

  const score = calculateCompatibilityScore(connections);

  return { person1Kin: kin1, person2Kin: kin2, score, connections };
}
```

### Astrology Compatibility (Synastry)
```typescript
interface AstrologyCompatibility {
  sunSunAspect?: AspectInstance;
  moonMoonAspect?: AspectInstance;
  venusVenusAspect?: AspectInstance;
  venusMarsAspect?: AspectInstance;
  interAspects: AspectInstance[];
  overallScore: number;
  highlights: string[];
  challenges: string[];
}
```

---

## Relationship CRUD

### Create Relationship
```
┌─────────────────────────────────────────┐
│  הוסף קשר                        [✕]   │
├─────────────────────────────────────────┤
│                                         │
│  אדם 1                                  │
│  ┌───────────────────────────────────┐  │
│  │ 🔍 ליאור                     [✓]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  אדם 2                                  │
│  ┌───────────────────────────────────┐  │
│  │ 🔍 בחר אדם...                     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  סוג קשר                                │
│  (●) משפחה  ( ) רומנטי  ( ) חברים      │
│  ( ) עבודה  ( ) אחר                    │
│                                         │
│  תת-סוג                                 │
│  ┌───────────────────────────────────┐  │
│  │ הורה-ילד                       ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  עוצמת הקשר                             │
│  ○ ○ ○ ● ○                              │
│  רחוק          קרוב מאוד               │
│                                         │
│  הערות                                  │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │            שמור                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Sharing

### Share Options
```typescript
interface ShareOptions {
  people: PersonId[];
  relationships: RelationshipId[];
  includeSystems: SystemType[];
  includeAnalysis: boolean;

  shareType: 'link' | 'invite' | 'export';
  expiration?: Date;
  maxViews?: number;
  password?: string;
}

interface SharedView {
  id: ShareId;
  ownerId: UserId;
  options: ShareOptions;
  url: string;
  createdAt: ISODateTime;
  expiresAt?: ISODateTime;
  viewCount: number;
  active: boolean;
}
```

### Share Link View
Read-only view for recipients, no account required.

```
┌─────────────────────────────────────────────────────────────┐
│  משפחת כהן - מפת קשרים                                     │
│  שותף על ידי ליאור • בתוקף עד 15.2.2025                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Graph visualization of shared people/relationships]       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  רוצה ליצור מפה משלך?                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              הירשם ל-Omnis                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

```
# Relationships
GET    /api/relationships                    # List all relationships
POST   /api/relationships                    # Create relationship
GET    /api/relationships/:id                # Get relationship
PATCH  /api/relationships/:id                # Update relationship
DELETE /api/relationships/:id                # Delete relationship

# Graph
GET    /api/relationships/graph              # Get full graph data
GET    /api/relationships/graph/:personId    # Get graph centered on person

# Groups
GET    /api/groups                           # List groups
POST   /api/groups                           # Create group
GET    /api/groups/:id                       # Get group
PATCH  /api/groups/:id                       # Update group
DELETE /api/groups/:id                       # Delete group
GET    /api/groups/:id/analysis              # Get group analysis

# Sharing
POST   /api/share                            # Create share link
GET    /api/share/:id                        # Get shared view (public)
DELETE /api/share/:id                        # Revoke share link
```

---

## Database Schema

```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  person1_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subtype TEXT,
  bidirectional BOOLEAN DEFAULT TRUE,
  strength INTEGER DEFAULT 3 CHECK (strength >= 1 AND strength <= 5),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (owner_id, person1_id, person2_id, type)
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, person_id)
);

CREATE TABLE shared_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  options JSONB NOT NULL,
  url TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_relationships_owner ON relationships(owner_id);
CREATE INDEX idx_relationships_person1 ON relationships(person1_id);
CREATE INDEX idx_relationships_person2 ON relationships(person2_id);
CREATE INDEX idx_groups_owner ON groups(owner_id);

-- RLS Policies
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own relationships"
  ON relationships FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own groups"
  ON groups FOR ALL USING (auth.uid() = owner_id);
```

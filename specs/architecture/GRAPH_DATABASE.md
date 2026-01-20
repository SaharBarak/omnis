# Graph Database & Knowledge Architecture

## Overview

A hybrid database architecture combining relational data (PostgreSQL), graph queries (Apache AGE or Neo4j), vector embeddings (pgvector), and knowledge graphs for efficient interaction management across large groups and multiple symbolic systems.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Application Layer                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Query API  │  │  Graph API  │  │ Vector API  │  │    AI API   │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │               │
├─────────┴────────────────┴────────────────┴────────────────┴───────────────┤
│                           Unified Query Layer                               │
│                        (Abstraction & Caching)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   PostgreSQL    │  │   Graph Store   │  │  Vector Store   │            │
│  │   (Relational)  │  │  (Apache AGE)   │  │   (pgvector)    │            │
│  │                 │  │                 │  │                 │            │
│  │  • Users        │  │  • Person nodes │  │  • Embeddings   │            │
│  │  • People       │  │  • Kin nodes    │  │  • Semantic     │            │
│  │  • Systems      │  │  • Edges        │  │    search       │            │
│  │  • Results      │  │  • Paths        │  │  • RAG chunks   │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│           │                    │                    │                      │
│           └────────────────────┴────────────────────┘                      │
│                                │                                           │
│                    ┌───────────┴───────────┐                               │
│                    │   Knowledge Graph     │                               │
│                    │   (Semantic Layer)    │                               │
│                    │                       │                               │
│                    │  • Concepts           │                               │
│                    │  • Relationships      │                               │
│                    │  • Inferences         │                               │
│                    └───────────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Schema Design

### Entity-Relationship Model

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users     │       │    People    │       │    Groups    │
│──────────────│       │──────────────│       │──────────────│
│ id           │──┐    │ id           │──┐    │ id           │
│ email        │  │    │ owner_id     │◄─┘    │ owner_id     │
│ created_at   │  │    │ name         │       │ name         │
└──────────────┘  │    │ birth_date   │       │ members[]    │
                  │    │ kin_data     │       └──────────────┘
                  │    └──────┬───────┘
                  │           │
                  │    ┌──────┴───────┐
                  │    │              │
                  │    ▼              ▼
                  │ ┌──────────────┐ ┌──────────────┐
                  │ │ Kin Profiles │ │ Interactions │
                  │ │──────────────│ │──────────────│
                  │ │ person_id    │ │ person1_id   │
                  │ │ system       │ │ person2_id   │
                  │ │ kin_number   │ │ scores{}     │
                  │ │ seal         │ │ forces{}     │
                  │ │ tone         │ │ cached_at    │
                  │ │ oracle{}     │ └──────────────┘
                  │ └──────────────┘
                  │
                  │    ┌──────────────┐
                  └───►│  Workspaces  │
                       │──────────────│
                       │ id           │
                       │ owner_id     │
                       │ people[]     │
                       │ graphs[]     │
                       └──────────────┘
```

---

## Relational Schema (PostgreSQL)

### Core Tables

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "age";           -- Apache AGE for graphs

-- Users (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  quotas JSONB NOT NULL DEFAULT '{"people": 10, "groups": 5}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- People with denormalized kin data for fast queries
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  hebrew_name TEXT,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_place JSONB,

  -- Denormalized Dreamspell (for fast queries)
  ds_kin SMALLINT,               -- 1-260
  ds_seal SMALLINT,              -- 1-20
  ds_tone SMALLINT,              -- 1-13
  ds_color TEXT,                 -- red/white/blue/yellow
  ds_earth_family TEXT,          -- polar/cardinal/core/signal/gateway
  ds_oracle JSONB,               -- {guide, analog, antipode, occult}

  -- Denormalized Tzolkin
  tz_tone SMALLINT,
  tz_day_sign SMALLINT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX idx_people_owner ON people(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_ds_kin ON people(ds_kin);
CREATE INDEX idx_people_ds_seal ON people(ds_seal);
CREATE INDEX idx_people_ds_tone ON people(ds_tone);
CREATE INDEX idx_people_ds_color ON people(ds_color);
CREATE INDEX idx_people_ds_earth_family ON people(ds_earth_family);
CREATE INDEX idx_people_tz_day_sign ON people(tz_day_sign);
CREATE INDEX idx_people_tags ON people USING GIN(tags);

-- Full system results (detailed, computed on demand)
CREATE TABLE system_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  system TEXT NOT NULL,          -- dreamspell, tzolkin, astrology, etc.
  version TEXT NOT NULL,         -- Algorithm version
  data JSONB NOT NULL,           -- Full computed result
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(person_id, system, version)
);

CREATE INDEX idx_system_results_lookup ON system_results(person_id, system);
```

### Pre-computed Interactions Table

```sql
-- Pre-computed pairwise interactions (the key to fast group queries)
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The pair (always stored with smaller ID first for uniqueness)
  person1_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,

  -- Ensure person1_id < person2_id for canonical ordering
  CONSTRAINT ordered_pair CHECK (person1_id < person2_id),
  UNIQUE(person1_id, person2_id),

  -- Oracle relationships (boolean flags for fast filtering)
  is_analog BOOLEAN NOT NULL DEFAULT FALSE,
  is_antipode BOOLEAN NOT NULL DEFAULT FALSE,
  is_occult BOOLEAN NOT NULL DEFAULT FALSE,
  is_guide_1to2 BOOLEAN NOT NULL DEFAULT FALSE,  -- person1 guides person2
  is_guide_2to1 BOOLEAN NOT NULL DEFAULT FALSE,  -- person2 guides person1
  is_same_seal BOOLEAN NOT NULL DEFAULT FALSE,
  is_same_tone BOOLEAN NOT NULL DEFAULT FALSE,
  is_same_color BOOLEAN NOT NULL DEFAULT FALSE,
  is_same_family BOOLEAN NOT NULL DEFAULT FALSE,

  -- Computed scores (0-100)
  oracle_score SMALLINT NOT NULL,
  tone_score SMALLINT NOT NULL,
  color_score SMALLINT NOT NULL,
  family_score SMALLINT NOT NULL,
  overall_score SMALLINT NOT NULL,

  -- Detailed force data
  forces JSONB NOT NULL DEFAULT '{}',

  -- Cache metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version TEXT NOT NULL DEFAULT '1.0'
);

-- Indexes for interaction queries
CREATE INDEX idx_interactions_person1 ON interactions(person1_id);
CREATE INDEX idx_interactions_person2 ON interactions(person2_id);
CREATE INDEX idx_interactions_overall_score ON interactions(overall_score DESC);
CREATE INDEX idx_interactions_analog ON interactions(is_analog) WHERE is_analog = TRUE;
CREATE INDEX idx_interactions_occult ON interactions(is_occult) WHERE is_occult = TRUE;

-- Function to get interaction for any pair order
CREATE OR REPLACE FUNCTION get_interaction(p1 UUID, p2 UUID)
RETURNS interactions AS $$
BEGIN
  IF p1 < p2 THEN
    RETURN (SELECT * FROM interactions WHERE person1_id = p1 AND person2_id = p2);
  ELSE
    RETURN (SELECT * FROM interactions WHERE person1_id = p2 AND person2_id = p1);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-compute interactions when people are created/updated
CREATE OR REPLACE FUNCTION compute_interactions_for_person()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue interaction computation for this person with all others in same owner
  INSERT INTO interaction_queue (person_id, owner_id, created_at)
  VALUES (NEW.id, NEW.owner_id, NOW())
  ON CONFLICT (person_id) DO UPDATE SET created_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compute_interactions
AFTER INSERT OR UPDATE OF ds_kin, ds_seal, ds_tone ON people
FOR EACH ROW EXECUTE FUNCTION compute_interactions_for_person();

-- Queue for async interaction computation
CREATE TABLE interaction_queue (
  person_id UUID PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_interaction_queue_pending ON interaction_queue(created_at)
WHERE processed_at IS NULL;
```

### Groups and Workspaces

```sql
-- Groups of people
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Denormalized member IDs for fast queries
  member_ids UUID[] NOT NULL DEFAULT '{}',
  member_count INTEGER NOT NULL DEFAULT 0,

  -- Pre-computed group analysis
  analysis JSONB,                -- Color balance, tone spectrum, etc.
  analysis_version TEXT,
  analyzed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_owner ON groups(owner_id);
CREATE INDEX idx_groups_members ON groups USING GIN(member_ids);

-- Group membership (for complex queries)
CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, person_id)
);

-- Workspaces (collections of people, groups, and boards)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Scope
  people_ids UUID[] NOT NULL DEFAULT '{}',
  group_ids UUID[] NOT NULL DEFAULT '{}',

  -- Settings
  default_systems TEXT[] DEFAULT ARRAY['dreamspell', 'tzolkin'],
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Graph Layer (Apache AGE)

### Graph Schema

```sql
-- Create the graph
SELECT create_graph('omnis_graph');

-- Create vertex labels
SELECT create_vlabel('omnis_graph', 'Person');
SELECT create_vlabel('omnis_graph', 'Kin');
SELECT create_vlabel('omnis_graph', 'Seal');
SELECT create_vlabel('omnis_graph', 'Tone');
SELECT create_vlabel('omnis_graph', 'Color');
SELECT create_vlabel('omnis_graph', 'EarthFamily');
SELECT create_vlabel('omnis_graph', 'Concept');

-- Create edge labels
SELECT create_elabel('omnis_graph', 'HAS_KIN');
SELECT create_elabel('omnis_graph', 'ANALOG_OF');
SELECT create_elabel('omnis_graph', 'ANTIPODE_OF');
SELECT create_elabel('omnis_graph', 'OCCULT_OF');
SELECT create_elabel('omnis_graph', 'GUIDES');
SELECT create_elabel('omnis_graph', 'SAME_COLOR');
SELECT create_elabel('omnis_graph', 'SAME_FAMILY');
SELECT create_elabel('omnis_graph', 'RELATES_TO');
SELECT create_elabel('omnis_graph', 'BELONGS_TO');
SELECT create_elabel('omnis_graph', 'IS_A');
```

### Graph Node Creation

```sql
-- Function to sync person to graph
CREATE OR REPLACE FUNCTION sync_person_to_graph(p people)
RETURNS VOID AS $$
DECLARE
  person_vertex_id graphid;
  kin_vertex_id graphid;
BEGIN
  -- Create/update Person vertex
  EXECUTE format(
    'SELECT * FROM cypher(''omnis_graph'', $$
      MERGE (p:Person {id: %L})
      SET p.name = %L,
          p.owner_id = %L,
          p.ds_kin = %s,
          p.ds_seal = %s,
          p.ds_tone = %s
      RETURN id(p)
    $$) AS (id agtype)',
    p.id, p.name, p.owner_id, p.ds_kin, p.ds_seal, p.ds_tone
  ) INTO person_vertex_id;

  -- Link to Kin node
  EXECUTE format(
    'SELECT * FROM cypher(''omnis_graph'', $$
      MATCH (p:Person {id: %L})
      MERGE (k:Kin {number: %s})
      MERGE (p)-[:HAS_KIN]->(k)
    $$) AS (result agtype)',
    p.id, p.ds_kin
  );

  -- Link to Seal node
  EXECUTE format(
    'SELECT * FROM cypher(''omnis_graph'', $$
      MATCH (p:Person {id: %L})
      MERGE (s:Seal {number: %s})
      MERGE (p)-[:HAS_SEAL]->(s)
    $$) AS (result agtype)',
    p.id, p.ds_seal
  );

END;
$$ LANGUAGE plpgsql;

-- Trigger to sync on insert/update
CREATE TRIGGER sync_person_graph
AFTER INSERT OR UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION sync_person_to_graph(NEW);
```

### Graph Queries

```sql
-- Find all analog partners for a person
CREATE OR REPLACE FUNCTION find_analog_partners(person_id UUID)
RETURNS TABLE(partner_id UUID, partner_name TEXT, score INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM cypher('omnis_graph', $$
    MATCH (p:Person {id: $person_id})-[:HAS_SEAL]->(s:Seal)
    MATCH (s)<-[:ANALOG_OF]-(analog_seal:Seal)
    MATCH (partner:Person)-[:HAS_SEAL]->(analog_seal)
    WHERE partner.owner_id = p.owner_id
    RETURN partner.id, partner.name, 95
  $$, person_id) AS (partner_id UUID, partner_name TEXT, score INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Find path between two people through symbolic connections
CREATE OR REPLACE FUNCTION find_symbolic_path(person1_id UUID, person2_id UUID, max_hops INTEGER DEFAULT 3)
RETURNS TABLE(path_description TEXT, hops INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM cypher('omnis_graph', $$
    MATCH path = shortestPath(
      (p1:Person {id: $person1_id})-[*1..$max_hops]-(p2:Person {id: $person2_id})
    )
    RETURN [rel in relationships(path) | type(rel)] AS path_description, length(path) AS hops
  $$, person1_id, person2_id, max_hops) AS (path_description TEXT, hops INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Get group interaction graph
CREATE OR REPLACE FUNCTION get_group_graph(group_id UUID)
RETURNS TABLE(source_id UUID, target_id UUID, relationship TEXT, score INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM cypher('omnis_graph', $$
    MATCH (g:Group {id: $group_id})<-[:BELONGS_TO]-(p1:Person)
    MATCH (g)<-[:BELONGS_TO]-(p2:Person)
    WHERE id(p1) < id(p2)
    MATCH (p1)-[r]-(p2)
    WHERE type(r) IN ['ANALOG_OF', 'ANTIPODE_OF', 'OCCULT_OF', 'GUIDES']
    RETURN p1.id, p2.id, type(r),
           CASE type(r)
             WHEN 'ANALOG_OF' THEN 95
             WHEN 'OCCULT_OF' THEN 90
             WHEN 'GUIDES' THEN 85
             WHEN 'ANTIPODE_OF' THEN 70
           END
  $$, group_id) AS (source_id UUID, target_id UUID, relationship TEXT, score INTEGER);
END;
$$ LANGUAGE plpgsql;
```

---

## Vector Store (pgvector)

### Embedding Tables

```sql
-- Person embeddings for semantic similarity
CREATE TABLE person_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,

  -- Different embedding types
  embedding_type TEXT NOT NULL,  -- 'profile', 'interpretation', 'notes'

  -- The embedding vector (OpenAI ada-002 = 1536 dimensions)
  embedding vector(1536) NOT NULL,

  -- Source text that was embedded
  source_text TEXT,

  -- Metadata
  model TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(person_id, embedding_type)
);

-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX idx_person_embeddings_vector ON person_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RAG document chunks
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source document
  source_type TEXT NOT NULL,     -- 'book', 'article', 'user_notes', 'interpretation'
  source_id TEXT,                -- External reference
  source_title TEXT,

  -- The chunk
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,

  -- Embedding
  embedding vector(1536) NOT NULL,

  -- Metadata for filtering
  metadata JSONB DEFAULT '{}',
  system TEXT,                   -- Which symbolic system this relates to

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_chunks_vector ON rag_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_rag_chunks_system ON rag_chunks(system);
CREATE INDEX idx_rag_chunks_source ON rag_chunks(source_type, source_id);

-- Interpretation cache with embeddings
CREATE TABLE interpretations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was interpreted
  target_type TEXT NOT NULL,     -- 'person', 'relationship', 'group'
  target_id UUID NOT NULL,
  system TEXT NOT NULL,
  component TEXT NOT NULL,       -- 'oracle', 'sun_sign', etc.

  -- The interpretation
  content_he TEXT NOT NULL,
  content_en TEXT,

  -- Embedding for semantic search
  embedding vector(1536),

  -- Cache control
  input_hash TEXT NOT NULL,      -- Hash of input data
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  UNIQUE(target_type, target_id, system, component, input_hash)
);

CREATE INDEX idx_interpretations_lookup ON interpretations(target_type, target_id, system);
CREATE INDEX idx_interpretations_vector ON interpretations
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

### Vector Search Functions

```sql
-- Find similar people by semantic profile
CREATE OR REPLACE FUNCTION find_similar_people(
  query_embedding vector(1536),
  owner_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(person_id UUID, name TEXT, similarity FLOAT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM person_embeddings pe
  JOIN people p ON pe.person_id = p.id
  WHERE p.owner_id = owner_id
    AND p.deleted_at IS NULL
    AND pe.embedding_type = 'profile'
  ORDER BY pe.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- RAG search for relevant knowledge
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  system_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  chunk_id UUID,
  content TEXT,
  source_title TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.content,
    rc.source_title,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM rag_chunks rc
  WHERE (system_filter IS NULL OR rc.system = system_filter)
  ORDER BY rc.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Knowledge Graph Schema

### Ontology Structure

```sql
-- Concepts in the knowledge graph
CREATE TABLE kg_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  uri TEXT NOT NULL UNIQUE,      -- 'omnis:dreamspell:seal:dragon'
  name TEXT NOT NULL,
  hebrew_name TEXT,

  -- Classification
  type TEXT NOT NULL,            -- 'seal', 'tone', 'color', 'concept', 'quality'
  system TEXT,                   -- Which system this belongs to

  -- Description
  description TEXT,
  description_he TEXT,

  -- Embedding for semantic reasoning
  embedding vector(1536),

  -- Properties
  properties JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kg_concepts_uri ON kg_concepts(uri);
CREATE INDEX idx_kg_concepts_type ON kg_concepts(type);
CREATE INDEX idx_kg_concepts_system ON kg_concepts(system);

-- Relationships between concepts
CREATE TABLE kg_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The triple
  subject_id UUID NOT NULL REFERENCES kg_concepts(id) ON DELETE CASCADE,
  predicate TEXT NOT NULL,       -- 'is_analog_of', 'has_quality', 'belongs_to', etc.
  object_id UUID NOT NULL REFERENCES kg_concepts(id) ON DELETE CASCADE,

  -- Metadata
  weight FLOAT DEFAULT 1.0,
  bidirectional BOOLEAN DEFAULT FALSE,
  properties JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(subject_id, predicate, object_id)
);

CREATE INDEX idx_kg_relations_subject ON kg_relations(subject_id);
CREATE INDEX idx_kg_relations_object ON kg_relations(object_id);
CREATE INDEX idx_kg_relations_predicate ON kg_relations(predicate);

-- Inference rules for the knowledge graph
CREATE TABLE kg_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  description TEXT,

  -- Rule definition (simplified datalog-style)
  -- Example: "if X is_analog_of Y then Y is_analog_of X"
  if_pattern JSONB NOT NULL,
  then_pattern JSONB NOT NULL,

  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 100,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Knowledge Graph Population

```sql
-- Populate seals
INSERT INTO kg_concepts (uri, name, hebrew_name, type, system, properties) VALUES
  ('omnis:dreamspell:seal:1', 'Dragon', 'דרקון', 'seal', 'dreamspell',
   '{"color": "red", "earth_family": "polar", "action": "nurtures", "essence": "being", "power": "birth"}'),
  ('omnis:dreamspell:seal:2', 'Wind', 'רוח', 'seal', 'dreamspell',
   '{"color": "white", "earth_family": "cardinal", "action": "communicates", "essence": "breath", "power": "spirit"}'),
  -- ... all 20 seals
  ;

-- Populate seal relationships
INSERT INTO kg_relations (subject_id, predicate, object_id, bidirectional)
SELECT
  s1.id,
  'is_analog_of',
  s2.id,
  TRUE
FROM kg_concepts s1, kg_concepts s2
WHERE s1.type = 'seal' AND s2.type = 'seal'
  AND (
    (s1.uri = 'omnis:dreamspell:seal:1' AND s2.uri = 'omnis:dreamspell:seal:17') OR
    (s1.uri = 'omnis:dreamspell:seal:2' AND s2.uri = 'omnis:dreamspell:seal:14') OR
    -- ... all analog pairs
  );

-- Populate tones
INSERT INTO kg_concepts (uri, name, hebrew_name, type, system, properties) VALUES
  ('omnis:dreamspell:tone:1', 'Magnetic', 'מגנטי', 'tone', 'dreamspell',
   '{"action": "unify", "power": "attraction", "essence": "purpose"}'),
  ('omnis:dreamspell:tone:2', 'Lunar', 'ירחי', 'tone', 'dreamspell',
   '{"action": "polarize", "power": "challenge", "essence": "stabilize"}'),
  -- ... all 13 tones
  ;

-- Populate color concepts
INSERT INTO kg_concepts (uri, name, hebrew_name, type, system, properties) VALUES
  ('omnis:dreamspell:color:red', 'Red', 'אדום', 'color', 'dreamspell',
   '{"energy": "initiating", "direction": "east", "element": "fire"}'),
  ('omnis:dreamspell:color:white', 'White', 'לבן', 'color', 'dreamspell',
   '{"energy": "refining", "direction": "north", "element": "air"}'),
  ('omnis:dreamspell:color:blue', 'Blue', 'כחול', 'color', 'dreamspell',
   '{"energy": "transforming", "direction": "west", "element": "water"}'),
  ('omnis:dreamspell:color:yellow', 'Yellow', 'צהוב', 'color', 'dreamspell',
   '{"energy": "ripening", "direction": "south", "element": "earth"}');

-- Link seals to colors
INSERT INTO kg_relations (subject_id, predicate, object_id)
SELECT s.id, 'has_color', c.id
FROM kg_concepts s, kg_concepts c
WHERE s.type = 'seal'
  AND c.type = 'color'
  AND c.uri = 'omnis:dreamspell:color:' || (s.properties->>'color');
```

### Knowledge Graph Queries

```sql
-- Get all qualities of a seal
CREATE OR REPLACE FUNCTION get_seal_qualities(seal_number INTEGER)
RETURNS TABLE(quality TEXT, value TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.predicate,
    o.name
  FROM kg_concepts s
  JOIN kg_relations r ON s.id = r.subject_id
  JOIN kg_concepts o ON r.object_id = o.id
  WHERE s.uri = 'omnis:dreamspell:seal:' || seal_number;
END;
$$ LANGUAGE plpgsql;

-- Find all concepts related to a person's kin
CREATE OR REPLACE FUNCTION get_kin_concepts(kin_number INTEGER)
RETURNS TABLE(concept_uri TEXT, concept_name TEXT, relationship TEXT) AS $$
DECLARE
  seal_num INTEGER;
  tone_num INTEGER;
BEGIN
  -- Calculate seal and tone from kin
  seal_num := ((kin_number - 1) % 20) + 1;
  tone_num := ((kin_number - 1) % 13) + 1;

  RETURN QUERY
  -- Direct seal concepts
  SELECT c.uri, c.name, 'has_seal'::TEXT
  FROM kg_concepts c
  WHERE c.uri = 'omnis:dreamspell:seal:' || seal_num

  UNION ALL

  -- Seal's related concepts
  SELECT o.uri, o.name, r.predicate
  FROM kg_concepts s
  JOIN kg_relations r ON s.id = r.subject_id
  JOIN kg_concepts o ON r.object_id = o.id
  WHERE s.uri = 'omnis:dreamspell:seal:' || seal_num

  UNION ALL

  -- Tone concepts
  SELECT c.uri, c.name, 'has_tone'::TEXT
  FROM kg_concepts c
  WHERE c.uri = 'omnis:dreamspell:tone:' || tone_num;
END;
$$ LANGUAGE plpgsql;

-- Semantic reasoning: find all implied relationships
CREATE OR REPLACE FUNCTION infer_relationships(person_id UUID)
RETURNS TABLE(relationship TEXT, target_concept TEXT, confidence FLOAT) AS $$
BEGIN
  -- Use kg_rules to infer additional relationships
  -- This is a simplified version; full implementation would use a proper reasoner
  RETURN QUERY
  WITH person_concepts AS (
    SELECT c.id, c.uri, c.name
    FROM people p
    JOIN kg_concepts c ON c.uri = 'omnis:dreamspell:seal:' || p.ds_seal
    WHERE p.id = person_id
  )
  SELECT
    r.predicate,
    o.name,
    r.weight
  FROM person_concepts pc
  JOIN kg_relations r ON pc.id = r.subject_id
  JOIN kg_concepts o ON r.object_id = o.id
  ORDER BY r.weight DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## Optimized Query Patterns

### Fast Group Analysis

```sql
-- Get group interaction matrix in single query
CREATE OR REPLACE FUNCTION get_group_interaction_matrix(group_id UUID)
RETURNS TABLE(
  person1_id UUID,
  person1_name TEXT,
  person2_id UUID,
  person2_name TEXT,
  overall_score INTEGER,
  is_analog BOOLEAN,
  is_occult BOOLEAN,
  is_antipode BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH group_members AS (
    SELECT p.id, p.name
    FROM groups g
    CROSS JOIN LATERAL unnest(g.member_ids) AS member_id
    JOIN people p ON p.id = member_id
    WHERE g.id = group_id
  )
  SELECT
    gm1.id AS person1_id,
    gm1.name AS person1_name,
    gm2.id AS person2_id,
    gm2.name AS person2_name,
    i.overall_score,
    i.is_analog,
    i.is_occult,
    i.is_antipode
  FROM group_members gm1
  CROSS JOIN group_members gm2
  LEFT JOIN interactions i ON (
    (i.person1_id = LEAST(gm1.id, gm2.id) AND i.person2_id = GREATEST(gm1.id, gm2.id))
  )
  WHERE gm1.id < gm2.id
  ORDER BY i.overall_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Get group summary stats
CREATE OR REPLACE FUNCTION get_group_summary(group_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH group_members AS (
    SELECT p.*
    FROM groups g
    CROSS JOIN LATERAL unnest(g.member_ids) AS member_id
    JOIN people p ON p.id = member_id
    WHERE g.id = group_id
  ),
  color_counts AS (
    SELECT ds_color, COUNT(*) as cnt
    FROM group_members
    GROUP BY ds_color
  ),
  tone_counts AS (
    SELECT ds_tone, COUNT(*) as cnt
    FROM group_members
    GROUP BY ds_tone
  ),
  family_counts AS (
    SELECT ds_earth_family, COUNT(*) as cnt
    FROM group_members
    GROUP BY ds_earth_family
  ),
  interaction_stats AS (
    SELECT
      AVG(i.overall_score) AS avg_score,
      COUNT(*) FILTER (WHERE i.is_analog) AS analog_count,
      COUNT(*) FILTER (WHERE i.is_occult) AS occult_count,
      COUNT(*) FILTER (WHERE i.is_antipode) AS antipode_count
    FROM group_members gm1
    CROSS JOIN group_members gm2
    LEFT JOIN interactions i ON (
      i.person1_id = LEAST(gm1.id, gm2.id) AND
      i.person2_id = GREATEST(gm1.id, gm2.id)
    )
    WHERE gm1.id < gm2.id
  )
  SELECT jsonb_build_object(
    'member_count', (SELECT COUNT(*) FROM group_members),
    'color_distribution', (SELECT jsonb_object_agg(ds_color, cnt) FROM color_counts),
    'tone_distribution', (SELECT jsonb_object_agg(ds_tone::text, cnt) FROM tone_counts),
    'family_distribution', (SELECT jsonb_object_agg(ds_earth_family, cnt) FROM family_counts),
    'avg_harmony_score', (SELECT avg_score FROM interaction_stats),
    'analog_connections', (SELECT analog_count FROM interaction_stats),
    'occult_connections', (SELECT occult_count FROM interaction_stats),
    'antipode_connections', (SELECT antipode_count FROM interaction_stats)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Find Optimal Person to Add to Group

```sql
-- Find best person to add to balance a group
CREATE OR REPLACE FUNCTION suggest_group_additions(
  group_id UUID,
  owner_id UUID,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  person_id UUID,
  person_name TEXT,
  reason TEXT,
  impact_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH group_summary AS (
    SELECT * FROM get_group_summary(group_id)
  ),
  missing_colors AS (
    SELECT unnest(ARRAY['red', 'white', 'blue', 'yellow']) AS color
    EXCEPT
    SELECT jsonb_object_keys(gs.color_distribution) FROM group_summary gs
  ),
  candidate_people AS (
    SELECT p.id, p.name, p.ds_color, p.ds_seal, p.ds_tone
    FROM people p
    WHERE p.owner_id = owner_id
      AND p.deleted_at IS NULL
      AND NOT (p.id = ANY(
        SELECT unnest(member_ids) FROM groups WHERE id = group_id
      ))
  ),
  scored_candidates AS (
    SELECT
      cp.id,
      cp.name,
      CASE
        WHEN cp.ds_color IN (SELECT color FROM missing_colors) THEN
          'מוסיף אנרגיה ' || cp.ds_color || ' חסרה'
        ELSE
          'מעלה הרמוניה כללית'
      END AS reason,
      CASE
        WHEN cp.ds_color IN (SELECT color FROM missing_colors) THEN 50
        ELSE 0
      END +
      (
        -- Average compatibility with existing members
        SELECT COALESCE(AVG(i.overall_score), 50)::INTEGER
        FROM groups g
        CROSS JOIN LATERAL unnest(g.member_ids) AS member_id
        LEFT JOIN interactions i ON (
          i.person1_id = LEAST(cp.id, member_id) AND
          i.person2_id = GREATEST(cp.id, member_id)
        )
        WHERE g.id = group_id
      ) AS impact_score
    FROM candidate_people cp
  )
  SELECT sc.id, sc.name, sc.reason, sc.impact_score
  FROM scored_candidates sc
  ORDER BY sc.impact_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Caching Strategy

### Multi-Level Cache

```sql
-- Cache configuration
CREATE TABLE cache_config (
  cache_key TEXT PRIMARY KEY,
  ttl_seconds INTEGER NOT NULL,
  max_size INTEGER,
  enabled BOOLEAN DEFAULT TRUE
);

INSERT INTO cache_config VALUES
  ('interactions', 86400, NULL, TRUE),        -- 24 hours
  ('group_analysis', 3600, NULL, TRUE),       -- 1 hour
  ('interpretations', 604800, 10000, TRUE),   -- 7 days, max 10k
  ('embeddings', NULL, NULL, TRUE);           -- No expiry

-- Materialized view for hot data
CREATE MATERIALIZED VIEW mv_user_interaction_summary AS
SELECT
  p.owner_id,
  COUNT(DISTINCT p.id) AS people_count,
  COUNT(DISTINCT i.id) AS interaction_count,
  AVG(i.overall_score)::INTEGER AS avg_harmony,
  jsonb_object_agg(
    p.ds_color,
    COUNT(*) FILTER (WHERE p.ds_color IS NOT NULL)
  ) AS color_distribution
FROM people p
LEFT JOIN interactions i ON p.id IN (i.person1_id, i.person2_id)
WHERE p.deleted_at IS NULL
GROUP BY p.owner_id;

CREATE UNIQUE INDEX ON mv_user_interaction_summary(owner_id);

-- Refresh periodically
CREATE OR REPLACE FUNCTION refresh_interaction_summary()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_interaction_summary;
END;
$$ LANGUAGE plpgsql;
```

---

## API Functions Summary

```sql
-- User operations
get_user_dashboard(user_id) -> JSONB
get_user_people(user_id, filters) -> SETOF people
get_user_groups(user_id) -> SETOF groups

-- Person operations
create_person(owner_id, data) -> people
update_person(person_id, data) -> people
delete_person(person_id) -> VOID
get_person_full(person_id) -> JSONB (with all systems)

-- Interaction operations
get_interaction(person1_id, person2_id) -> interactions
get_all_interactions_for_person(person_id) -> SETOF interactions
compute_interactions_batch(person_ids[]) -> VOID

-- Group operations
create_group(owner_id, name, member_ids[]) -> groups
get_group_summary(group_id) -> JSONB
get_group_interaction_matrix(group_id) -> TABLE
suggest_group_additions(group_id, owner_id) -> TABLE
optimize_group(group_id, goal) -> JSONB

-- Graph operations
find_symbolic_path(person1_id, person2_id) -> TABLE
get_kin_concepts(kin_number) -> TABLE
find_similar_people(embedding, owner_id) -> TABLE

-- Knowledge graph
get_seal_qualities(seal_number) -> TABLE
infer_relationships(person_id) -> TABLE
search_knowledge(query_embedding, system) -> TABLE
```

---

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│     API     │────►│   Database  │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                          │                    │
                          │                    ▼
                          │            ┌──────────────┐
                          │            │   Triggers   │
                          │            │  • Compute   │
                          │            │    kin data  │
                          │            │  • Sync to   │
                          │            │    graph     │
                          │            │  • Queue     │
                          │            │    interactions
                          │            └──────┬───────┘
                          │                   │
                          │                   ▼
                          │            ┌──────────────┐
                          │            │  Background  │
                          │            │   Workers    │
                          │            │  • Compute   │
                          │            │    interactions
                          │            │  • Generate  │
                          │            │    embeddings│
                          │            │  • Refresh   │
                          │            │    views     │
                          │            └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │    Cache     │
                   │  • Redis     │
                   │  • In-memory │
                   └──────────────┘
```

This architecture enables:
- **O(1) interaction lookups** via pre-computed table
- **Graph traversal** for symbolic paths
- **Vector similarity** for semantic search
- **Knowledge reasoning** via ontology
- **Scalable groups** with materialized summaries

# Omnis Specifications

Complete specification documentation for the Omnis symbolic mapping platform.

---

## Quick Links

### MVP (Phase 0)
- [MVP Scope](./MVP_SCOPE.md) - Requirements and locked decisions
- [Card Layout](./CARD_LAYOUT.md) - A5 card visual structure
- [Test Data](./TEST_DATA.json) - 16 test people

### Feature Roadmap
- [Feature Roadmap](./FEATURE_ROADMAP.md) - 8-phase product evolution

---

## Systems

Calculation rules and data structures for each symbolic system.

| System | Description | Birth Time Required |
|--------|-------------|---------------------|
| [Dreamspell](./systems/DREAMSPELL.md) | Modern Mayan-inspired calendar | No |
| [Tzolkin](./systems/TZOLKIN.md) | Traditional 260-day calendar | No |
| [Long Count](./systems/LONG_COUNT.md) | Mayan date notation | No |
| [Human Design](./systems/HUMAN_DESIGN.md) | Bodygraph synthesis system | Yes |
| [Astrology](./systems/ASTROLOGY.md) | Western tropical astrology | Yes |
| [Gematria](./systems/GEMATRIA.md) | Hebrew numerology | No |
| [**Interaction Physics**](./systems/INTERACTION_PHYSICS.md) | Force-based compatibility engine | No |

---

## Components

Feature specifications for major UI/UX components.

| Component | Description |
|-----------|-------------|
| [Authentication](./components/AUTHENTICATION.md) | OAuth, sessions, onboarding |
| [People Directory](./components/PEOPLE_DIRECTORY.md) | CRUD, search, tags |
| [Relationships](./components/RELATIONSHIPS.md) | Graph, groups, sharing |
| [Canvas Editor](./components/CANVAS_EDITOR.md) | Boards, nodes, export |
| [Predictions](./components/PREDICTIONS.md) | Cycles, transits, timeline |
| [AI Layer](./components/AI_LAYER.md) | Interpretations, chat, RAG |

---

## Architecture

Technical architecture specifications.

| Document | Description |
|----------|-------------|
| [Data Models](./architecture/DATA_MODELS.md) | TypeScript types, branded IDs |
| [API](./architecture/API.md) | REST endpoints, auth, errors |
| [Database](./architecture/DATABASE.md) | PostgreSQL schema, RLS |
| [**Graph Database**](./architecture/GRAPH_DATABASE.md) | Graph queries, vectors, knowledge graph |
| [Billing](./architecture/BILLING.md) | Stripe integration, plans |

---

## Spec Organization

```
specs/
├── README.md                    # This file
├── MVP_SCOPE.md                 # Phase 0 requirements
├── CARD_LAYOUT.md               # A5 card design
├── FEATURE_ROADMAP.md           # 8-phase roadmap
├── TEST_DATA.json               # Test people
│
├── systems/                     # Calculation specs
│   ├── DREAMSPELL.md
│   ├── TZOLKIN.md
│   ├── LONG_COUNT.md
│   ├── HUMAN_DESIGN.md
│   ├── ASTROLOGY.md
│   ├── GEMATRIA.md
│   └── INTERACTION_PHYSICS.md   # Force-based group dynamics
│
├── components/                  # Feature specs
│   ├── AUTHENTICATION.md
│   ├── PEOPLE_DIRECTORY.md
│   ├── RELATIONSHIPS.md
│   ├── CANVAS_EDITOR.md
│   ├── PREDICTIONS.md
│   └── AI_LAYER.md
│
└── architecture/                # Technical specs
    ├── DATA_MODELS.md
    ├── API.md
    ├── DATABASE.md
    └── BILLING.md
```

---

## Technology Stack

### MVP (Phase 0)
- **Frontend**: Vanilla TypeScript + Web Components
- **Build**: Vite
- **Styling**: CSS Custom Properties
- **Icons**: SVG (Law of Time)
- **No runtime dependencies**

### Full Product
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (OAuth)
- **Payments**: Stripe
- **AI**: Claude API
- **Hosting**: Vercel

---

## Key Design Decisions

### Locked for MVP
1. A5 card format (148mm × 210mm)
2. RTL direction (Hebrew primary)
3. Dreamspell + Tzolkin shown separately
4. Oracle cross pattern layout
5. Bilingual mantras (Hebrew + English)
6. Law of Time official icons

### Technical Principles
1. Zero runtime dependencies (MVP)
2. Deterministic calculations
3. Composable Web Components
4. Pure functions, immutable data
5. Type-safe with branded types
6. CSS Custom Properties for theming

---

## Next Steps

1. **Phase 0**: Build MVP card renderer
2. **Phase 1**: Add auth + persistence
3. **Phase 2**: Relationship graph
4. **Phase 3+**: Multi-system expansion

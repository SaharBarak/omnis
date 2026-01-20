# AI Layer Component Specification

## Overview

The AI Layer provides intelligent interpretations and insights grounded in computed symbolic data. AI augments but never replaces the deterministic calculations. All AI outputs are clearly labeled and include appropriate disclaimers.

---

## Core Principles

### AI is Augmentation, Not Source
```typescript
const aiPrinciples = {
  grounded: 'AI responses are always grounded in computed data',
  labeled: 'AI-generated content is clearly marked as such',
  optional: 'Users can disable AI features entirely',
  cached: 'Interpretations are cached to control costs',
  transparent: 'Show what data the AI is working with',
  humble: 'Acknowledge uncertainty and limitations',
};
```

### Trust Hierarchy
```
1. Computed Data (source of truth)
   ↓
2. Static Interpretations (curated, verified)
   ↓
3. AI-Generated Interpretations (augmentation)
```

---

## AI Features

### Personal Interpretations
```typescript
interface PersonalInterpretation {
  id: InterpretationId;
  personId: PersonId;
  system: SystemType;
  component: string;             // e.g., 'oracle', 'sun-sign', 'profile'
  context: InterpretationContext;
  content: string;
  hebrewContent: string;
  generatedAt: ISODateTime;
  modelVersion: string;
  cached: boolean;
}

interface InterpretationContext {
  // The computed data being interpreted
  systemData: Record<string, unknown>;
  // Optional additional context
  personName?: string;
  relationships?: RelationshipContext[];
  currentTransits?: Transit[];
}
```

### Relationship Interpretations
```typescript
interface RelationshipInterpretation {
  id: InterpretationId;
  person1Id: PersonId;
  person2Id: PersonId;
  system: SystemType;
  compatibility: CompatibilityData;
  interpretation: string;
  hebrewInterpretation: string;
  strengths: string[];
  challenges: string[];
  advice: string[];
}
```

### Group Interpretations
```typescript
interface GroupInterpretation {
  id: InterpretationId;
  groupId: GroupId;
  system: SystemType;
  groupDynamics: string;
  patterns: string[];
  recommendations: string[];
}
```

---

## "Ask Omnis" Chat

### Chat Interface
```typescript
interface ChatMessage {
  id: MessageId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: ISODateTime;
  citations?: Citation[];
  usedData?: DataReference[];
}

interface Citation {
  source: string;
  quote: string;
  url?: string;
}

interface DataReference {
  type: 'person' | 'relationship' | 'prediction';
  id: string;
  summary: string;
}
```

### Chat Context
```typescript
interface ChatContext {
  sessionId: SessionId;
  userId: UserId;

  // Available data for grounding
  people: Person[];
  relationships: Relationship[];
  computedResults: ComputedResult[];
  currentDate: Date;

  // Conversation history
  messages: ChatMessage[];

  // RAG context
  ragEnabled: boolean;
  ragSources: RAGSource[];
}
```

### Chat UI
```
┌─────────────────────────────────────────────────────────────────┐
│  שאל את אומניס                                         [✕]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🤖 שלום! אני כאן לעזור לך להבין את המידע הסמלי שלך.      │  │
│  │    מה תרצה לדעת?                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 👤 מה המשמעות של הקשר בין ליאור למיכל בדרימספל?          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🤖 לפי הדרימספל, ליאור (Kin 123, לילה קצבי כחול)        │  │
│  │    ומיכל (Kin 45, נחש ספקטרלי אדום) חולקים קשר          │  │
│  │    מעניין:                                               │  │
│  │                                                           │  │
│  │    📊 מבוסס על הנתונים שלכם:                             │  │
│  │    • החותם של מיכל (נחש) הוא האנלוג של ליאור            │  │
│  │    • זהו קשר תומך של אנרגיות משלימות                     │  │
│  │                                                           │  │
│  │    המשמעות:                                               │  │
│  │    קשר אנלוגי מסמל תמיכה הדדית טבעית. שני האנשים        │  │
│  │    חולקים "משפחת צבע" ומחזקים אחד את השני...            │  │
│  │                                                           │  │
│  │    ──────────────────────────────────────────────────    │  │
│  │    📚 מקורות: Dreamspell Oracle (Argüelles)              │  │
│  │    ⚠️ פרשנות AI - השתמש לצורך השראה                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐ [שלח ➤]   │
│  │ הקלד שאלה...                                    │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  💡 שאלות לדוגמה:                                              │
│  • מה הנושאים העיקריים השנה עבורי?                            │
│  • איך האנרגיה של היום משפיעה עליי?                           │
│  • מה המשותף בין כל בני המשפחה שלי?                           │
└─────────────────────────────────────────────────────────────────┘
```

### Suggested Questions
```typescript
const suggestedQuestions = [
  { category: 'personal', questions: [
    'מה המשמעות של ה-Kin שלי?',
    'מה הנושאים העיקריים של השנה הקרובה?',
    'איך האנרגיה של היום משפיעה עליי?',
  ]},
  { category: 'relationships', questions: [
    'מה הדינמיקה בין [שם1] ל[שם2]?',
    'מי הכי תומך אותי מבחינה אנרגטית?',
    'מה האתגרים בקשר עם [שם]?',
  ]},
  { category: 'group', questions: [
    'מה הדפוסים המשותפים במשפחה שלי?',
    'מי חסר לאיזון הקבוצה?',
  ]},
];
```

---

## RAG (Retrieval-Augmented Generation)

### RAG Sources
```typescript
interface RAGSource {
  id: SourceId;
  name: string;
  type: SourceType;
  content: string;
  embedding: number[];           // Vector embedding
  metadata: SourceMetadata;
}

type SourceType =
  | 'book'           // Published books
  | 'article'        // Articles, papers
  | 'official'       // Official Dreamspell/Law of Time materials
  | 'user-notes';    // User's own notes

interface SourceMetadata {
  author?: string;
  title?: string;
  url?: string;
  dateAdded: ISODateTime;
  verified: boolean;             // Curated by Omnis team
}
```

### Vector Database
```typescript
interface VectorStore {
  // Store document chunks with embeddings
  upsert(docs: RAGDocument[]): Promise<void>;

  // Semantic search
  search(query: string, limit: number): Promise<RAGDocument[]>;

  // Delete by source
  deleteBySource(sourceId: SourceId): Promise<void>;
}

interface RAGDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    sourceId: SourceId;
    chunkIndex: number;
    totalChunks: number;
  };
}
```

### RAG Pipeline
```typescript
async function generateWithRAG(
  query: string,
  context: ChatContext
): Promise<ChatMessage> {
  // 1. Embed the query
  const queryEmbedding = await embedText(query);

  // 2. Search for relevant documents
  const relevantDocs = await vectorStore.search(queryEmbedding, 5);

  // 3. Build augmented prompt
  const augmentedPrompt = buildRAGPrompt(query, relevantDocs, context);

  // 4. Generate response
  const response = await generateResponse(augmentedPrompt);

  // 5. Add citations
  const citations = extractCitations(response, relevantDocs);

  return {
    role: 'assistant',
    content: response,
    citations,
    usedData: context.computedResults.map(summarizeData),
  };
}
```

---

## Cost Control

### Token Budgets
```typescript
interface TokenBudget {
  userId: UserId;
  plan: 'free' | 'paid';
  monthlyLimit: number;
  used: number;
  resetDate: ISODateTime;
}

const tokenLimits = {
  free: 10000,      // ~10 conversations
  paid: 100000,     // ~100 conversations
};
```

### Caching Strategy
```typescript
interface InterpretationCache {
  key: string;                   // Hash of input data
  interpretation: string;
  createdAt: ISODateTime;
  expiresAt: ISODateTime;
  hitCount: number;
}

// Cache interpretations for 30 days
// Same computed data = same interpretation
function getCacheKey(
  personId: PersonId,
  system: SystemType,
  component: string,
  dataHash: string
): string {
  return `${personId}:${system}:${component}:${dataHash}`;
}

async function getOrGenerateInterpretation(
  context: InterpretationContext
): Promise<PersonalInterpretation> {
  const cacheKey = getCacheKey(/*...*/);
  const cached = await cache.get(cacheKey);

  if (cached) {
    await cache.incrementHitCount(cacheKey);
    return { ...cached, cached: true };
  }

  const interpretation = await generateInterpretation(context);
  await cache.set(cacheKey, interpretation, TTL_30_DAYS);

  return { ...interpretation, cached: false };
}
```

### User-Triggered Generation
```typescript
// AI generation only happens when user explicitly requests it
interface GenerationTrigger {
  type: 'button-click' | 'chat-submit' | 'auto-disabled';
  requireConfirmation: boolean;
  showCostEstimate: boolean;
}

// Default: No auto-generation
const defaultSettings: AISettings = {
  autoGenerate: false,
  showSuggestions: true,
  enableChat: true,
};
```

---

## Prompt Engineering

### System Prompt Template
```typescript
const systemPrompt = `
You are Omnis, an assistant that helps users understand symbolic systems
(Dreamspell, Tzolkin, Astrology, Human Design, Gematria).

CRITICAL RULES:
1. ONLY interpret data that is provided to you. Never invent or assume data.
2. Always acknowledge the symbolic nature of these systems.
3. Be supportive but not predictive about life outcomes.
4. Respond in Hebrew unless the user writes in another language.
5. Include disclaimers about the interpretive nature of your responses.
6. Cite sources when available.
7. If you don't know something, say so clearly.

FORBIDDEN:
- Making medical, legal, or financial predictions
- Claiming certainty about future events
- Generating data not provided in the context
- Encouraging dependency on predictions

STYLE:
- Warm, supportive, but grounded
- Use symbolic language appropriately
- Connect interpretations to practical self-reflection
`;
```

### Interpretation Prompt
```typescript
function buildInterpretationPrompt(
  context: InterpretationContext
): string {
  return `
Based on the following computed data, provide an interpretation:

PERSON: ${context.personName}
SYSTEM: ${context.system}
DATA:
${JSON.stringify(context.systemData, null, 2)}

Provide:
1. A brief explanation of what this data represents
2. Key themes and qualities
3. Practical reflection questions

Remember to:
- Ground everything in the provided data
- Use both Hebrew and English terms
- Include a disclaimer that this is interpretive
`;
}
```

---

## Safety & Ethics

### Content Moderation
```typescript
interface SafetyCheck {
  passed: boolean;
  flags: SafetyFlag[];
  action: 'allow' | 'warn' | 'block';
}

type SafetyFlag =
  | 'medical-advice'
  | 'financial-advice'
  | 'legal-advice'
  | 'harmful-prediction'
  | 'manipulation'
  | 'dependency-encouraging';

async function checkSafety(
  userMessage: string,
  aiResponse: string
): Promise<SafetyCheck> {
  // Check for unsafe content patterns
  // Use classifier or keyword matching
}
```

### Disclaimers
```typescript
const disclaimers = {
  general: `
⚠️ פרשנות AI
תוכן זה נוצר על ידי AI ומבוסס על מערכות סמליות.
השתמש/י בו להשראה ומודעות עצמית, לא להחלטות חיים משמעותיות.
`,
  medical: `
🏥 אין להשתמש במידע זה לצורכי אבחון או טיפול רפואי.
פנה/י לאיש מקצוע מוסמך בכל שאלה בריאותית.
`,
  relationship: `
💑 פרשנות קשרים היא סימבולית ואינה מחליפה תקשורת אמיתית.
כל מערכת יחסים מורכבת ואישית.
`,
};
```

### Sensitive Topics Handler
```typescript
const sensitiveTopics = [
  { pattern: /מוות|נפטר|אבדן/i, response: 'grief-support' },
  { pattern: /דיכאון|חרדה|התאבדות/i, response: 'mental-health-referral' },
  { pattern: /גירושין|פרידה/i, response: 'relationship-sensitivity' },
  { pattern: /מחלה|סרטן|ניתוח/i, response: 'health-disclaimer' },
];

function handleSensitiveTopic(topic: string): string {
  return `
אני מבין/ה שזו תקופה מאתגרת. המערכות הסמליות יכולות לספק
נקודת מבט, אבל חשוב לזכור:

• לבקש תמיכה מאנשים קרובים או אנשי מקצוע
• אין במידע כאן תחליף לייעוץ מקצועי
• אתה לא לבד

[קישור לקווי סיוע רלוונטיים]
`;
}
```

---

## API Endpoints

```
# Interpretations
POST /api/ai/interpret                # Generate interpretation
GET  /api/ai/interpret/:id            # Get cached interpretation

# Chat
POST /api/ai/chat                     # Send chat message
GET  /api/ai/chat/:sessionId          # Get chat history
DELETE /api/ai/chat/:sessionId        # Clear chat history

# RAG
POST /api/ai/rag/sources              # Add RAG source (admin)
DELETE /api/ai/rag/sources/:id        # Remove RAG source

# Usage
GET  /api/ai/usage                    # Get token usage
```

---

## Monitoring & Analytics

### Metrics
```typescript
interface AIMetrics {
  // Usage
  totalTokensUsed: number;
  averageTokensPerRequest: number;
  cacheHitRate: number;

  // Quality
  userRatings: { positive: number; negative: number };
  regenerationRate: number;        // How often users ask to regenerate

  // Safety
  blockedRequests: number;
  flaggedResponses: number;

  // Cost
  totalCost: number;
  costPerUser: number;
}
```

### Feedback Loop
```typescript
interface InterpretationFeedback {
  interpretationId: InterpretationId;
  userId: UserId;
  rating: 'helpful' | 'not-helpful';
  comment?: string;
  timestamp: ISODateTime;
}

// Use feedback to improve prompts and caching decisions
```

---

## Model Selection

### Model Configuration
```typescript
interface ModelConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  temperature: number;
  maxTokens: number;
  costPer1kTokens: number;
}

const models = {
  interpretation: {
    provider: 'anthropic',
    model: 'claude-3-haiku',
    temperature: 0.7,
    maxTokens: 1000,
    costPer1kTokens: 0.00025,
  },
  chat: {
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    temperature: 0.8,
    maxTokens: 2000,
    costPer1kTokens: 0.003,
  },
};
```

### Fallback Strategy
```typescript
async function generateWithFallback(
  prompt: string,
  primaryModel: ModelConfig,
  fallbackModel: ModelConfig
): Promise<string> {
  try {
    return await generate(prompt, primaryModel);
  } catch (error) {
    if (isRateLimitError(error) || isTimeoutError(error)) {
      return await generate(prompt, fallbackModel);
    }
    throw error;
  }
}
```

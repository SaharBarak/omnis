# People Directory Component Specification

## Overview

The People Directory allows users to manage a list of people (family, friends, partners) with their birth data for symbolic system calculations.

---

## Data Model

### Person Entity
```typescript
interface Person {
  id: PersonId;                  // Branded UUID
  ownerId: UserId;               // User who created this person
  name: string;                  // Display name
  hebrewName?: string;           // For gematria
  birthDate: ISODate;            // Required (YYYY-MM-DD)
  birthTime?: ISOTime;           // Optional (HH:MM)
  birthPlace?: BirthPlace;       // Optional
  avatarUrl?: string;            // Profile image
  tags: TagId[];                 // Associated tags
  notes?: string;                // Free text notes
  isSelf: boolean;               // Is this the user themselves
  deletedAt?: ISODateTime;       // Soft delete timestamp
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface BirthPlace {
  name: string;                  // Display name (city, country)
  latitude: number;              // Decimal degrees
  longitude: number;             // Decimal degrees
  timezone: string;              // IANA timezone
}

// Branded types for type safety
type PersonId = string & { readonly brand: unique symbol };
type UserId = string & { readonly brand: unique symbol };
type TagId = string & { readonly brand: unique symbol };
type ISODate = string & { readonly brand: unique symbol };
type ISOTime = string & { readonly brand: unique symbol };
type ISODateTime = string & { readonly brand: unique symbol };
```

### Tag Entity
```typescript
interface Tag {
  id: TagId;
  ownerId?: UserId;              // null for system tags
  name: string;
  hebrewName: string;
  color: HexColor;
  isSystem: boolean;
  order: number;
}

const systemTags: Tag[] = [
  { id: 'family', name: 'Family', hebrewName: 'משפחה', color: '#EF4444', isSystem: true, order: 0 },
  { id: 'partner', name: 'Partner', hebrewName: 'בן/בת זוג', color: '#EC4899', isSystem: true, order: 1 },
  { id: 'friend', name: 'Friend', hebrewName: 'חברים', color: '#8B5CF6', isSystem: true, order: 2 },
  { id: 'colleague', name: 'Colleague', hebrewName: 'עמיתים', color: '#3B82F6', isSystem: true, order: 3 },
  { id: 'child', name: 'Child', hebrewName: 'ילדים', color: '#10B981', isSystem: true, order: 4 },
  { id: 'parent', name: 'Parent', hebrewName: 'הורים', color: '#F59E0B', isSystem: true, order: 5 },
];
```

---

## Directory Views

### List View (Default)
```
┌─────────────────────────────────────────────────────────┐
│  אנשים                              [+ הוסף] [🔍]      │
├─────────────────────────────────────────────────────────┤
│  [הכל] [משפחה] [בן זוג] [חברים] [עמיתים]              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────┐ ליאור                    23.9.1966            │
│  │ 👤  │ Kin 123 • לילה קצבי כחול  [משפחה] [הורים]    │
│  └─────┘                                      [⋮]      │
│  ─────────────────────────────────────────────────────  │
│  ┌─────┐ מיכל                     15.3.1988            │
│  │ 👤  │ Kin 45 • נחש ספקטרלי אדום  [בן זוג]          │
│  └─────┘                                      [⋮]      │
│  ─────────────────────────────────────────────────────  │
│  ┌─────┐ דני                      7.11.1992            │
│  │ 👤  │ Kin 89 • ירח קוסמי אדום    [חברים]           │
│  └─────┘                                      [⋮]      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Grid View
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   👤     │  │   👤     │  │   👤     │             │
│  │  ליאור   │  │  מיכל    │  │   דני    │             │
│  │ 23.9.66  │  │ 15.3.88  │  │ 7.11.92  │             │
│  │ [משפחה]  │  │ [בן זוג] │  │ [חברים]  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   👤     │  │   👤     │  │   ➕     │             │
│  │  שרה     │  │  יוסי    │  │  הוסף    │             │
│  │ 1.5.95   │  │ 12.8.80  │  │  אדם     │             │
│  │ [חברים]  │  │ [עמיתים] │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Person Card Component

### Mini Card (List Item)
```typescript
interface PersonCardMiniProps {
  person: Person;
  systems: SystemResult[];       // Pre-computed results
  onSelect: (id: PersonId) => void;
  onEdit: (id: PersonId) => void;
  onDelete: (id: PersonId) => void;
}
```

### Full Card (Detail View)
```
┌─────────────────────────────────────────┐
│  ┌─────────┐                            │
│  │         │   ליאור                    │
│  │   👤    │   לפי הדרימספל: Kin 123    │
│  │         │   לילה קצבי כחול           │
│  └─────────┘                            │
├─────────────────────────────────────────┤
│  📅 תאריך לידה: 23.9.1966               │
│  🕐 שעת לידה: לא צוין                   │
│  📍 מקום לידה: לא צוין                  │
│  ✡️ שם עברי: ליאור                      │
├─────────────────────────────────────────┤
│  תגיות: [משפחה] [הורים]                 │
├─────────────────────────────────────────┤
│  הערות:                                 │
│  אבא שלי, נולד בתל אביב                 │
├─────────────────────────────────────────┤
│  [צפה בכרטיס]  [ערוך]  [מחק]           │
└─────────────────────────────────────────┘
```

---

## Add/Edit Person Form

### Form Fields
```typescript
interface PersonFormData {
  name: string;                  // Required
  hebrewName?: string;           // Optional
  birthDate: string;             // Required (date picker)
  birthTime?: string;            // Optional (time picker)
  birthPlace?: {
    search: string;              // Autocomplete search
    selected?: BirthPlace;
  };
  tags: TagId[];                 // Multi-select
  notes?: string;                // Textarea
}
```

### Form Layout
```
┌─────────────────────────────────────────┐
│  הוסף אדם חדש                    [✕]   │
├─────────────────────────────────────────┤
│                                         │
│  שם *                                   │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  שם בעברית (לגימטריה)                   │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  תאריך לידה *                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  יום    │ │  חודש   │ │  שנה    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  שעת לידה (אופציונלי)                   │
│  ┌─────────┐ : ┌─────────┐             │
│  │  שעה    │   │  דקות   │             │
│  └─────────┘   └─────────┘             │
│  ⓘ נדרש לחישובי Human Design ואסטרולוגיה│
│                                         │
│  מקום לידה (אופציונלי)                  │
│  ┌───────────────────────────────────┐  │
│  │ 🔍 חפש עיר...                     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  תגיות                                  │
│  [משפחה] [בן זוג] [חברים] [+ חדש]      │
│                                         │
│  הערות                                  │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │            שמור                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Validation Rules
```typescript
const personValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  hebrewName: {
    pattern: /^[\u0590-\u05FF\s]*$/,  // Hebrew only
    maxLength: 100,
  },
  birthDate: {
    required: true,
    min: '1900-01-01',
    max: 'today',
  },
  birthTime: {
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
  },
  notes: {
    maxLength: 5000,
  },
};
```

---

## Search & Filter

### Search
```typescript
interface SearchQuery {
  query: string;                 // Search term
  fields: ('name' | 'hebrewName' | 'notes')[];
}

function searchPeople(people: Person[], query: string): Person[] {
  const normalizedQuery = query.toLowerCase().trim();

  return people.filter(person => {
    return (
      person.name.toLowerCase().includes(normalizedQuery) ||
      person.hebrewName?.toLowerCase().includes(normalizedQuery) ||
      person.notes?.toLowerCase().includes(normalizedQuery)
    );
  });
}
```

### Filters
```typescript
interface FilterState {
  tags: TagId[];                 // Filter by tags (OR)
  hasTime: boolean | null;       // Has birth time
  hasPlace: boolean | null;      // Has birth place
  dateRange?: {
    from: ISODate;
    to: ISODate;
  };
}

function filterPeople(people: Person[], filters: FilterState): Person[] {
  return people.filter(person => {
    // Tag filter (OR logic)
    if (filters.tags.length > 0) {
      if (!filters.tags.some(tag => person.tags.includes(tag))) {
        return false;
      }
    }

    // Birth time filter
    if (filters.hasTime === true && !person.birthTime) return false;
    if (filters.hasTime === false && person.birthTime) return false;

    // Birth place filter
    if (filters.hasPlace === true && !person.birthPlace) return false;
    if (filters.hasPlace === false && person.birthPlace) return false;

    // Date range filter
    if (filters.dateRange) {
      if (person.birthDate < filters.dateRange.from) return false;
      if (person.birthDate > filters.dateRange.to) return false;
    }

    return true;
  });
}
```

### Sort Options
```typescript
type SortField = 'name' | 'birthDate' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

function sortPeople(people: Person[], sort: SortState): Person[] {
  return [...people].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'he');
        break;
      case 'birthDate':
        comparison = a.birthDate.localeCompare(b.birthDate);
        break;
      case 'createdAt':
      case 'updatedAt':
        comparison = a[sort.field].localeCompare(b[sort.field]);
        break;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}
```

---

## Bulk Operations

### Multi-Select
```typescript
interface SelectionState {
  selectedIds: Set<PersonId>;
  selectAll: boolean;
}

interface BulkActions {
  addTags: (personIds: PersonId[], tagIds: TagId[]) => Promise<void>;
  removeTags: (personIds: PersonId[], tagIds: TagId[]) => Promise<void>;
  delete: (personIds: PersonId[]) => Promise<void>;
  export: (personIds: PersonId[], format: 'json' | 'csv') => Promise<Blob>;
}
```

### Export Format
```typescript
interface PersonExport {
  name: string;
  hebrewName?: string;
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  tags: string[];
  dreamspellKin?: number;
  tzolkinDay?: string;
}
```

---

## Import

### Import Sources
```typescript
type ImportSource = 'json' | 'csv' | 'contacts';

interface ImportResult {
  success: Person[];
  failed: Array<{
    row: number;
    data: unknown;
    error: string;
  }>;
}
```

### CSV Format
```csv
name,hebrew_name,birth_date,birth_time,birth_place,tags
ליאור,,1966-09-23,,,"משפחה,הורים"
מיכל,,1988-03-15,14:30,תל אביב,בן זוג
```

---

## Soft Delete & Recovery

### Delete Flow
```typescript
async function deletePerson(personId: PersonId): Promise<void> {
  // Soft delete - set deletedAt timestamp
  await supabase
    .from('people')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', personId);
}

async function restorePerson(personId: PersonId): Promise<void> {
  await supabase
    .from('people')
    .update({ deleted_at: null })
    .eq('id', personId);
}

// Permanently delete after 30 days (background job)
async function permanentlyDeleteOldRecords(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await supabase
    .from('people')
    .delete()
    .lt('deleted_at', thirtyDaysAgo.toISOString());
}
```

### Trash View
```
┌─────────────────────────────────────────────────────────┐
│  פח אשפה                              [רוקן הכל]       │
├─────────────────────────────────────────────────────────┤
│  פריטים שנמחקו יוסרו לצמיתות אחרי 30 יום              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────┐ דוד                      נמחק לפני 5 ימים     │
│  │ 👤  │ 12.4.1975                                      │
│  └─────┘                          [שחזר] [מחק לצמיתות] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## State Management

### Zustand Store
```typescript
interface PeopleStore {
  // State
  people: Person[];
  tags: Tag[];
  loading: boolean;
  error: string | null;

  // Selection
  selectedIds: Set<PersonId>;
  selectPerson: (id: PersonId) => void;
  deselectPerson: (id: PersonId) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;

  // Sort
  sort: SortState;
  setSort: (sort: SortState) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // CRUD
  fetchPeople: () => Promise<void>;
  addPerson: (data: PersonFormData) => Promise<Person>;
  updatePerson: (id: PersonId, data: Partial<PersonFormData>) => Promise<void>;
  deletePerson: (id: PersonId) => Promise<void>;
  restorePerson: (id: PersonId) => Promise<void>;

  // Tags
  addTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
  deleteTag: (id: TagId) => Promise<void>;

  // Computed
  filteredPeople: () => Person[];
  peopleByTag: (tagId: TagId) => Person[];
}
```

---

## API Endpoints

```
GET    /api/people              # List all people
POST   /api/people              # Create person
GET    /api/people/:id          # Get person by ID
PATCH  /api/people/:id          # Update person
DELETE /api/people/:id          # Soft delete person
POST   /api/people/:id/restore  # Restore deleted person
DELETE /api/people/:id/permanent # Permanent delete

GET    /api/people/deleted      # List deleted people
POST   /api/people/import       # Bulk import
GET    /api/people/export       # Export people

GET    /api/tags                # List all tags
POST   /api/tags                # Create custom tag
DELETE /api/tags/:id            # Delete custom tag
```

---

## Performance Considerations

### Pagination
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Default page size: 50
// Max page size: 200
```

### Caching
```typescript
// Cache people list for 5 minutes
// Invalidate on any mutation
// Use optimistic updates for better UX
```

### Computed Results
```typescript
// Pre-compute system results when person is created/updated
// Store in computed_results table
// Only recompute when:
//   1. Birth data changes
//   2. Algorithm version changes
```

import mongoose, { Schema, Model } from 'mongoose';

export type BoardTemplate =
  | 'blank'
  | 'relationship-map'
  | 'family-tree'
  | 'yearly-overview'
  | 'personal-profile'
  | 'group-analysis';

export interface IBoard {
  /** Better Auth user id (referenced auth.users.id). */
  owner_id: string;
  name: string;
  description?: string | null;
  template?: BoardTemplate | null;
  canvas: Record<string, unknown>;
  layers: Array<Record<string, unknown>>;
  thumbnail?: string | null;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

const DEFAULT_CANVAS: Record<string, unknown> = {
  width: 1920,
  height: 1080,
  viewBox: { x: 0, y: 0, width: 1920, height: 1080, zoom: 1 },
  background: { type: 'solid', color: '#FFFFFF' },
  grid: { visible: true, size: 20, snap: true, color: '#E5E7EB' },
  nodes: [],
  connections: [],
  annotations: [],
};

const DEFAULT_LAYERS: Array<Record<string, unknown>> = [
  { id: 'background', name: 'רקע', visible: true, locked: false, opacity: 1, order: 0, color: '#9CA3AF' },
  { id: 'people', name: 'אנשים', visible: true, locked: false, opacity: 1, order: 1, color: '#3B82F6' },
  { id: 'connections', name: 'קשרים', visible: true, locked: false, opacity: 1, order: 2, color: '#10B981' },
  { id: 'annotations', name: 'הערות', visible: true, locked: false, opacity: 1, order: 3, color: '#F59E0B' },
];

const boardSchema = new Schema<IBoard>(
  {
    owner_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    template: {
      type: String,
      enum: [
        'blank',
        'relationship-map',
        'family-tree',
        'yearly-overview',
        'personal-profile',
        'group-analysis',
      ],
      default: null,
    },
    canvas: { type: Schema.Types.Mixed, required: true, default: () => ({ ...DEFAULT_CANVAS }) },
    // JSONB array in Postgres. Typed as Mixed (the document type stays an
    // array); Mongoose stores the array contents verbatim.
    layers: {
      type: Schema.Types.Mixed,
      required: true,
      default: (): Array<Record<string, unknown>> =>
        DEFAULT_LAYERS.map((l) => ({ ...l })),
    },
    thumbnail: { type: String, default: null },
    is_public: { type: Boolean, required: true, default: false },
  },
  {
    collection: 'boards',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

boardSchema.index({ owner_id: 1 });
// Partial index: idx_boards_template WHERE template IS NOT NULL
boardSchema.index(
  { template: 1 },
  { partialFilterExpression: { template: { $type: 'string' } } }
);
// Partial index: idx_boards_public WHERE is_public = TRUE
boardSchema.index({ is_public: 1 }, { partialFilterExpression: { is_public: true } });
boardSchema.index({ updated_at: -1 });

export default (mongoose.models.Board as Model<IBoard>) ||
  mongoose.model<IBoard>('Board', boardSchema);

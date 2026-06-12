import mongoose, { Schema, Model } from 'mongoose';

export type ShareType = 'person' | 'relationship' | 'group' | 'graph';

export interface ISharedView {
  /** Better Auth user id (referenced auth.users.id). */
  owner_id: string;
  share_type: ShareType;
  options: Record<string, unknown>;
  url_token: string;
  expires_at?: Date | null;
  max_views?: number | null;
  view_count: number;
  password_hash?: string | null;
  active: boolean;
  created_at: Date;
}

const sharedViewSchema = new Schema<ISharedView>(
  {
    owner_id: { type: String, required: true, index: true },
    share_type: {
      type: String,
      required: true,
      enum: ['person', 'relationship', 'group', 'graph'],
    },
    options: { type: Schema.Types.Mixed, required: true, default: {} },
    url_token: { type: String, required: true, unique: true },
    expires_at: { type: Date, default: null },
    max_views: { type: Number, default: null },
    view_count: { type: Number, required: true, default: 0 },
    password_hash: { type: String, default: null },
    active: { type: Boolean, required: true, default: true },
  },
  {
    collection: 'shared_views',
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

sharedViewSchema.index({ owner_id: 1 });
sharedViewSchema.index({ url_token: 1 });
// Partial index: idx_shared_views_active WHERE active = TRUE
sharedViewSchema.index(
  { active: 1 },
  { partialFilterExpression: { active: true } }
);

export default (mongoose.models.SharedView as Model<ISharedView>) ||
  mongoose.model<ISharedView>('SharedView', sharedViewSchema);

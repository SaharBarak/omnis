import mongoose, { Schema, Model } from 'mongoose';

export interface ITag {
  /** Better Auth user id (referenced auth.users.id). Null for system tags. */
  owner_id?: string | null;
  name: string;
  hebrew_name: string;
  color: string;
  is_system: boolean;
  sort_order: number;
  created_at: Date;
}

const tagSchema = new Schema<ITag>(
  {
    owner_id: { type: String, default: null, index: true },
    name: { type: String, required: true },
    hebrew_name: { type: String, required: true },
    color: {
      type: String,
      required: true,
      default: '#6B7280',
      // CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    is_system: { type: Boolean, required: true, default: false },
    sort_order: { type: Number, required: true, default: 0 },
  },
  {
    collection: 'tags',
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// CONSTRAINT unique_tag_name UNIQUE (owner_id, name)
tagSchema.index({ owner_id: 1, name: 1 }, { unique: true });

export default (mongoose.models.Tag as Model<ITag>) ||
  mongoose.model<ITag>('Tag', tagSchema);

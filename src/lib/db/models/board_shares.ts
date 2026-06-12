import mongoose, { Schema, Model, Types } from 'mongoose';

export type BoardSharePermission = 'view' | 'comment' | 'edit';

export interface IBoardShare {
  board_id: Types.ObjectId;
  url_token: string;
  permissions: BoardSharePermission;
  expires_at?: Date | null;
  max_views?: number | null;
  view_count: number;
  password_hash?: string | null;
  active: boolean;
  created_at: Date;
}

const boardShareSchema = new Schema<IBoardShare>(
  {
    board_id: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    url_token: { type: String, required: true, unique: true },
    permissions: {
      type: String,
      required: true,
      default: 'view',
      enum: ['view', 'comment', 'edit'],
    },
    expires_at: { type: Date, default: null },
    max_views: { type: Number, default: null },
    view_count: { type: Number, required: true, default: 0 },
    password_hash: { type: String, default: null },
    active: { type: Boolean, required: true, default: true },
  },
  {
    collection: 'board_shares',
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

boardShareSchema.index({ board_id: 1 });
boardShareSchema.index({ url_token: 1 });
// Partial index: idx_board_shares_active WHERE active = TRUE
boardShareSchema.index(
  { active: 1 },
  { partialFilterExpression: { active: true } }
);

export default (mongoose.models.BoardShare as Model<IBoardShare>) ||
  mongoose.model<IBoardShare>('BoardShare', boardShareSchema);

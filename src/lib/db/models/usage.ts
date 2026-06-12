import mongoose, { Schema, Model } from 'mongoose';

export interface IUsage {
  /** Better Auth user id (referenced auth.users.id). */
  user_id: string;
  /** Format: YYYY-MM */
  period: string;
  profiles_count: number;
  ai_interpretations_used: number;
  boards_count: number;
  exports_count: number;
  created_at: Date;
  updated_at: Date;
}

const usageSchema = new Schema<IUsage>(
  {
    user_id: { type: String, required: true, index: true },
    period: { type: String, required: true },
    profiles_count: { type: Number, default: 0 },
    ai_interpretations_used: { type: Number, default: 0 },
    boards_count: { type: Number, default: 0 },
    exports_count: { type: Number, default: 0 },
  },
  {
    collection: 'usage',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// CONSTRAINT usage_user_period_unique UNIQUE (user_id, period)
// Also serves idx_usage_user_period (user_id, period).
usageSchema.index({ user_id: 1, period: 1 }, { unique: true });
usageSchema.index({ period: 1 });

export default (mongoose.models.Usage as Model<IUsage>) ||
  mongoose.model<IUsage>('Usage', usageSchema);

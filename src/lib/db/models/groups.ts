import mongoose, { Schema, Model } from 'mongoose';

export interface IGroup {
  /** Better Auth user id (referenced auth.users.id). */
  owner_id: string;
  name: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    owner_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
  },
  {
    collection: 'groups',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

groupSchema.index({ owner_id: 1 });

export default (mongoose.models.Group as Model<IGroup>) ||
  mongoose.model<IGroup>('Group', groupSchema);

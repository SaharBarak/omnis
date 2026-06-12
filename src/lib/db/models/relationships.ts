import mongoose, { Schema, Model, Types } from 'mongoose';

export type RelationshipType =
  | 'family'
  | 'romantic'
  | 'friend'
  | 'professional'
  | 'other';

export interface IRelationship {
  /** Better Auth user id (referenced auth.users.id). */
  owner_id: string;
  person1_id: Types.ObjectId;
  person2_id: Types.ObjectId;
  type: RelationshipType;
  subtype?: string | null;
  bidirectional: boolean;
  strength: number;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

const relationshipSchema = new Schema<IRelationship>(
  {
    owner_id: { type: String, required: true, index: true },
    person1_id: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    person2_id: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    type: {
      type: String,
      required: true,
      enum: ['family', 'romantic', 'friend', 'professional', 'other'],
    },
    subtype: { type: String, default: null },
    bidirectional: { type: Boolean, required: true, default: true },
    // CHECK (strength >= 1 AND strength <= 5)
    strength: { type: Number, required: true, default: 3, min: 1, max: 5 },
    start_date: { type: String, default: null },
    end_date: { type: String, default: null },
    notes: { type: String, default: null },
  },
  {
    collection: 'relationships',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// CONSTRAINT unique_relationship UNIQUE (owner_id, person1_id, person2_id, type)
relationshipSchema.index(
  { owner_id: 1, person1_id: 1, person2_id: 1, type: 1 },
  { unique: true }
);
relationshipSchema.index({ owner_id: 1 });
relationshipSchema.index({ person1_id: 1 });
relationshipSchema.index({ person2_id: 1 });
relationshipSchema.index({ type: 1 });

export default (mongoose.models.Relationship as Model<IRelationship>) ||
  mongoose.model<IRelationship>('Relationship', relationshipSchema);

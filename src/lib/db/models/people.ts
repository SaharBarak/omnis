import mongoose, { Schema, Model } from 'mongoose';
import type { IBirthPlace } from './profiles';

export interface IPerson {
  /** Better Auth user id (referenced auth.users.id). */
  owner_id: string;
  name: string;
  hebrew_name?: string | null;
  birth_date: string;
  birth_time?: string | null;
  birth_place?: IBirthPlace | null;
  avatar_url?: string | null;
  notes?: string | null;
  is_self: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const birthPlaceSchema = new Schema<IBirthPlace>(
  {
    lat: { type: Number },
    lng: { type: Number },
    name: { type: String },
  },
  { _id: false }
);

const personSchema = new Schema<IPerson>(
  {
    owner_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    hebrew_name: { type: String, default: null },
    birth_date: { type: String, required: true },
    birth_time: { type: String, default: null },
    birth_place: { type: birthPlaceSchema, default: null },
    avatar_url: { type: String, default: null },
    notes: { type: String, default: null },
    is_self: { type: Boolean, required: true, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    collection: 'people',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

personSchema.index({ owner_id: 1 });
personSchema.index({ owner_id: 1, deleted_at: 1 });
personSchema.index({ name: 1 });
personSchema.index({ birth_date: 1 });
// Replaces the Postgres GIN full-text index on (name, hebrew_name).
personSchema.index({ name: 'text', hebrew_name: 'text' });

export default (mongoose.models.Person as Model<IPerson>) ||
  mongoose.model<IPerson>('Person', personSchema);

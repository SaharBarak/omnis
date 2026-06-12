import mongoose, { Schema, Model } from 'mongoose';

export interface IBirthPlace {
  lat?: number;
  lng?: number;
  name?: string;
}

export interface IProfile {
  /** Better Auth user id (referenced auth.users.id). Acts as the logical PK. */
  user_id: string;
  display_name: string;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_place?: IBirthPlace | null;
  hebrew_name?: string | null;
  avatar_url?: string | null;
  locale: 'he' | 'en';
  timezone: string;
  preferences?: Record<string, unknown>;
  onboarding_completed: boolean;
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

const profileSchema = new Schema<IProfile>(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    display_name: { type: String, required: true },
    birth_date: { type: String, default: null },
    birth_time: { type: String, default: null },
    birth_place: { type: birthPlaceSchema, default: null },
    hebrew_name: { type: String, default: null },
    avatar_url: { type: String, default: null },
    locale: { type: String, enum: ['he', 'en'], required: true, default: 'he' },
    timezone: { type: String, required: true, default: 'Asia/Jerusalem' },
    preferences: { type: Schema.Types.Mixed, default: {} },
    onboarding_completed: { type: Boolean, required: true, default: false },
  },
  {
    collection: 'profiles',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

profileSchema.index({ locale: 1 });

export default (mongoose.models.Profile as Model<IProfile>) ||
  mongoose.model<IProfile>('Profile', profileSchema);

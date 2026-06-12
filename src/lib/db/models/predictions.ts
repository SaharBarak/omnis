import mongoose, { Schema, Model, Types } from 'mongoose';

export type PredictionSystem =
  | 'dreamspell'
  | 'tzolkin'
  | 'astrology'
  | 'humandesign'
  | 'longcount';

export type PredictionType =
  | 'wavespell'
  | 'castle'
  | 'yearly-kin'
  | 'trecena'
  | 'year-bearer'
  | 'transit'
  | 'return'
  | 'retrograde'
  | 'hd-transit';

export type PredictionIntensity = 'low' | 'medium' | 'high' | 'peak';

export interface IPrediction {
  person_id?: Types.ObjectId | null;
  /** Better Auth user id (referenced auth.users.id). */
  owner_id: string;
  system: PredictionSystem;
  type: PredictionType;
  start_date: string;
  end_date: string;
  intensity: PredictionIntensity;
  themes: string[];
  interpretation?: string | null;
  data: Record<string, unknown>;
  computed_at: Date;
  expires_at: Date;
  created_at: Date;
}

const predictionSchema = new Schema<IPrediction>(
  {
    person_id: { type: Schema.Types.ObjectId, ref: 'Person', default: null },
    owner_id: { type: String, required: true, index: true },
    system: {
      type: String,
      required: true,
      enum: ['dreamspell', 'tzolkin', 'astrology', 'humandesign', 'longcount'],
    },
    type: {
      type: String,
      required: true,
      enum: [
        'wavespell',
        'castle',
        'yearly-kin',
        'trecena',
        'year-bearer',
        'transit',
        'return',
        'retrograde',
        'hd-transit',
      ],
    },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    intensity: {
      type: String,
      required: true,
      default: 'medium',
      enum: ['low', 'medium', 'high', 'peak'],
    },
    themes: { type: [String], default: [] },
    interpretation: { type: String, default: null },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
    computed_at: { type: Date, required: true, default: () => new Date() },
    // DEFAULT (NOW() + INTERVAL '30 days')
    expires_at: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    created_at: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'predictions' }
);

predictionSchema.index({ owner_id: 1 });
predictionSchema.index({ person_id: 1 });
predictionSchema.index({ system: 1 });
// idx_predictions_dates (start_date, end_date)
predictionSchema.index({ start_date: 1, end_date: 1 });
predictionSchema.index({ expires_at: 1 });

export default (mongoose.models.Prediction as Model<IPrediction>) ||
  mongoose.model<IPrediction>('Prediction', predictionSchema);

import mongoose, { Schema, Model, Types } from 'mongoose';

export type ComputedSystem =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'humandesign'
  | 'astrology'
  | 'gematria';

export interface IComputedResult {
  person_id: Types.ObjectId;
  system: ComputedSystem;
  version: string;
  data: Record<string, unknown>;
  computed_at: Date;
}

const computedResultSchema = new Schema<IComputedResult>(
  {
    person_id: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    system: {
      type: String,
      required: true,
      enum: [
        'dreamspell',
        'tzolkin',
        'longcount',
        'humandesign',
        'astrology',
        'gematria',
      ],
    },
    version: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    computed_at: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'computed_results' }
);

// CONSTRAINT unique_person_system_version UNIQUE (person_id, system, version)
computedResultSchema.index(
  { person_id: 1, system: 1, version: 1 },
  { unique: true }
);
computedResultSchema.index({ person_id: 1 });
computedResultSchema.index({ system: 1 });

export default (mongoose.models.ComputedResult as Model<IComputedResult>) ||
  mongoose.model<IComputedResult>('ComputedResult', computedResultSchema);

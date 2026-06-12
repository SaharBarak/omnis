import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IPersonTag {
  person_id: Types.ObjectId;
  tag_id: Types.ObjectId;
}

const personTagSchema = new Schema<IPersonTag>(
  {
    person_id: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    tag_id: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  },
  { collection: 'person_tags' }
);

// PRIMARY KEY (person_id, tag_id) -> unique composite index.
personTagSchema.index({ person_id: 1, tag_id: 1 }, { unique: true });
// idx_person_tags_tag
personTagSchema.index({ tag_id: 1 });

export default (mongoose.models.PersonTag as Model<IPersonTag>) ||
  mongoose.model<IPersonTag>('PersonTag', personTagSchema);

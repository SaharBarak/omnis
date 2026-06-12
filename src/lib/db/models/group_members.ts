import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IGroupMember {
  group_id: Types.ObjectId;
  person_id: Types.ObjectId;
  added_at: Date;
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    group_id: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    person_id: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    added_at: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'group_members' }
);

// PRIMARY KEY (group_id, person_id) -> unique composite index.
groupMemberSchema.index({ group_id: 1, person_id: 1 }, { unique: true });
// idx_group_members_person
groupMemberSchema.index({ person_id: 1 });

export default (mongoose.models.GroupMember as Model<IGroupMember>) ||
  mongoose.model<IGroupMember>('GroupMember', groupMemberSchema);

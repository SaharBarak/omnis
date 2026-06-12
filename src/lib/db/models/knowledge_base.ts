import mongoose, { Schema, Model } from 'mongoose';

export interface IKnowledgeBase {
  source_url: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

const knowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    source_url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    collection: 'knowledge_base',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default (mongoose.models.KnowledgeBase as Model<IKnowledgeBase>) ||
  mongoose.model<IKnowledgeBase>('KnowledgeBase', knowledgeBaseSchema);

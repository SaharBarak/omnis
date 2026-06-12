import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IContentChunk {
  knowledge_base_id: Types.ObjectId;
  chunk_index: number;
  chunk_text: string;
  /** 384-dimensional embedding (all-MiniLM-L6-v2). */
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: Date;
}

const contentChunkSchema = new Schema<IContentChunk>(
  {
    knowledge_base_id: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeBase',
      required: true,
    },
    chunk_index: { type: Number, required: true },
    chunk_text: { type: String, required: true },
    embedding: { type: [Number], default: undefined },
    metadata: { type: Schema.Types.Mixed, default: {} },
    created_at: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'content_chunks' }
);

// idx_content_chunks_kb_id
contentChunkSchema.index({ knowledge_base_id: 1 });

// NOTE: The vector similarity index is NOT created here. Atlas Vector Search
// indexes are managed out-of-band (Atlas UI / Admin API / `createSearchIndex`).
// Create an Atlas Vector Search index named `embedding_vector_index` on the
// `embedding` field: 384 dimensions, cosine similarity.

export default (mongoose.models.ContentChunk as Model<IContentChunk>) ||
  mongoose.model<IContentChunk>('ContentChunk', contentChunkSchema);

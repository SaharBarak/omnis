import mongoose, { Schema, Model } from 'mongoose';

export interface INewsletterSubscriber {
  email: string;
  subscribed_at?: Date | null;
  confirmed: boolean;
  confirmed_at?: Date | null;
  unsubscribed_at?: Date | null;
  preferences: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true },
    subscribed_at: { type: Date, default: () => new Date() },
    confirmed: { type: Boolean, default: false },
    confirmed_at: { type: Date, default: null },
    unsubscribed_at: { type: Date, default: null },
    preferences: { type: Schema.Types.Mixed, default: () => ({ daily_kin: true }) },
  },
  {
    collection: 'newsletter_subscribers',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// idx_newsletter_subscribers_email (email already unique-indexed above)
newsletterSubscriberSchema.index({ email: 1 });
// Partial index: idx_newsletter_subscribers_confirmed
// WHERE confirmed = TRUE AND unsubscribed_at IS NULL
newsletterSubscriberSchema.index(
  { confirmed: 1 },
  { partialFilterExpression: { confirmed: true, unsubscribed_at: null } }
);

export default (mongoose.models.NewsletterSubscriber as Model<INewsletterSubscriber>) ||
  mongoose.model<INewsletterSubscriber>(
    'NewsletterSubscriber',
    newsletterSubscriberSchema
  );

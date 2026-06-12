import mongoose, { Schema, Model } from 'mongoose';

export type SubscriptionPlan = 'free' | 'complete' | 'practitioner';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete';

export interface ISubscription {
  /** Better Auth user id (referenced auth.users.id). One subscription per user. */
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_start?: Date | null;
  current_period_end?: Date | null;
  cancel_at_period_end?: boolean;
  trial_end?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user_id: { type: String, required: true, index: true },
    plan: {
      type: String,
      required: true,
      default: 'free',
      enum: ['free', 'complete', 'practitioner'],
    },
    status: {
      type: String,
      required: true,
      default: 'active',
      enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete'],
    },
    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null },
    current_period_start: { type: Date, default: null },
    current_period_end: { type: Date, default: null },
    cancel_at_period_end: { type: Boolean, default: false },
    trial_end: { type: Date, default: null },
  },
  {
    collection: 'subscriptions',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
subscriptionSchema.index({ user_id: 1 }, { unique: true });
subscriptionSchema.index({ stripe_customer_id: 1 });
subscriptionSchema.index({ stripe_subscription_id: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });

export default (mongoose.models.Subscription as Model<ISubscription>) ||
  mongoose.model<ISubscription>('Subscription', subscriptionSchema);

import mongoose, { Schema, Model } from 'mongoose';

export type MinIntensity = 'low' | 'medium' | 'high' | 'peak';

export interface INotificationSettings {
  /** Better Auth user id (referenced auth.users.id). Acts as the logical PK. */
  user_id: string;
  enabled: boolean;
  channels: string[];
  daily_digest: boolean;
  daily_digest_time?: string | null;
  weekly_digest: boolean;
  weekly_digest_day?: number | null;
  advance_notice: number;
  systems: string[];
  min_intensity: MinIntensity;
  created_at: Date;
  updated_at: Date;
}

const notificationSettingsSchema = new Schema<INotificationSettings>(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, required: true, default: true },
    channels: { type: [String], required: true, default: ['in-app'] },
    daily_digest: { type: Boolean, required: true, default: false },
    // TIME stored as 'HH:mm' string.
    daily_digest_time: { type: String, default: '08:00' },
    weekly_digest: { type: Boolean, required: true, default: false },
    // CHECK (weekly_digest_day >= 0 AND weekly_digest_day <= 6)
    weekly_digest_day: { type: Number, default: 0, min: 0, max: 6 },
    // CHECK (advance_notice >= 0 AND advance_notice <= 30)
    advance_notice: { type: Number, required: true, default: 1, min: 0, max: 30 },
    systems: { type: [String], required: true, default: ['dreamspell', 'tzolkin'] },
    min_intensity: {
      type: String,
      required: true,
      default: 'medium',
      enum: ['low', 'medium', 'high', 'peak'],
    },
  },
  {
    collection: 'notification_settings',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default (mongoose.models.NotificationSettings as Model<INotificationSettings>) ||
  mongoose.model<INotificationSettings>(
    'NotificationSettings',
    notificationSettingsSchema
  );

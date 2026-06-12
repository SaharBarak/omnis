import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IEmailSendLog {
  subscriber_id?: Types.ObjectId | null;
  email_type: string;
  subject?: string | null;
  sent_at?: Date | null;
  resend_id?: string | null;
  status: string;
  error_message?: string | null;
}

const emailSendLogSchema = new Schema<IEmailSendLog>(
  {
    // ON DELETE SET NULL -> nullable ref.
    subscriber_id: {
      type: Schema.Types.ObjectId,
      ref: 'NewsletterSubscriber',
      default: null,
    },
    email_type: { type: String, required: true }, // 'daily_kin' | 'welcome' | 'confirmation'
    subject: { type: String, default: null },
    sent_at: { type: Date, default: () => new Date() },
    resend_id: { type: String, default: null },
    status: { type: String, default: 'sent' }, // 'sent' | 'bounced' | 'failed'
    error_message: { type: String, default: null },
  },
  { collection: 'email_send_log' }
);

emailSendLogSchema.index({ subscriber_id: 1 });
emailSendLogSchema.index({ sent_at: 1 });

export default (mongoose.models.EmailSendLog as Model<IEmailSendLog>) ||
  mongoose.model<IEmailSendLog>('EmailSendLog', emailSendLogSchema);

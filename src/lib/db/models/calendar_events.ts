import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ICalendarEvent {
  /** Better Auth user id (referenced auth.users.id). */
  owner_id: string;
  prediction_id?: Types.ObjectId | null;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  all_day: boolean;
  category?: string | null;
  exported_at: Date;
  external_id?: string | null;
  created_at: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    owner_id: { type: String, required: true, index: true },
    // ON DELETE SET NULL -> nullable ref.
    prediction_id: {
      type: Schema.Types.ObjectId,
      ref: 'Prediction',
      default: null,
    },
    title: { type: String, required: true },
    description: { type: String, default: null },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    all_day: { type: Boolean, required: true, default: true },
    category: { type: String, default: null },
    exported_at: { type: Date, required: true, default: () => new Date() },
    external_id: { type: String, default: null },
    created_at: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'calendar_events' }
);

calendarEventSchema.index({ owner_id: 1 });
// idx_calendar_events_dates (start_date, end_date)
calendarEventSchema.index({ start_date: 1, end_date: 1 });

export default (mongoose.models.CalendarEvent as Model<ICalendarEvent>) ||
  mongoose.model<ICalendarEvent>('CalendarEvent', calendarEventSchema);

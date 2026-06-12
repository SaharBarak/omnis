// Barrel export for all Mongoose models.
// Importing this module registers every schema on the mongoose connection.

export { default as Profile } from './profiles';
export type { IProfile, IBirthPlace } from './profiles';

export { default as Person } from './people';
export type { IPerson } from './people';

export { default as Tag } from './tags';
export type { ITag } from './tags';

export { default as PersonTag } from './person_tags';
export type { IPersonTag } from './person_tags';

export { default as ComputedResult } from './computed_results';
export type { IComputedResult, ComputedSystem } from './computed_results';

export { default as Relationship } from './relationships';
export type { IRelationship, RelationshipType } from './relationships';

export { default as Group } from './groups';
export type { IGroup } from './groups';

export { default as GroupMember } from './group_members';
export type { IGroupMember } from './group_members';

export { default as SharedView } from './shared_views';
export type { ISharedView, ShareType } from './shared_views';

export { default as Board } from './boards';
export type { IBoard, BoardTemplate } from './boards';

export { default as BoardShare } from './board_shares';
export type { IBoardShare, BoardSharePermission } from './board_shares';

export { default as Prediction } from './predictions';
export type {
  IPrediction,
  PredictionSystem,
  PredictionType,
  PredictionIntensity,
} from './predictions';

export { default as NotificationSettings } from './notification_settings';
export type { INotificationSettings, MinIntensity } from './notification_settings';

export { default as CalendarEvent } from './calendar_events';
export type { ICalendarEvent } from './calendar_events';

export { default as NewsletterSubscriber } from './newsletter_subscribers';
export type { INewsletterSubscriber } from './newsletter_subscribers';

export { default as EmailSendLog } from './email_send_log';
export type { IEmailSendLog } from './email_send_log';

export { default as Subscription } from './subscriptions';
export type {
  ISubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './subscriptions';

export { default as Usage } from './usage';
export type { IUsage } from './usage';

export { default as KnowledgeBase } from './knowledge_base';
export type { IKnowledgeBase } from './knowledge_base';

export { default as ContentChunk } from './content_chunks';
export type { IContentChunk } from './content_chunks';

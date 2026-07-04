CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "board_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"url_token" text NOT NULL,
	"permissions" text DEFAULT 'view' NOT NULL,
	"expires_at" timestamp with time zone,
	"max_views" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"password_hash" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"template" text,
	"canvas" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"layers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"thumbnail" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"prediction_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"all_day" boolean DEFAULT true NOT NULL,
	"category" text,
	"exported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "computed_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"system" text NOT NULL,
	"version" text NOT NULL,
	"data" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"embedding" vector(384),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_send_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" uuid,
	"email_type" text NOT NULL,
	"subject" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resend_id" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_group_id_person_id_pk" PRIMARY KEY("group_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now(),
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"confirmed" boolean DEFAULT false NOT NULL,
	"preferences" jsonb DEFAULT '{"daily_kin":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"channels" jsonb DEFAULT '["in-app"]'::jsonb NOT NULL,
	"daily_digest" boolean DEFAULT false NOT NULL,
	"daily_digest_time" text DEFAULT '08:00' NOT NULL,
	"weekly_digest" boolean DEFAULT false NOT NULL,
	"weekly_digest_day" integer DEFAULT 0 NOT NULL,
	"advance_notice" integer DEFAULT 1 NOT NULL,
	"systems" jsonb DEFAULT '["dreamspell","tzolkin"]'::jsonb NOT NULL,
	"min_intensity" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"hebrew_name" text,
	"birth_date" text NOT NULL,
	"birth_time" text,
	"birth_place" jsonb,
	"avatar_url" text,
	"notes" text,
	"is_self" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_tags" (
	"person_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "person_tags_person_id_tag_id_pk" PRIMARY KEY("person_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid,
	"owner_id" text NOT NULL,
	"system" text NOT NULL,
	"type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"intensity" text DEFAULT 'medium' NOT NULL,
	"themes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interpretation" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"birth_date" text,
	"birth_time" text,
	"birth_place" jsonb,
	"hebrew_name" text,
	"avatar_url" text,
	"locale" text DEFAULT 'he' NOT NULL,
	"timezone" text DEFAULT 'Asia/Jerusalem' NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"person1_id" uuid NOT NULL,
	"person2_id" uuid NOT NULL,
	"type" text NOT NULL,
	"subtype" text,
	"bidirectional" boolean DEFAULT true NOT NULL,
	"strength" integer DEFAULT 3 NOT NULL,
	"start_date" text,
	"end_date" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"share_type" text NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"url_token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"max_views" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"password_hash" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"paddle_customer_id" text,
	"paddle_subscription_id" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"name" text NOT NULL,
	"hebrew_name" text NOT NULL,
	"color" text DEFAULT '#6B7280' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"period" text NOT NULL,
	"profiles_count" integer DEFAULT 0 NOT NULL,
	"ai_interpretations_used" integer DEFAULT 0 NOT NULL,
	"boards_count" integer DEFAULT 0 NOT NULL,
	"exports_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_shares" ADD CONSTRAINT "board_shares_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "computed_results" ADD CONSTRAINT "computed_results_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_log" ADD CONSTRAINT "email_send_log_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_tags" ADD CONSTRAINT "person_tags_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_tags" ADD CONSTRAINT "person_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_person1_id_people_id_fk" FOREIGN KEY ("person1_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_person2_id_people_id_fk" FOREIGN KEY ("person2_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "board_shares_token_uq" ON "board_shares" USING btree ("url_token");--> statement-breakpoint
CREATE INDEX "board_shares_board_idx" ON "board_shares" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "boards_owner_idx" ON "boards" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "boards_updated_idx" ON "boards" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "calendar_events_owner_idx" ON "calendar_events" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "calendar_events_dates_idx" ON "calendar_events" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "computed_results_person_system_version_uq" ON "computed_results" USING btree ("person_id","system","version");--> statement-breakpoint
CREATE INDEX "computed_results_system_idx" ON "computed_results" USING btree ("system");--> statement-breakpoint
CREATE INDEX "content_chunks_kb_idx" ON "content_chunks" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "email_log_subscriber_idx" ON "email_send_log" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "email_log_sent_idx" ON "email_send_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "group_members_person_idx" ON "group_members" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "groups_owner_idx" ON "groups" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_source_uq" ON "knowledge_base" USING btree ("source_url");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_uq" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_settings_user_uq" ON "notification_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "people_owner_idx" ON "people" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "people_owner_deleted_idx" ON "people" USING btree ("owner_id","deleted_at");--> statement-breakpoint
CREATE INDEX "people_name_idx" ON "people" USING btree ("name");--> statement-breakpoint
CREATE INDEX "people_birth_date_idx" ON "people" USING btree ("birth_date");--> statement-breakpoint
CREATE INDEX "person_tags_tag_idx" ON "person_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "predictions_owner_idx" ON "predictions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "predictions_person_idx" ON "predictions" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "predictions_dates_idx" ON "predictions" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "predictions_expires_idx" ON "predictions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_uq" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "relationships_uq" ON "relationships" USING btree ("owner_id","person1_id","person2_id","type");--> statement-breakpoint
CREATE INDEX "relationships_owner_idx" ON "relationships" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "relationships_p1_idx" ON "relationships" USING btree ("person1_id");--> statement-breakpoint
CREATE INDEX "relationships_p2_idx" ON "relationships" USING btree ("person2_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_views_token_uq" ON "shared_views" USING btree ("url_token");--> statement-breakpoint
CREATE INDEX "shared_views_owner_idx" ON "shared_views" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_uq" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_paddle_customer_idx" ON "subscriptions" USING btree ("paddle_customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_paddle_sub_idx" ON "subscriptions" USING btree ("paddle_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_owner_name_uq" ON "tags" USING btree ("owner_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_user_period_uq" ON "usage" USING btree ("user_id","period");
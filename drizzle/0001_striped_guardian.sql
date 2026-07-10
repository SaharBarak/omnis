CREATE TABLE "device_push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"expo_push_token" text NOT NULL,
	"platform" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "device_push_tokens_token_uq" ON "device_push_tokens" USING btree ("expo_push_token");--> statement-breakpoint
CREATE INDEX "device_push_tokens_user_idx" ON "device_push_tokens" USING btree ("user_id");
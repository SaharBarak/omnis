-- Billing provider migration: Paddle -> store IAP (RevenueCat).
--
-- Non-destructive on purpose. Hand-written rather than generated so the columns
-- are RENAMED (drizzle-kit's non-interactive diff would DROP + ADD and lose any
-- rows). Paddle never took a live payment, but a rename is correct regardless
-- and keeps the migration replayable against any environment.
--
-- billing_customer_id equals user_id under RevenueCat (app_user_id === Auth0
-- sub); it stays a distinct column so a web card acquirer can be added later
-- without another migration.
ALTER TABLE "subscriptions" RENAME COLUMN "paddle_customer_id" TO "billing_customer_id";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "paddle_subscription_id" TO "billing_subscription_id";--> statement-breakpoint
ALTER INDEX "subscriptions_paddle_customer_idx" RENAME TO "subscriptions_billing_customer_idx";--> statement-breakpoint
ALTER INDEX "subscriptions_paddle_sub_idx" RENAME TO "subscriptions_billing_sub_idx";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_provider" text;

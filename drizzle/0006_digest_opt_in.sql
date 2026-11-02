-- 0006: the customer daily digest goes back to opt-IN (product decision 2026-09-22).
-- Reverses 0005. Nobody receives the daily "today's sign" brief unless they
-- switch it on themselves at /app/settings/notifications.
--
-- 1) New rows get no digest and in-app only.
ALTER TABLE "notification_settings"
  ALTER COLUMN "daily_digest" SET DEFAULT false;
ALTER TABLE "notification_settings"
  ALTER COLUMN "channels" SET DEFAULT '["in-app"]'::jsonb;
--> statement-breakpoint

-- 2) Un-enroll everyone 0005 enrolled. Those rows still wear the exact shape
-- 0005 wrote (digest on + in-app/email); anything customized since — a
-- different channel set, or digest on without the email channel — is a real
-- user choice and is left alone.
UPDATE "notification_settings"
SET "daily_digest" = false,
    "channels" = '["in-app"]'::jsonb,
    "updated_at" = now()
WHERE "daily_digest" = true
  AND "channels" = '["in-app","email"]'::jsonb;

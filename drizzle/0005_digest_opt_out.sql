-- 0005: daily digest becomes opt-OUT (product decision 2026-07-29).
-- Every account gets the daily brief (email + in-app) until they turn it off
-- on /app/settings/notifications — the page every digest footer links to.
--
-- 1) New rows default to digest on + email channel.
ALTER TABLE "notification_settings"
  ALTER COLUMN "daily_digest" SET DEFAULT true;
ALTER TABLE "notification_settings"
  ALTER COLUMN "channels" SET DEFAULT '["in-app","email"]'::jsonb;
--> statement-breakpoint

-- 2) Rows still wearing the OLD defaults (digest off, in-app only) were
-- default-created, not user choices — flip them onto the new defaults.
-- A user who explicitly changed anything (email on, digest on, or a custom
-- channel set) is left untouched.
UPDATE "notification_settings"
SET "daily_digest" = true,
    "channels" = '["in-app","email"]'::jsonb,
    "updated_at" = now()
WHERE "daily_digest" = false
  AND "channels" = '["in-app"]'::jsonb;
--> statement-breakpoint

-- 3) Backfill: every auth user without a settings row gets one with the new
-- defaults, so the hourly digest cron sees the whole user base.
INSERT INTO "notification_settings" ("user_id", "enabled", "channels", "daily_digest", "daily_digest_time")
SELECT u."id", true, '["in-app","email"]'::jsonb, true, '08:00'
FROM "users" u
LEFT JOIN "notification_settings" ns ON ns."user_id" = u."id"
WHERE ns."id" IS NULL;

ALTER TABLE "commerce"."notification_jobs" ADD COLUMN "provider_reference" text;--> statement-breakpoint
ALTER TABLE "commerce"."notification_jobs" ADD COLUMN "first_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce"."notification_jobs" ADD COLUMN "sent_at" timestamp with time zone;
--> statement-breakpoint
GRANT UPDATE ON commerce.notification_jobs TO crownhouse_app;

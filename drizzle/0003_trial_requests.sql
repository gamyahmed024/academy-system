CREATE TYPE "public"."request_status" AS ENUM('new', 'contacted', 'enrolled', 'closed');--> statement-breakpoint
CREATE TABLE "trial_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text,
	"country" text,
	"timezone" text,
	"level" text NOT NULL,
	"for_whom" text NOT NULL,
	"preferred_times" text,
	"message" text,
	"lang" text NOT NULL,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"staff_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "trial_requests_status_idx" ON "trial_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "trial_requests_email_idx" ON "trial_requests" USING btree ("email","created_at");--> statement-breakpoint
-- Same rule as every public table: RLS on, no anon/authenticated grants (the app role owns it).
ALTER TABLE "trial_requests" ENABLE ROW LEVEL SECURITY;

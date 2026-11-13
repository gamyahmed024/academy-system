CREATE TABLE "password_help_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" integer,
	"lang" text NOT NULL,
	"handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"lessons_per_month" integer NOT NULL,
	"minutes" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_help_requests" ADD CONSTRAINT "password_help_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_help_email_idx" ON "password_help_requests" USING btree ("email","created_at");--> statement-breakpoint
-- Same rule as every public table: RLS on, no anon/authenticated grants (the app role owns them).
ALTER TABLE "password_help_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "price_plans" ENABLE ROW LEVEL SECURITY;

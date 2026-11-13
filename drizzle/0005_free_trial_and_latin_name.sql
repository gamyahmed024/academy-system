ALTER TABLE "lessons" ADD COLUMN "free" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "academy_name_latin" text DEFAULT 'Umam Academy' NOT NULL;--> statement-breakpoint
ALTER TABLE "trial_requests" ADD COLUMN "student_id" integer;--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
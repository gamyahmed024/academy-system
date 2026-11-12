CREATE UNIQUE INDEX "guardians_user_uq" ON "guardians" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_user_uq" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teachers_user_uq" ON "teachers" USING btree ("user_id");
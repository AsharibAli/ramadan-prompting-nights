CREATE TABLE "certificates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"verification_id" varchar(20) NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"total_score" integer NOT NULL,
	"rank" integer NOT NULL,
	"challenges_completed" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_verification_id_unique_idx" ON "certificates" USING btree ("verification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_user_id_unique_idx" ON "certificates" USING btree ("user_id");
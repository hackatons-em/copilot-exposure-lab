CREATE TABLE "schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"action" text DEFAULT 'scan' NOT NULL,
	"cadence_minutes" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
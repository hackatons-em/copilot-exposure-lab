CREATE TABLE "scan_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exposure_score" integer NOT NULL,
	"band" text NOT NULL,
	"bands" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"finding_count" integer NOT NULL,
	"fingerprints" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scan_snapshots" ADD CONSTRAINT "scan_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
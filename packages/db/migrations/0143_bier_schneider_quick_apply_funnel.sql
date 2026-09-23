CREATE TABLE "funnel_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"job_id" uuid,
	"application_id" uuid,
	"event_type" text NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_quick_apply" (
	"job_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"icon" text DEFAULT 'truck' NOT NULL,
	"pay_label" text,
	"hours_label" text,
	"localizations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_quick_apply" ADD CONSTRAINT "job_quick_apply_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_quick_apply" ADD CONSTRAINT "job_quick_apply_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "funnel_events_workspace_job_type_idx" ON "funnel_events" USING btree ("workspace_id","job_id","event_type","created_at");--> statement-breakpoint
CREATE INDEX "funnel_events_workspace_created_idx" ON "funnel_events" USING btree ("workspace_id","created_at");
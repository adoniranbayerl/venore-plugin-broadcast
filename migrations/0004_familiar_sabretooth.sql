CREATE TABLE "broadcast"."output_diag_events" (
	"id" text PRIMARY KEY NOT NULL,
	"output_id" text,
	"source" text NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "broadcast_output_diag_events_source_check" CHECK ("broadcast"."output_diag_events"."source" in ('browser','agent','server')),
	CONSTRAINT "broadcast_output_diag_events_level_check" CHECK ("broadcast"."output_diag_events"."level" in ('info','warning'))
);
--> statement-breakpoint
CREATE TABLE "broadcast"."output_diagnostics" (
	"id" text PRIMARY KEY NOT NULL,
	"output_id" text NOT NULL,
	"browser_snapshot" jsonb,
	"browser_reported_at" timestamp with time zone,
	"agent_snapshot" jsonb,
	"agent_reported_at" timestamp with time zone,
	"agent_station_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "broadcast"."output_diag_events" ADD CONSTRAINT "output_diag_events_output_id_outputs_id_fk" FOREIGN KEY ("output_id") REFERENCES "broadcast"."outputs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast"."output_diagnostics" ADD CONSTRAINT "output_diagnostics_output_id_outputs_id_fk" FOREIGN KEY ("output_id") REFERENCES "broadcast"."outputs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "broadcast_output_diagnostics_output_id_idx" ON "broadcast"."output_diagnostics" USING btree ("output_id");
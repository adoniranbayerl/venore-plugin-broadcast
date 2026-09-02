CREATE TABLE "broadcast"."agenda_event_dates" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "broadcast"."agenda_event_dates" ADD CONSTRAINT "agenda_event_dates_event_id_agenda_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "broadcast"."agenda_events"("id") ON DELETE cascade ON UPDATE no action;
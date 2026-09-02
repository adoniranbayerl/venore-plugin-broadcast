import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastAgendaEventRecord } from "../../../contracts/types";

export type UpdateAgendaEventCommand = {
  eventId: string;
  title: string;
  description?: string | null;
  startAt: Date;
  recurring?: boolean;
  endAt?: Date | null;
  // Substitui TODAS as datas avulsas do evento (replaceAgendaEventDates). Ignoradas quando
  // recurring=true (o service grava zero). Ver broadcast_agenda_event_dates no schema.
  extraDates?: { startAt: Date; endAt?: Date | null }[];
  coverMediaAssetId?: string | null;
  location?: string | null;
  actorId: string;
};

export type UpdateAgendaEventInput = Omit<UpdateAgendaEventCommand, "actorId">;
export type UpdateAgendaEventResult = OperationResult<BroadcastAgendaEventRecord>;

import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastAgendaEventRecord } from "../../../contracts/types";

export type CreateAgendaEventCommand = {
  agendaId: string;
  title: string;
  description?: string | null;
  startAt: Date;
  recurring?: boolean;
  endAt?: Date | null;
  // Datas avulsas além da primária — cada uma com início e término (opcional) próprios. Ignoradas
  // quando recurring=true (o service persiste zero). Ver broadcast_agenda_event_dates no schema.
  extraDates?: { startAt: Date; endAt?: Date | null }[];
  coverMediaAssetId?: string | null;
  location?: string | null;
  actorId: string;
};

export type CreateAgendaEventInput = Omit<CreateAgendaEventCommand, "actorId">;
export type CreateAgendaEventResult = OperationResult<BroadcastAgendaEventRecord>;

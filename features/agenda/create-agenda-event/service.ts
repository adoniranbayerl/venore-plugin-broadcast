import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { insertAgendaEvent, insertAgendaEventDates } from "./store";
import type { CreateAgendaEventCommand, CreateAgendaEventResult } from "./types";

export async function createAgendaEvent(command: CreateAgendaEventCommand): Promise<CreateAgendaEventResult> {
  const handle = beginOperation({
    useCase: "broadcast.create-agenda-event",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const recurring = command.recurring ?? false;
  const record = await insertAgendaEvent({
    agendaId: command.agendaId,
    title: command.title.trim(),
    description: command.description?.trim() || null,
    startAt: command.startAt,
    recurring,
    endAt: command.endAt ?? null,
    coverMediaAssetId: command.coverMediaAssetId?.trim() || null,
    location: command.location?.trim() || null,
  });

  // Evento recorrente não tem datas avulsas (o padrão semanal já cobre a repetição) — persiste
  // zero mesmo que o input traga alguma.
  const extraDates = recurring
    ? []
    : await insertAgendaEventDates(
        record.id,
        (command.extraDates ?? []).map((date) => ({ startAt: date.startAt, endAt: date.endAt ?? null })),
      );

  endOperation(handle, { success: true });
  return { success: true, data: { ...record, extraDates } };
}

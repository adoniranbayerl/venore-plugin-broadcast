import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { applyAgendaEventUpdate, findAgendaEventById, replaceAgendaEventDates } from "./store";
import type { UpdateAgendaEventCommand, UpdateAgendaEventResult } from "./types";

export async function updateAgendaEvent(command: UpdateAgendaEventCommand): Promise<UpdateAgendaEventResult> {
  const handle = beginOperation({
    useCase: "broadcast.update-agenda-event",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const existing = await findAgendaEventById(command.eventId);
  if (!existing) {
    const error = { code: "broadcast.update-agenda-event.not_found", message: "Evento não encontrado." };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  }

  const recurring = command.recurring ?? false;

  // Substitui as datas avulsas ANTES do update do evento — assim applyAgendaEventUpdate relê e
  // devolve o registro já com extraDates coerente. Recorrente zera as datas avulsas.
  await replaceAgendaEventDates(
    command.eventId,
    recurring ? [] : (command.extraDates ?? []).map((date) => ({ startAt: date.startAt, endAt: date.endAt ?? null })),
  );

  const record = await applyAgendaEventUpdate({
    id: command.eventId,
    title: command.title.trim(),
    description: command.description?.trim() || null,
    startAt: command.startAt,
    recurring,
    endAt: command.endAt ?? null,
    coverMediaAssetId: command.coverMediaAssetId?.trim() || null,
    location: command.location?.trim() || null,
  });

  endOperation(handle, { success: true });
  return { success: true, data: record };
}

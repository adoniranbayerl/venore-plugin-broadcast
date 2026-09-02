import { deleteAgendaEventById } from "./store";
import type { DeleteAgendaEventInput, DeleteAgendaEventResult } from "./types";

export async function deleteAgendaEvent(input: DeleteAgendaEventInput): Promise<DeleteAgendaEventResult> {
  const deleted = await deleteAgendaEventById(input.eventId);
  if (!deleted) {
    return { success: false, error: { code: "broadcast.delete-agenda-event.not_found", message: "Evento não encontrado." } };
  }
  return { success: true, data: { id: input.eventId } };
}

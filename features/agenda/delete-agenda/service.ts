import { deleteAgendaById } from "./store";
import type { DeleteAgendaInput, DeleteAgendaResult } from "./types";

export async function deleteAgenda(input: DeleteAgendaInput): Promise<DeleteAgendaResult> {
  const deleted = await deleteAgendaById(input.agendaId);
  if (!deleted) {
    return { success: false, error: { code: "broadcast.delete-agenda.not_found", message: "Agenda não encontrada." } };
  }
  return { success: true, data: { id: input.agendaId } };
}

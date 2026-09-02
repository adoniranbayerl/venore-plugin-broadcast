import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findAgendaById, replaceAgendaEditors } from "./store";
import type { SetAgendaEditorsCommand, SetAgendaEditorsResult } from "./types";

export async function setAgendaEditors(command: SetAgendaEditorsCommand): Promise<SetAgendaEditorsResult> {
  const agenda = await findAgendaById(command.agendaId);
  if (!agenda) {
    return { success: false, error: { code: "broadcast.set-agenda-editors.not_found", message: "Agenda não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-agenda-editors",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  await replaceAgendaEditors(command.agendaId, command.userIds);

  endOperation(handle, { success: true });
  return { success: true, data: { agendaId: command.agendaId, userIds: command.userIds } };
}

import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findAgendaById, replaceAgendaOutputLinks } from "./store";
import type { SetAgendaOutputsCommand, SetAgendaOutputsResult } from "./types";

export async function setAgendaOutputs(command: SetAgendaOutputsCommand): Promise<SetAgendaOutputsResult> {
  const agenda = await findAgendaById(command.agendaId);
  if (!agenda) {
    return { success: false, error: { code: "broadcast.set-agenda-outputs.not_found", message: "Agenda não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-agenda-outputs",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  await replaceAgendaOutputLinks(command.agendaId, command.outputIds);

  endOperation(handle, { success: true });
  return { success: true, data: { agendaId: command.agendaId, outputIds: command.outputIds } };
}

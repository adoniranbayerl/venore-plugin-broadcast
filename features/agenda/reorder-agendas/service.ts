import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findAllAgendas, reorderAgendas } from "./store";
import type { ReorderAgendasCommand, ReorderAgendasResult } from "./types";

export async function reorderAgendasService(command: ReorderAgendasCommand): Promise<ReorderAgendasResult> {
  const handle = beginOperation({
    useCase: "broadcast.reorder-agendas",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const existing = await findAllAgendas();
  const existingIds = new Set(existing.map((agenda) => agenda.id));
  const inputIds = new Set(command.agendaIds);

  const sameSize = existingIds.size === inputIds.size && inputIds.size === command.agendaIds.length;
  const sameMembers = sameSize && command.agendaIds.every((id) => existingIds.has(id));

  if (!sameMembers) {
    const error = {
      code: "broadcast.reorder-agendas.mismatch",
      message: "A lista enviada não corresponde exatamente às agendas cadastradas.",
    };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  }

  const agendas = await reorderAgendas(command.agendaIds);

  endOperation(handle, { success: true });
  return { success: true, data: agendas };
}

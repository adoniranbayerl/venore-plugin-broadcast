import { findAgendaIdsAssignedToUser } from "../../../shared/scoped-authorization";
import { findAllAgendas } from "./store";
import type { ListAgendasResult } from "./types";

// assignedToUserId filtra pra só as agendas atribuídas a este usuário — usado quando o ator só tem
// a permission estreita (broadcast.agenda.manage), não a ampla (broadcast.manage), ver handler.ts.
export async function listAgendas(options?: { assignedToUserId?: string }): Promise<ListAgendasResult> {
  const agendas = await findAllAgendas();
  if (!options?.assignedToUserId) return { success: true, data: agendas };

  const allowedIds = new Set(await findAgendaIdsAssignedToUser(options.assignedToUserId));
  return { success: true, data: agendas.filter((agenda) => allowedIds.has(agenda.id)) };
}

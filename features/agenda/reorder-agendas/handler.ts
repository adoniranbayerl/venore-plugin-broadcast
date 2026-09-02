import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { reorderAgendasService } from "./service";
import type { ReorderAgendasInput, ReorderAgendasResult } from "./types";

// Só broadcast.manage — reordenar a lista GLOBAL de agendas não faz sentido pra um editor restrito
// a uma agenda só (mesmo racional de create-agenda/handler.ts).
export async function reorderAgendasHandler(input: ReorderAgendasInput): Promise<ReorderAgendasResult> {
  if (input.agendaIds.length === 0) {
    return {
      success: false,
      error: { code: "broadcast.reorder-agendas.invalid_agendas", message: "Lista de agendas não pode ser vazia." },
    };
  }

  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return reorderAgendasService({ ...input, actorId: authz.actorId });
}

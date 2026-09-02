import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { deleteAgenda } from "./service";
import type { DeleteAgendaInput, DeleteAgendaResult } from "./types";

// Só broadcast.manage — mesmo racional de create-agenda/handler.ts.
export async function deleteAgendaHandler(input: DeleteAgendaInput): Promise<DeleteAgendaResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return deleteAgenda(input);
}

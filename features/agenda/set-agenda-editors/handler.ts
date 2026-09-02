import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { setAgendaEditors } from "./service";
import type { SetAgendaEditorsInput, SetAgendaEditorsResult } from "./types";

// Só broadcast.manage — decidir quem é responsável por uma agenda é ação de admin, nunca do
// próprio editor atribuído (mesmo racional de set-agenda-outputs/handler.ts).
export async function setAgendaEditorsHandler(input: SetAgendaEditorsInput): Promise<SetAgendaEditorsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setAgendaEditors({ ...input, actorId: authz.actorId });
}

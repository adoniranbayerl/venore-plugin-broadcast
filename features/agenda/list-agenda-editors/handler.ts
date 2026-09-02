import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listAgendaEditors } from "./service";
import type { ListAgendaEditorsResult } from "./types";

export async function listAgendaEditorsHandler(): Promise<ListAgendaEditorsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listAgendaEditors();
}

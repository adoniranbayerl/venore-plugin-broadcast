import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listAgendaOutputs } from "./service";
import type { ListAgendaOutputsResult } from "./types";

export async function listAgendaOutputsHandler(): Promise<ListAgendaOutputsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listAgendaOutputs();
}

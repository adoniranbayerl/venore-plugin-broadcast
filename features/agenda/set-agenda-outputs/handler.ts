import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { setAgendaOutputs } from "./service";
import type { SetAgendaOutputsInput, SetAgendaOutputsResult } from "./types";

export async function setAgendaOutputsHandler(input: SetAgendaOutputsInput): Promise<SetAgendaOutputsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setAgendaOutputs({ ...input, actorId: authz.actorId });
}

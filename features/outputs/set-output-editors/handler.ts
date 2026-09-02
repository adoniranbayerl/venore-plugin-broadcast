import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { setOutputEditors } from "./service";
import type { SetOutputEditorsInput, SetOutputEditorsResult } from "./types";

export async function setOutputEditorsHandler(input: SetOutputEditorsInput): Promise<SetOutputEditorsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputEditors({ ...input, actorId: authz.actorId });
}

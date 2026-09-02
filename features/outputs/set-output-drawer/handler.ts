import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { setOutputDrawer } from "./service";
import type { SetOutputDrawerInput, SetOutputDrawerResult } from "./types";

export async function setOutputDrawerHandler(input: SetOutputDrawerInput): Promise<SetOutputDrawerResult> {
  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputDrawer({ ...input, actorId: authz.actorId });
}

import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { setOutputOffline } from "./service";
import type { SetOutputOfflineInput, SetOutputOfflineResult } from "./types";

export async function setOutputOfflineHandler(input: SetOutputOfflineInput): Promise<SetOutputOfflineResult> {
  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputOffline({ ...input, actorId: authz.actorId });
}

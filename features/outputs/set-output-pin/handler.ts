import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { setOutputPin } from "./service";
import type { SetOutputPinInput, SetOutputPinResult } from "./types";

export async function setOutputPinHandler(input: SetOutputPinInput): Promise<SetOutputPinResult> {
  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputPin({ ...input, actorId: authz.actorId });
}

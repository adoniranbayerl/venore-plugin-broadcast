import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { setOutputFooter } from "./service";
import type { SetOutputFooterInput, SetOutputFooterResult } from "./types";

export async function setOutputFooterHandler(input: SetOutputFooterInput): Promise<SetOutputFooterResult> {
  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputFooter({ ...input, actorId: authz.actorId });
}

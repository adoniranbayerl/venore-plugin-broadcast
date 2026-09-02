import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { setOutputTicker } from "./service";
import type { SetOutputTickerInput, SetOutputTickerResult } from "./types";

export async function setOutputTickerHandler(input: SetOutputTickerInput): Promise<SetOutputTickerResult> {
  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputTicker({ ...input, actorId: authz.actorId });
}

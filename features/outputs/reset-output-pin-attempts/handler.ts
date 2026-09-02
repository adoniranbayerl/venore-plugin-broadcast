import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { resetOutputPinAttempts } from "./service";
import type { ResetOutputPinAttemptsInput, ResetOutputPinAttemptsResult } from "./types";

// Gate igual ao de set-output-pin: broadcast.manage (acesso total) OU broadcast.outputs.manage +
// estar atribuído a esta saída — authorizeOutputActor já cobre os dois casos.
export async function resetOutputPinAttemptsHandler(
  input: ResetOutputPinAttemptsInput,
): Promise<ResetOutputPinAttemptsResult> {
  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return resetOutputPinAttempts(input);
}

import { clearPinAttemptsForToken } from "../../../runtime/pin-attempts";
import { findOutputTokenById } from "./store";
import type { ResetOutputPinAttemptsCommand, ResetOutputPinAttemptsResult } from "./types";

// Sem beginOperation/publishOutputEvent: não muda nada no banco nem no estado da saída — só apaga
// as entradas em memória do limitador de PIN daquele token (todos os IPs). O OperationResult aqui
// existe só pra carregar o erro de "saída não encontrada" no mesmo formato do resto do plugin.
export async function resetOutputPinAttempts(command: ResetOutputPinAttemptsCommand): Promise<ResetOutputPinAttemptsResult> {
  const token = await findOutputTokenById(command.outputId);
  if (!token) {
    return {
      success: false,
      error: { code: "broadcast.reset-output-pin-attempts.not_found", message: "Saída não encontrada." },
    };
  }

  const cleared = clearPinAttemptsForToken(token);
  return { success: true, data: { cleared } };
}

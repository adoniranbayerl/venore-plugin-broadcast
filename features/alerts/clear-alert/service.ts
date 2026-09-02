import { publishOutputEvent } from "../../../runtime/output-bus";
import { findAllOutputTokens } from "../../../shared/output-tokens";
import { expireActiveAlerts } from "./store";
import type { ClearAlertResult } from "./types";

export async function clearAlert(): Promise<ClearAlertResult> {
  const cleared = await expireActiveAlerts();

  // Mesmo racional do publish — alerta é global, então toda TV precisa saber que o lower third
  // saiu da tela agora (~1s), não no próximo poll de 15s. Publica mesmo com cleared === 0: é
  // barato (pub/sub em memória) e cobre a corrida em que o alerta expirou sozinho um instante
  // antes do clear manual.
  const tokens = await findAllOutputTokens();
  for (const token of tokens) publishOutputEvent(token, { type: "alert-changed" });

  return { success: true, data: { cleared } };
}

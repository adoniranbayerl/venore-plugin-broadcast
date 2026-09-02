import { verifyPin } from "../../../shared/pin-hash";
import { findOutputPinByToken } from "./store";
import type { VerifyOutputPinQuery, VerifyOutputPinResult } from "./types";

// Token inexistente não é erro AQUI — quem decide 404 é get-output-state (chamado logo em seguida
// pela mesma rota/página); aqui devolve "não protegida" pra deixar esse fluxo seguir normalmente.
export async function verifyOutputPin(query: VerifyOutputPinQuery): Promise<VerifyOutputPinResult> {
  const output = await findOutputPinByToken(query.token);
  if (!output || !output.pin) {
    return { success: true, data: { required: false, valid: true } };
  }

  // output.pin é um hash `scrypt$...` (gravado por set-output-pin) ou, transitoriamente, um PIN
  // legado em texto plano — verifyPin cobre os dois (ver shared/pin-hash.ts). O valor guardado
  // nunca sai daqui: o resultado só carrega required/valid.
  const valid = typeof query.candidate === "string" && (await verifyPin(query.candidate, output.pin));
  return { success: true, data: { required: true, valid } };
}

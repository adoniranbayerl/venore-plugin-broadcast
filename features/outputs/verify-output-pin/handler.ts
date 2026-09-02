import { verifyOutputPin } from "./service";
import type { VerifyOutputPinQuery, VerifyOutputPinResult } from "./types";

// Sem authorizeActor de propósito — mesmo racional de get-output-state/handler.ts: acesso por
// token, não por sessão. É exatamente o handler que substitui a sessão aqui (PIN opcional).
export async function verifyOutputPinHandler(query: VerifyOutputPinQuery): Promise<VerifyOutputPinResult> {
  return verifyOutputPin(query);
}

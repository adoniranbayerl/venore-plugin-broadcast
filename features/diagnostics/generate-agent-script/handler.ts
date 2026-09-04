import { generateAgentScript } from "./service";
import type { GenerateAgentScriptCommand, GenerateAgentScriptResult } from "./types";

// Sem authorizeActor de propósito — rota pública, aberta direto do navegador do PC da TV (pedido
// explícito: "ela precisa ser pública"), mesmo racional de token de get-output-state/report-*-
// diagnostics. O conteúdo devolvido inclui a chave atual do agent (broadcast.diagnosticsAgentKey)
// — mesmo modelo de ameaça que o token de saída/stream já assumem (LAN local, sem exposição à
// internet, ver manifest.ts).
export async function generateAgentScriptHandler(command: GenerateAgentScriptCommand): Promise<GenerateAgentScriptResult> {
  return generateAgentScript(command);
}

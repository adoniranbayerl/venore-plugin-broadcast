import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { getOutputDiagnostics } from "./service";
import type { GetOutputDiagnosticsResult } from "./types";

// broadcast.manage OU broadcast.outputs.manage — mesmo critério de listOutputs/list-connected-
// output-ips: ver o estado das telas é visão de quem administra as saídas, seja por inteiro ou
// como responsável atribuído (o dado em si não tem recorte por saída específica hoje — quem passa
// aqui vê o diagnóstico de TODAS as saídas, não só as suas; aceitável pro tamanho atual da
// instalação, mesma folga que list-connected-output-ips já tinha em outputs-section.tsx).
export async function getOutputDiagnosticsHandler(): Promise<GetOutputDiagnosticsResult> {
  const fullAccess = await authorizeActor("broadcast.manage");
  if (fullAccess.authorized) return getOutputDiagnostics();

  const outputsAccess = await authorizeActor("broadcast.outputs.manage");
  if (!outputsAccess.authorized) {
    return { success: false, error: outputsAccess.error };
  }

  return getOutputDiagnostics();
}

import { reportAgentDiagnostics } from "./service";
import type { ReportAgentDiagnosticsCommand, ReportAgentDiagnosticsResult } from "./types";

// Sem authorizeActor de propósito — o agent PowerShell roda solto num PC de TV, sem sessão. A
// autenticação é a agentKey (comparada em tempo constante dentro do service), não um login.
export async function reportAgentDiagnosticsHandler(command: ReportAgentDiagnosticsCommand): Promise<ReportAgentDiagnosticsResult> {
  return reportAgentDiagnostics(command);
}

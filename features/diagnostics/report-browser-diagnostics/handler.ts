import { reportBrowserDiagnostics } from "./service";
import type { ReportBrowserDiagnosticsCommand, ReportBrowserDiagnosticsResult } from "./types";

// Sem authorizeActor de propósito — a view de saída (TV) reporta por token, não por sessão. Mesmo
// espírito de get-output-state/handler.ts.
export async function reportBrowserDiagnosticsHandler(command: ReportBrowserDiagnosticsCommand): Promise<ReportBrowserDiagnosticsResult> {
  return reportBrowserDiagnostics(command);
}

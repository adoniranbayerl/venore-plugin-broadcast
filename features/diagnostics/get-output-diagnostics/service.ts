import { sampleServerDiagnostics } from "../../../runtime/diagnostics-bus";
import { findAllOutputDiagnostics } from "./store";
import type { GetOutputDiagnosticsResult } from "./types";

// Browser reporta a cada 20s (DIAGNOSTICS_REPORT_MS em output-canvas.tsx), agent a cada 30s
// (broadcast-diag-agent.ps1) — 3x o intervalo esperado é folga suficiente pra um report atrasado
// isolado não acender "desatualizado" à toa, mas curto o bastante pra pegar de verdade uma TV/PC
// que parou de reportar.
const BROWSER_STALE_MS = 60_000;
const AGENT_STALE_MS = 90_000;

function isStale(reportedAt: Date | null, staleAfterMs: number): boolean {
  if (!reportedAt) return false;
  return Date.now() - reportedAt.getTime() > staleAfterMs;
}

export async function getOutputDiagnostics(): Promise<GetOutputDiagnosticsResult> {
  const rows = await findAllOutputDiagnostics();

  return {
    success: true,
    data: {
      outputs: rows.map((row) => ({
        outputId: row.outputId,
        browserSnapshot: row.browserSnapshot,
        browserReportedAt: row.browserReportedAt,
        browserStale: isStale(row.browserReportedAt, BROWSER_STALE_MS),
        agentSnapshot: row.agentSnapshot,
        agentReportedAt: row.agentReportedAt,
        agentStationLabel: row.agentStationLabel,
        agentStale: isStale(row.agentReportedAt, AGENT_STALE_MS),
      })),
      server: sampleServerDiagnostics(),
    },
  };
}

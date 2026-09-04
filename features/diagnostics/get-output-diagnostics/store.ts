import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputDiagnostics, broadcastOutputs } from "../../../database/schema";
import type { BroadcastAgentDiagnosticsSnapshot, BroadcastBrowserDiagnosticsSnapshot } from "../../../contracts/types";

export type OutputDiagnosticsRow = {
  outputId: string;
  browserSnapshot: BroadcastBrowserDiagnosticsSnapshot | null;
  browserReportedAt: Date | null;
  agentSnapshot: BroadcastAgentDiagnosticsSnapshot | null;
  agentReportedAt: Date | null;
  agentStationLabel: string | null;
};

// LEFT JOIN — toda saída aparece, mesmo sem nenhuma linha de diagnóstico ainda (report_*_at
// null), pro fallback "agent não instalado" ter o que mostrar pra cada tela cadastrada, não só
// pras que já reportaram alguma vez.
export async function findAllOutputDiagnostics(): Promise<OutputDiagnosticsRow[]> {
  const rows = await db
    .select({
      outputId: broadcastOutputs.id,
      browserSnapshot: broadcastOutputDiagnostics.browserSnapshot,
      browserReportedAt: broadcastOutputDiagnostics.browserReportedAt,
      agentSnapshot: broadcastOutputDiagnostics.agentSnapshot,
      agentReportedAt: broadcastOutputDiagnostics.agentReportedAt,
      agentStationLabel: broadcastOutputDiagnostics.agentStationLabel,
    })
    .from(broadcastOutputs)
    .leftJoin(broadcastOutputDiagnostics, eq(broadcastOutputDiagnostics.outputId, broadcastOutputs.id));
  return rows as OutputDiagnosticsRow[];
}

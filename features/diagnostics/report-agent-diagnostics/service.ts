import { timingSafeEqual } from "node:crypto";
import { getSetting } from "@venore/plugin-sdk/settings";
import { BROADCAST_SETTINGS } from "../../../shared/settings";
import { findOutputIdByToken, insertDiagEvent, upsertAgentSnapshot } from "./store";
import type { ReportAgentDiagnosticsCommand, ReportAgentDiagnosticsResult } from "./types";

const CPU_RAM_WARNING_PERCENT = 90;

// Comparação em tempo constante (mesmo racional de segredo compartilhado — não é hash de senha,
// é uma chave só, mas não custa nada evitar vazar tamanho/prefixo por timing). Tamanhos diferentes
// nunca chegam ao timingSafeEqual (ele lança se os buffers não tiverem o mesmo tamanho).
function keysMatch(candidate: string, expected: string): boolean {
  if (candidate.length === 0 || expected.length === 0) return false;
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function reportAgentDiagnostics(command: ReportAgentDiagnosticsCommand): Promise<ReportAgentDiagnosticsResult> {
  const configuredKey = await getSetting({ key: BROADCAST_SETTINGS.diagnosticsAgentKey.key });
  const expectedKey = configuredKey.success && typeof configuredKey.data?.value === "string" ? configuredKey.data.value : "";

  if (!keysMatch(command.agentKey, expectedKey)) {
    return { success: false, error: { code: "broadcast.report-agent-diagnostics.invalid_key", message: "Chave de agent inválida." } };
  }

  const outputId = await findOutputIdByToken(command.outputToken);
  if (!outputId) {
    return { success: false, error: { code: "broadcast.report-agent-diagnostics.not_found", message: "Saída não encontrada." } };
  }

  await upsertAgentSnapshot({ outputId, snapshot: command.snapshot, stationLabel: command.stationLabel?.trim() || null });

  const { cpuLoadPercent, ramUsedPercent } = command.snapshot;
  if (
    (cpuLoadPercent !== null && cpuLoadPercent > CPU_RAM_WARNING_PERCENT) ||
    (ramUsedPercent !== null && ramUsedPercent > CPU_RAM_WARNING_PERCENT)
  ) {
    await insertDiagEvent({
      outputId,
      message: "CPU ou RAM do PC da TV acima de 90%",
      detail: { cpuLoadPercent, ramUsedPercent },
    });
  }

  return { success: true, data: true };
}

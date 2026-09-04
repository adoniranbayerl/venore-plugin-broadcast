import { insertDiagEvent, findOutputIdByToken, upsertBrowserSnapshot } from "./store";
import type { ReportBrowserDiagnosticsCommand, ReportBrowserDiagnosticsResult } from "./types";

// Mesmo limiar do watchdog client-side (VIDEO_DROPPED_RATIO_LIMIT em layer-renderer.tsx) — cruzar
// aqui gera um evento de aviso na tela de diagnóstico, sem precisar de um job separado varrendo o
// banco (ver comentário no schema, broadcast_output_diag_events).
const DROPPED_RATIO_WARNING_THRESHOLD = 0.4;

// Tamanho máximo aceito do snapshot serializado — defesa de borda contra um POST forjado/anômalo
// (o cliente real, output-canvas.tsx, manda um objeto pequeno e fixo); nunca deve na prática chegar
// perto disso.
const MAX_SNAPSHOT_BYTES = 8 * 1024;

export async function reportBrowserDiagnostics(command: ReportBrowserDiagnosticsCommand): Promise<ReportBrowserDiagnosticsResult> {
  if (JSON.stringify(command.snapshot).length > MAX_SNAPSHOT_BYTES) {
    return { success: false, error: { code: "broadcast.report-browser-diagnostics.snapshot_too_large", message: "Snapshot inválido." } };
  }

  const outputId = await findOutputIdByToken(command.token);
  if (!outputId) {
    return { success: false, error: { code: "broadcast.report-browser-diagnostics.not_found", message: "Saída não encontrada." } };
  }

  await upsertBrowserSnapshot({ outputId, snapshot: command.snapshot });

  if (command.snapshot.droppedRatio !== null && command.snapshot.droppedRatio > DROPPED_RATIO_WARNING_THRESHOLD) {
    await insertDiagEvent({
      outputId,
      message: "Vídeo sofrendo travamentos (muitos frames dropados)",
      detail: { droppedRatio: command.snapshot.droppedRatio },
    });
  }

  return { success: true, data: true };
}

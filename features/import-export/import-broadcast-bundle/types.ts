import type { OperationResult } from "@venore/plugin-sdk";
import type { ImportReportOutcome } from "@venore/plugin-sdk/import-export";

// Só os 4 níveis de topo viram linha própria no relatório — falha num evento/item específico vira
// nota anexada à linha da agenda/playlist dona (mesmo padrão de AcademyImportReportLineKind: "uma
// aula ruim não trava as outras", mas a granularidade do relatório é curso/aula, não seção/material
// isolado).
export type BroadcastImportReportLineKind = "media-asset" | "agenda" | "playlist" | "output";

export type BroadcastImportReportLine = {
  kind: BroadcastImportReportLineKind;
  ref: string;
  outcome: ImportReportOutcome;
  message?: string;
};

export type BroadcastImportReport = {
  lines: BroadcastImportReportLine[];
  createdCount: number;
  reusedCount: number;
  skippedCount: number;
  failedCount: number;
};

export type ImportBroadcastBundleCommand = { manifest: unknown; files: Map<string, Buffer>; actorId: string };
export type ImportBroadcastBundleInput = Omit<ImportBroadcastBundleCommand, "actorId">;
export type ImportBroadcastBundleResult = OperationResult<BroadcastImportReport>;

import { buildExportZip } from "@venore/plugin-sdk/import-export";
import type { ExportBroadcastBundleData } from "./types";

// Formata o DTO (manifest + bytes soltos) pro artefato binário de saída (.zip) — quem consome isso
// é a rota de download (routes/api/broadcast-export/route.ts), não o handler em si (mesmo padrão
// de venore-plugin-academy/features/courses/export-course-bundle/view.ts).
export function toExportZip(data: ExportBroadcastBundleData): Buffer {
  return buildExportZip(data.manifest, data.files);
}

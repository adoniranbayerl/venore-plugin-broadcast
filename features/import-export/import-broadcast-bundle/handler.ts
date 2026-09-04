import { parseExportZip } from "@venore/plugin-sdk/import-export";
import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { BROADCAST_BUNDLE_REQUIRED_PERMISSIONS } from "../../../shared/broadcast-bundle-manifest";
import { importBroadcastBundle } from "./service";
import type { ImportBroadcastBundleResult } from "./types";

export type ImportBroadcastBundleHandlerInput = { zipData: Buffer };

// Mesmo gate AND de export-broadcast-bundle (ver comentário lá) — importar grava em broadcast +
// media, exige as mesmas permissions de escrita completas.
export async function importBroadcastBundleHandler(input: ImportBroadcastBundleHandlerInput): Promise<ImportBroadcastBundleResult> {
  let actorId = "";
  for (const permission of BROADCAST_BUNDLE_REQUIRED_PERMISSIONS) {
    const authz = await authorizeActor(permission);
    if (!authz.authorized) {
      return { success: false, error: authz.error };
    }
    actorId = authz.actorId;
  }

  let parsedZip: ReturnType<typeof parseExportZip>;
  try {
    parsedZip = parseExportZip(input.zipData);
  } catch (error) {
    return {
      success: false,
      error: {
        code: "broadcast.import-broadcast-bundle.invalid_zip",
        message: error instanceof Error ? error.message : "Não foi possível ler o arquivo .zip enviado.",
      },
    };
  }

  return importBroadcastBundle({ manifest: parsedZip.manifest, files: parsedZip.files, actorId });
}

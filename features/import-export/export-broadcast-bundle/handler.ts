import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { BROADCAST_BUNDLE_REQUIRED_PERMISSIONS } from "../../../shared/broadcast-bundle-manifest";
import { exportBroadcastBundle } from "./service";
import type { ExportBroadcastBundleResult } from "./types";

// authorizeActor só sabe OR entre uma lista de permissions — exportar o pacote (telas + playlists
// + agenda + mídia) exige TODAS as permissions envolvidas, uma checagem por vez (mesmo padrão de
// venore-plugin-academy/features/courses/export-course-bundle/handler.ts).
export async function exportBroadcastBundleHandler(): Promise<ExportBroadcastBundleResult> {
  for (const permission of BROADCAST_BUNDLE_REQUIRED_PERMISSIONS) {
    const authz = await authorizeActor(permission);
    if (!authz.authorized) {
      return { success: false, error: authz.error };
    }
  }

  return exportBroadcastBundle();
}

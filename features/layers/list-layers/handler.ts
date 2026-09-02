import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listLayers } from "./service";
import type { ListLayersQuery, ListLayersResult } from "./types";

export async function listLayersHandler(query: ListLayersQuery): Promise<ListLayersResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listLayers(query);
}

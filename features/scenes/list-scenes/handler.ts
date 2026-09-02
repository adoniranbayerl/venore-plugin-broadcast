import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listScenes } from "./service";
import type { ListScenesResult } from "./types";

export async function listScenesHandler(): Promise<ListScenesResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listScenes();
}

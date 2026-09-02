import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listPlaylistEditors } from "./service";
import type { ListPlaylistEditorsResult } from "./types";

export async function listPlaylistEditorsHandler(): Promise<ListPlaylistEditorsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listPlaylistEditors();
}

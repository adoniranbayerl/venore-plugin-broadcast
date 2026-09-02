import { authorizePlaylistActor } from "../../../shared/scoped-authorization";
import { scanPlaylistFolder } from "./service";
import type { ScanPlaylistFolderInput, ScanPlaylistFolderResult } from "./types";

export async function scanPlaylistFolderHandler(input: ScanPlaylistFolderInput): Promise<ScanPlaylistFolderResult> {
  const authz = await authorizePlaylistActor(input.playlistId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return scanPlaylistFolder({ ...input, actorId: authz.actorId });
}

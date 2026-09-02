import { authorizePlaylistItemActor } from "../../../shared/scoped-authorization";
import { deletePlaylistItem } from "./service";
import type { DeletePlaylistItemInput, DeletePlaylistItemResult } from "./types";

export async function deletePlaylistItemHandler(input: DeletePlaylistItemInput): Promise<DeletePlaylistItemResult> {
  const authz = await authorizePlaylistItemActor(input.itemId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return deletePlaylistItem(input);
}

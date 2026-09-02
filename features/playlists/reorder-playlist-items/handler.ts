import { authorizePlaylistActor } from "../../../shared/scoped-authorization";
import { reorderPlaylistItemsService } from "./service";
import type { ReorderPlaylistItemsInput, ReorderPlaylistItemsResult } from "./types";

export async function reorderPlaylistItemsHandler(input: ReorderPlaylistItemsInput): Promise<ReorderPlaylistItemsResult> {
  if (!input.playlistId) {
    return { success: false, error: { code: "broadcast.reorder-playlist-items.invalid_playlist", message: "Playlist inválida." } };
  }
  if (input.itemIds.length === 0) {
    return {
      success: false,
      error: { code: "broadcast.reorder-playlist-items.invalid_items", message: "Lista de itens não pode ser vazia." },
    };
  }

  const authz = await authorizePlaylistActor(input.playlistId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return reorderPlaylistItemsService({ ...input, actorId: authz.actorId });
}

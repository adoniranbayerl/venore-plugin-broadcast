import { deletePlaylistItemById } from "./store";
import type { DeletePlaylistItemInput, DeletePlaylistItemResult } from "./types";

export async function deletePlaylistItem(input: DeletePlaylistItemInput): Promise<DeletePlaylistItemResult> {
  const deleted = await deletePlaylistItemById(input.itemId);
  if (!deleted) {
    return {
      success: false,
      error: { code: "broadcast.delete-playlist-item.not_found", message: "Item de playlist não encontrado." },
    };
  }
  return { success: true, data: { id: input.itemId } };
}

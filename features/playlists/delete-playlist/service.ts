import { deletePlaylistById } from "./store";
import type { DeletePlaylistInput, DeletePlaylistResult } from "./types";

export async function deletePlaylist(input: DeletePlaylistInput): Promise<DeletePlaylistResult> {
  const deleted = await deletePlaylistById(input.playlistId);
  if (!deleted) {
    return { success: false, error: { code: "broadcast.delete-playlist.not_found", message: "Playlist não encontrada." } };
  }
  return { success: true, data: { id: input.playlistId } };
}

import type { AddScannedPlaylistItemsInput } from "./types";

export function validateAddScannedPlaylistItemsInput(
  input: AddScannedPlaylistItemsInput,
): { code: string; message: string } | null {
  if (!input.playlistId) {
    return { code: "broadcast.add-scanned-playlist-items.invalid_playlist", message: "Playlist inválida." };
  }
  if (input.relativePaths.length === 0) {
    return { code: "broadcast.add-scanned-playlist-items.invalid_items", message: "Selecione ao menos um vídeo." };
  }
  return null;
}

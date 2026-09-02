import type { AddMediaAssetPlaylistItemInput } from "./types";

export function validateAddMediaAssetPlaylistItemInput(
  input: AddMediaAssetPlaylistItemInput,
): { code: string; message: string } | null {
  if (!input.playlistId) {
    return { code: "broadcast.add-media-asset-playlist-item.invalid_playlist", message: "Playlist inválida." };
  }
  if (!input.mediaAssetId) {
    return { code: "broadcast.add-media-asset-playlist-item.invalid_media", message: "Selecione um arquivo de mídia." };
  }
  return null;
}

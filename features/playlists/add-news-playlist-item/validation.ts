import type { AddNewsPlaylistItemInput } from "./types";

export function validateAddNewsPlaylistItemInput(
  input: AddNewsPlaylistItemInput,
): { code: string; message: string } | null {
  if (!input.playlistId) {
    return { code: "broadcast.add-news-playlist-item.invalid_playlist", message: "Playlist inválida." };
  }
  if (input.durationSeconds !== undefined && input.durationSeconds !== null && !(input.durationSeconds > 0)) {
    return {
      code: "broadcast.add-news-playlist-item.invalid_duration",
      message: "A duração precisa ser um número maior que zero.",
    };
  }
  return null;
}

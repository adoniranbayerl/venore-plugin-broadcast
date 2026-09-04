import { INVALID_WEBPAGE_ROUTE_MESSAGE, isValidInternalWebpageRoute } from "../../../shared/webpage-url";
import type { AddWebpagePlaylistItemInput } from "./types";

export function validateAddWebpagePlaylistItemInput(
  input: AddWebpagePlaylistItemInput,
): { code: string; message: string } | null {
  if (!input.playlistId) {
    return { code: "broadcast.add-webpage-playlist-item.invalid_playlist", message: "Playlist inválida." };
  }
  if (!input.url || !isValidInternalWebpageRoute(input.url.trim())) {
    return { code: "broadcast.add-webpage-playlist-item.invalid_url", message: INVALID_WEBPAGE_ROUTE_MESSAGE };
  }
  if (input.durationSeconds !== undefined && input.durationSeconds !== null && !(input.durationSeconds > 0)) {
    return {
      code: "broadcast.add-webpage-playlist-item.invalid_duration",
      message: "A duração precisa ser um número maior que zero.",
    };
  }
  return null;
}

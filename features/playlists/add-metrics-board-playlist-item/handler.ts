import { authorizePlaylistActor } from "../../../shared/scoped-authorization";
import { addMetricsBoardPlaylistItem } from "./service";
import type { AddMetricsBoardPlaylistItemInput, AddMetricsBoardPlaylistItemResult } from "./types";

export async function addMetricsBoardPlaylistItemHandler(
  input: AddMetricsBoardPlaylistItemInput,
): Promise<AddMetricsBoardPlaylistItemResult> {
  if (!input.playlistId) {
    return { success: false, error: { code: "broadcast.add-metrics-board-playlist-item.invalid_playlist", message: "Playlist inválida." } };
  }
  if (!input.boardToken || input.boardToken.trim().length === 0) {
    return { success: false, error: { code: "broadcast.add-metrics-board-playlist-item.invalid_board", message: "Escolha um painel de métricas." } };
  }
  if (input.durationSeconds !== undefined && input.durationSeconds !== null && !(input.durationSeconds > 0)) {
    return { success: false, error: { code: "broadcast.add-metrics-board-playlist-item.invalid_duration", message: "A duração precisa ser um número maior que zero." } };
  }

  const authz = await authorizePlaylistActor(input.playlistId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return addMetricsBoardPlaylistItem({ ...input, actorId: authz.actorId });
}

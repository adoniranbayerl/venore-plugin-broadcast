import { getMediaAsset } from "@venore/plugin-sdk/media";
import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findMaxPlaylistItemOrder, insertMediaAssetPlaylistItem } from "./store";
import type { AddMediaAssetPlaylistItemCommand, AddMediaAssetPlaylistItemResult } from "./types";

export async function addMediaAssetPlaylistItem(
  command: AddMediaAssetPlaylistItemCommand,
): Promise<AddMediaAssetPlaylistItemResult> {
  const asset = await getMediaAsset({ id: command.mediaAssetId });
  if (!asset.success) {
    return { success: false, error: asset.error };
  }
  if (!asset.data) {
    return {
      success: false,
      error: { code: "broadcast.add-media-asset-playlist-item.not_found", message: "Mídia não encontrada." },
    };
  }
  if (!asset.data.contentType.startsWith("video/") && !asset.data.contentType.startsWith("image/")) {
    return {
      success: false,
      error: {
        code: "broadcast.add-media-asset-playlist-item.unsupported_type",
        message: "O arquivo selecionado precisa ser um vídeo ou uma imagem.",
      },
    };
  }

  const handle = beginOperation({
    useCase: "broadcast.add-media-asset-playlist-item",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const nextOrder = (await findMaxPlaylistItemOrder(command.playlistId)) + 1;
  const record = await insertMediaAssetPlaylistItem({
    playlistId: command.playlistId,
    order: nextOrder,
    title: command.title?.trim() || null,
    mediaAssetId: command.mediaAssetId,
    durationSeconds: command.durationSeconds ?? null,
    withAudio: command.withAudio ?? false,
  });

  endOperation(handle, { success: true });
  return { success: true, data: record };
}

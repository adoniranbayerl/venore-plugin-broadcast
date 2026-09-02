import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findMaxPlaylistItemOrder, insertWebpagePlaylistItem } from "./store";
import type { AddWebpagePlaylistItemCommand, AddWebpagePlaylistItemResult } from "./types";

export async function addWebpagePlaylistItem(command: AddWebpagePlaylistItemCommand): Promise<AddWebpagePlaylistItemResult> {
  const handle = beginOperation({
    useCase: "broadcast.add-webpage-playlist-item",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const nextOrder = (await findMaxPlaylistItemOrder(command.playlistId)) + 1;
  const record = await insertWebpagePlaylistItem({
    playlistId: command.playlistId,
    order: nextOrder,
    title: command.title?.trim() || null,
    url: command.url.trim(),
    durationSeconds: command.durationSeconds ?? null,
    withAudio: command.withAudio ?? false,
  });

  endOperation(handle, { success: true });
  return { success: true, data: record };
}

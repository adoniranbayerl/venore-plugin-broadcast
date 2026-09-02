import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findMaxPlaylistItemOrder, insertNewsPlaylistItem } from "./store";
import type { AddNewsPlaylistItemCommand, AddNewsPlaylistItemResult } from "./types";

export async function addNewsPlaylistItem(command: AddNewsPlaylistItemCommand): Promise<AddNewsPlaylistItemResult> {
  const handle = beginOperation({
    useCase: "broadcast.add-news-playlist-item",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const nextOrder = (await findMaxPlaylistItemOrder(command.playlistId)) + 1;
  const record = await insertNewsPlaylistItem({
    playlistId: command.playlistId,
    order: nextOrder,
    title: command.title?.trim() || null,
    durationSeconds: command.durationSeconds ?? null,
  });

  endOperation(handle, { success: true });
  return { success: true, data: record };
}

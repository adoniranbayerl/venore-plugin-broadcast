import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findPlaylistItemsByPlaylistId, reorderPlaylistItems } from "./store";
import type { ReorderPlaylistItemsCommand, ReorderPlaylistItemsResult } from "./types";

// Mesma validação de "reescreve exatamente o conjunto existente" de academy/reorder-lessons —
// impede a lista enviada de apagar/injetar item por essa rota (só reordena o que já existe).
export async function reorderPlaylistItemsService(command: ReorderPlaylistItemsCommand): Promise<ReorderPlaylistItemsResult> {
  const handle = beginOperation({
    useCase: "broadcast.reorder-playlist-items",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const existing = await findPlaylistItemsByPlaylistId(command.playlistId);
  const existingIds = new Set(existing.map((item) => item.id));
  const inputIds = new Set(command.itemIds);

  const sameSize = existingIds.size === inputIds.size && inputIds.size === command.itemIds.length;
  const sameMembers = sameSize && command.itemIds.every((id) => existingIds.has(id));

  if (!sameMembers) {
    const error = {
      code: "broadcast.reorder-playlist-items.mismatch",
      message: "A lista enviada não corresponde exatamente aos itens desta playlist.",
    };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  }

  const items = await reorderPlaylistItems(command.playlistId, command.itemIds);

  endOperation(handle, { success: true });
  return { success: true, data: items };
}

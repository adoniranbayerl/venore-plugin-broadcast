import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findAgendaEventById, findMaxPlaylistItemOrder, insertAgendaEventPlaylistItem } from "./store";
import type { AddAgendaEventPlaylistItemCommand, AddAgendaEventPlaylistItemResult } from "./types";

export async function addAgendaEventPlaylistItem(
  command: AddAgendaEventPlaylistItemCommand,
): Promise<AddAgendaEventPlaylistItemResult> {
  const event = await findAgendaEventById(command.agendaEventId);
  if (!event) {
    return {
      success: false,
      error: { code: "broadcast.add-agenda-event-playlist-item.not_found", message: "Evento não encontrado." },
    };
  }

  const handle = beginOperation({
    useCase: "broadcast.add-agenda-event-playlist-item",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const nextOrder = (await findMaxPlaylistItemOrder(command.playlistId)) + 1;
  const record = await insertAgendaEventPlaylistItem({
    playlistId: command.playlistId,
    order: nextOrder,
    title: command.title?.trim() || null,
    agendaEventId: command.agendaEventId,
    durationSeconds: command.durationSeconds ?? null,
  });

  endOperation(handle, { success: true });
  return { success: true, data: record };
}

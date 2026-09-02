import type { AddAgendaEventPlaylistItemInput } from "./types";

export function validateAddAgendaEventPlaylistItemInput(
  input: AddAgendaEventPlaylistItemInput,
): { code: string; message: string } | null {
  if (!input.playlistId) {
    return { code: "broadcast.add-agenda-event-playlist-item.invalid_playlist", message: "Playlist inválida." };
  }
  if (!input.agendaEventId) {
    return { code: "broadcast.add-agenda-event-playlist-item.invalid_event", message: "Selecione um evento da agenda." };
  }
  if (input.durationSeconds !== undefined && input.durationSeconds !== null && !(input.durationSeconds > 0)) {
    return {
      code: "broadcast.add-agenda-event-playlist-item.invalid_duration",
      message: "A duração precisa ser um número maior que zero.",
    };
  }
  return null;
}

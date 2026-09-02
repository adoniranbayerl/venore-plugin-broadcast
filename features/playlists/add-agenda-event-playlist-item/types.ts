import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type AddAgendaEventPlaylistItemCommand = {
  playlistId: string;
  agendaEventId: string;
  title?: string | null;
  durationSeconds?: number | null;
  actorId: string;
};

export type AddAgendaEventPlaylistItemInput = Omit<AddAgendaEventPlaylistItemCommand, "actorId">;
export type AddAgendaEventPlaylistItemResult = OperationResult<BroadcastPlaylistItemRecord>;

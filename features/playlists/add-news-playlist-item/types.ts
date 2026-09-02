import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type AddNewsPlaylistItemCommand = {
  playlistId: string;
  title?: string | null;
  durationSeconds?: number | null;
  actorId: string;
};

export type AddNewsPlaylistItemInput = Omit<AddNewsPlaylistItemCommand, "actorId">;
export type AddNewsPlaylistItemResult = OperationResult<BroadcastPlaylistItemRecord>;

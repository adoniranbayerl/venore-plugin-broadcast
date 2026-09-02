import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type AddScannedPlaylistItemsCommand = { playlistId: string; relativePaths: string[]; actorId: string };
export type AddScannedPlaylistItemsInput = Omit<AddScannedPlaylistItemsCommand, "actorId">;
export type AddScannedPlaylistItemsResult = OperationResult<BroadcastPlaylistItemRecord[]>;

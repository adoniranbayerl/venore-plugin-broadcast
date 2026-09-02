import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type ReorderPlaylistItemsCommand = { playlistId: string; itemIds: string[]; actorId: string };
export type ReorderPlaylistItemsInput = Omit<ReorderPlaylistItemsCommand, "actorId">;
export type ReorderPlaylistItemsResult = OperationResult<BroadcastPlaylistItemRecord[]>;

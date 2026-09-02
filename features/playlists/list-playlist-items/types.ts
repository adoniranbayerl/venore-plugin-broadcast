import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type ListPlaylistItemsQuery = { playlistId: string };
export type ListPlaylistItemsResult = OperationResult<BroadcastPlaylistItemRecord[]>;

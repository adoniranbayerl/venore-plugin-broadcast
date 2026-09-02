import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistRecord } from "../../../contracts/types";

export type ListPlaylistsResult = OperationResult<BroadcastPlaylistRecord[]>;

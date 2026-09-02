import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type TogglePlaylistItemVisibilityInput = { itemId: string; hidden: boolean };
export type TogglePlaylistItemVisibilityResult = OperationResult<BroadcastPlaylistItemRecord>;

import type { OperationResult } from "@venore/plugin-sdk";

export type DeletePlaylistItemInput = { itemId: string };
export type DeletePlaylistItemResult = OperationResult<{ id: string }>;

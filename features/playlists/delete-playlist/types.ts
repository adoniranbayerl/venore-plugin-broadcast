import type { OperationResult } from "@venore/plugin-sdk";

export type DeletePlaylistInput = { playlistId: string };
export type DeletePlaylistResult = OperationResult<{ id: string }>;

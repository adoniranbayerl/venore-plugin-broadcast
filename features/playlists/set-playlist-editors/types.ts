import type { OperationResult } from "@venore/plugin-sdk";

export type SetPlaylistEditorsCommand = { playlistId: string; userIds: string[]; actorId: string };
export type SetPlaylistEditorsInput = Omit<SetPlaylistEditorsCommand, "actorId">;
export type SetPlaylistEditorsResult = OperationResult<{ playlistId: string; userIds: string[] }>;

import type { OperationResult } from "@venore/plugin-sdk";

// Record<playlistId, userId[]> — lista vazia pra uma playlist significa "sem responsável atribuído".
export type ListPlaylistEditorsResult = OperationResult<Record<string, string[]>>;

import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type AddWebpagePlaylistItemCommand = {
  playlistId: string;
  url: string;
  title?: string | null;
  durationSeconds?: number | null;
  // Adiciona allow="autoplay" ao <iframe> na view — a página embutida pode tocar áudio sozinha.
  withAudio?: boolean;
  actorId: string;
};

export type AddWebpagePlaylistItemInput = Omit<AddWebpagePlaylistItemCommand, "actorId">;
export type AddWebpagePlaylistItemResult = OperationResult<BroadcastPlaylistItemRecord>;

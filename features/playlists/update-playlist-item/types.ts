import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type UpdatePlaylistItemCommand = {
  itemId: string;
  title?: string | null;
  durationSeconds?: number | null;
  // Só tem efeito em item sourceType "webpage" — ignorado (não sobrescreve) pra local/media-
  // asset/news, cujo url é sempre null por definição (CHECK de forma no schema).
  url?: string | null;
  // Só relevante pra item de vídeo e "webpage" — undefined = não altera.
  withAudio?: boolean;
  actorId: string;
};

export type UpdatePlaylistItemInput = Omit<UpdatePlaylistItemCommand, "actorId">;
export type UpdatePlaylistItemResult = OperationResult<BroadcastPlaylistItemRecord>;

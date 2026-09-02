import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type AddMediaAssetPlaylistItemCommand = {
  playlistId: string;
  mediaAssetId: string;
  title?: string | null;
  // Só faz diferença quando o asset é imagem (vídeo usa a duração natural do arquivo) — ver
  // get-output-state pra como isso é lido de volta.
  durationSeconds?: number | null;
  // Só tem efeito quando o asset é vídeo — toca com som na view em vez de sair mudo.
  withAudio?: boolean;
  actorId: string;
};

export type AddMediaAssetPlaylistItemInput = Omit<AddMediaAssetPlaylistItemCommand, "actorId">;
export type AddMediaAssetPlaylistItemResult = OperationResult<BroadcastPlaylistItemRecord>;

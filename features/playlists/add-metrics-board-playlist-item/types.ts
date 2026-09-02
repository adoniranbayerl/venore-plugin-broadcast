import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export type AddMetricsBoardPlaylistItemCommand = {
  playlistId: string;
  // Token de um tv_board do plugin company-metrics (§9.3). A URL é derivada dele.
  boardToken: string;
  title?: string | null;
  durationSeconds?: number | null;
  actorId: string;
};

export type AddMetricsBoardPlaylistItemInput = Omit<AddMetricsBoardPlaylistItemCommand, "actorId">;
export type AddMetricsBoardPlaylistItemResult = OperationResult<BroadcastPlaylistItemRecord>;

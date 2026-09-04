import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";
import type { PlaylistFolderScanKind } from "../scan-playlist-folder/types";

export type AddScannedPlaylistItemsCommand = {
  playlistId: string;
  kind: PlaylistFolderScanKind;
  relativePaths: string[];
  actorId: string;
};
export type AddScannedPlaylistItemsInput = Omit<AddScannedPlaylistItemsCommand, "actorId">;
export type AddScannedPlaylistItemsResult = OperationResult<BroadcastPlaylistItemRecord[]>;

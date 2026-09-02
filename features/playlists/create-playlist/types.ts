import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastPlaylistRecord } from "../../../contracts/types";

export type CreatePlaylistCommand = {
  name: string;
  actorId: string;
};

export type CreatePlaylistInput = Omit<CreatePlaylistCommand, "actorId">;
export type CreatePlaylistResult = OperationResult<BroadcastPlaylistRecord>;

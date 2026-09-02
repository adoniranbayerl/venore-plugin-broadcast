import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export type SetOutputPlaylistCommand = { outputId: string; playlistId: string; actorId: string };
export type SetOutputPlaylistInput = Omit<SetOutputPlaylistCommand, "actorId">;
export type SetOutputPlaylistResult = OperationResult<BroadcastOutputRecord>;

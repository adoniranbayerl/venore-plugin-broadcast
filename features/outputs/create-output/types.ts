import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export type CreateOutputCommand = { name: string; playlistId: string; actorId: string };
export type CreateOutputInput = Omit<CreateOutputCommand, "actorId">;
export type CreateOutputResult = OperationResult<BroadcastOutputRecord>;

import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export type SetOutputOfflineCommand = { outputId: string; offline: boolean; actorId: string };
export type SetOutputOfflineInput = Omit<SetOutputOfflineCommand, "actorId">;
export type SetOutputOfflineResult = OperationResult<BroadcastOutputRecord>;

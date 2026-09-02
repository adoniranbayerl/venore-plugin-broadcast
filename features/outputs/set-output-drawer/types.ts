import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export type SetOutputDrawerCommand = { outputId: string; drawerOpen: boolean; actorId: string };
export type SetOutputDrawerInput = Omit<SetOutputDrawerCommand, "actorId">;
export type SetOutputDrawerResult = OperationResult<BroadcastOutputRecord>;

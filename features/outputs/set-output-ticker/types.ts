import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export type SetOutputTickerCommand = { outputId: string; tickerEnabled: boolean; actorId: string };
export type SetOutputTickerInput = Omit<SetOutputTickerCommand, "actorId">;
export type SetOutputTickerResult = OperationResult<BroadcastOutputRecord>;

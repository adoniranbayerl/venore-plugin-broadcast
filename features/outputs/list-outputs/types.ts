import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export type ListOutputsResult = OperationResult<BroadcastOutputRecord[]>;

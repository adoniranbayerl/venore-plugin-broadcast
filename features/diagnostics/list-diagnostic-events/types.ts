import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastDiagEventRecord } from "../../../contracts/types";

export type ListDiagnosticEventsResult = OperationResult<BroadcastDiagEventRecord[]>;

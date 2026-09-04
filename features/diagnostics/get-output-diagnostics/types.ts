import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputDiagnosticsRecord, BroadcastServerDiagnosticsSnapshot } from "../../../contracts/types";

export type GetOutputDiagnosticsResult = OperationResult<{
  outputs: BroadcastOutputDiagnosticsRecord[];
  server: BroadcastServerDiagnosticsSnapshot;
}>;

import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastAgentDiagnosticsSnapshot } from "../../../contracts/types";

export type ReportAgentDiagnosticsCommand = {
  agentKey: string;
  outputToken: string;
  stationLabel?: string;
  snapshot: BroadcastAgentDiagnosticsSnapshot;
};
export type ReportAgentDiagnosticsResult = OperationResult<true>;

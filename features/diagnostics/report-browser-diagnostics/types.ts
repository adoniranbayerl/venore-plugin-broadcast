import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastBrowserDiagnosticsSnapshot } from "../../../contracts/types";

export type ReportBrowserDiagnosticsCommand = { token: string; snapshot: BroadcastBrowserDiagnosticsSnapshot };
export type ReportBrowserDiagnosticsResult = OperationResult<true>;

import type { OperationResult } from "@venore/plugin-sdk";

export type GenerateAgentScriptCommand = { token: string; serverUrl: string };
export type GenerateAgentScriptResult = OperationResult<{ filename: string; content: string }>;

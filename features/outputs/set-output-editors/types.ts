import type { OperationResult } from "@venore/plugin-sdk";

export type SetOutputEditorsCommand = { outputId: string; userIds: string[]; actorId: string };
export type SetOutputEditorsInput = Omit<SetOutputEditorsCommand, "actorId">;
export type SetOutputEditorsResult = OperationResult<{ outputId: string; userIds: string[] }>;

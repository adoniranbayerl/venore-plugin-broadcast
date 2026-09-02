import type { OperationResult } from "@venore/plugin-sdk";

export type DeleteOutputInput = { outputId: string };
export type DeleteOutputResult = OperationResult<{ id: string }>;

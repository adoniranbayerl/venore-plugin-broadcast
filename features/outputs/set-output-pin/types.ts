import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

// pin=null remove a proteção da saída (comportamento anterior, sem PIN).
export type SetOutputPinCommand = { outputId: string; pin: string | null; actorId: string };
export type SetOutputPinInput = Omit<SetOutputPinCommand, "actorId">;
export type SetOutputPinResult = OperationResult<BroadcastOutputRecord>;

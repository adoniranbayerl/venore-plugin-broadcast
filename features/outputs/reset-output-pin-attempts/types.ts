import type { OperationResult } from "@venore/plugin-sdk";

// Zera o limitador de tentativas de PIN (runtime/pin-attempts.ts) de uma saída — todas as
// combinações token+IP dela de uma vez.
export type ResetOutputPinAttemptsCommand = { outputId: string };
export type ResetOutputPinAttemptsInput = ResetOutputPinAttemptsCommand;
// data.cleared = quantas entradas (IPs) foram limpas — só pro toast do admin. O contador é em
// memória; o service não faz I/O além de resolver o token da saída.
export type ResetOutputPinAttemptsResult = OperationResult<{ cleared: number }>;

import type { OperationResult } from "@venore/plugin-sdk";

export type VerifyOutputPinQuery = { token: string; candidate?: string | null };

// required=false quando a saída não tem PIN configurado (não protegida) — valid é sempre true
// nesse caso, independente de candidate. required=true + valid=false é o único caso que deve
// bloquear acesso (ver routes/out/page.tsx e as rotas de API de output-state/output-events).
export type VerifyOutputPinData = { required: boolean; valid: boolean };
export type VerifyOutputPinResult = OperationResult<VerifyOutputPinData>;

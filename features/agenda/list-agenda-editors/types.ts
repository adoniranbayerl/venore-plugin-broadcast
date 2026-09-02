import type { OperationResult } from "@venore/plugin-sdk";

// Record<agendaId, userId[]> — lista vazia pra uma agenda significa "sem responsável atribuído".
export type ListAgendaEditorsResult = OperationResult<Record<string, string[]>>;

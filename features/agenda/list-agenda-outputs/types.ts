import type { OperationResult } from "@venore/plugin-sdk";

// Record<agendaId, outputId[]> — lista vazia pra uma agenda significa "sem vínculo, não aparece
// em nenhuma saída" (modelo opt-in, ver comentário no schema).
export type ListAgendaOutputsResult = OperationResult<Record<string, string[]>>;

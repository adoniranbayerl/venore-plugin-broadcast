import type { OperationResult } from "@venore/plugin-sdk";

export type DeleteAgendaInput = { agendaId: string };
export type DeleteAgendaResult = OperationResult<{ id: string }>;

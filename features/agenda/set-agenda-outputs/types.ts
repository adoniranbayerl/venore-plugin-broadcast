import type { OperationResult } from "@venore/plugin-sdk";

export type SetAgendaOutputsCommand = { agendaId: string; outputIds: string[]; actorId: string };
export type SetAgendaOutputsInput = Omit<SetAgendaOutputsCommand, "actorId">;
export type SetAgendaOutputsResult = OperationResult<{ agendaId: string; outputIds: string[] }>;

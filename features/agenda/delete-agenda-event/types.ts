import type { OperationResult } from "@venore/plugin-sdk";

export type DeleteAgendaEventInput = { eventId: string };
export type DeleteAgendaEventResult = OperationResult<{ id: string }>;

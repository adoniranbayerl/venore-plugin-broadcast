import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastAgendaEventRecord } from "../../../contracts/types";

export type ListAgendaEventsResult = OperationResult<BroadcastAgendaEventRecord[]>;

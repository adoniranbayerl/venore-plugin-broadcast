import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

export type ListAgendasResult = OperationResult<BroadcastAgendaRecord[]>;

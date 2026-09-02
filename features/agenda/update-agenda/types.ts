import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

export type UpdateAgendaCommand = {
  agendaId: string;
  name: string;
  displaySeconds: number;
  backgroundColor?: string | null;
  logoMediaAssetId?: string | null;
  actorId: string;
};

export type UpdateAgendaInput = Omit<UpdateAgendaCommand, "actorId">;
export type UpdateAgendaResult = OperationResult<BroadcastAgendaRecord>;

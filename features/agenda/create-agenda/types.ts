import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

export type CreateAgendaCommand = {
  name: string;
  displaySeconds?: number;
  backgroundColor?: string | null;
  logoMediaAssetId?: string | null;
  actorId: string;
};
export type CreateAgendaInput = Omit<CreateAgendaCommand, "actorId">;
export type CreateAgendaResult = OperationResult<BroadcastAgendaRecord>;

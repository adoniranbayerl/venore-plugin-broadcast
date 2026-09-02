import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastOutputRecord } from "../../../contracts/types";

// Ciclo fixo, não mais "pausa depois de cada agenda" (round anterior) — pedido explícito: "quero
// escolher quando essa pausa acontece [...] deixar a agenda aberta por uns 3 min, depois 1 min de
// pausa". agendaOpenSeconds é quanto tempo a coluna fica aberta (rodízio interno da AgendaLayer
// roda livre por dentro dessa janela, sem relação com o número de agendas ou o displaySeconds de
// cada uma); agendaPauseSeconds é quanto tempo fica fechada antes de reabrir. Os dois precisam
// estar preenchidos (>0) pro ciclo ligar — qualquer um null/0 desliga o ciclo inteiro, volta ao
// rodízio contínuo (comportamento original, sem pausa nenhuma).
export type SetOutputAgendaScheduleCommand = {
  outputId: string;
  agendaOpenSeconds: number | null;
  agendaPauseSeconds: number | null;
  actorId: string;
};
export type SetOutputAgendaScheduleInput = Omit<SetOutputAgendaScheduleCommand, "actorId">;
export type SetOutputAgendaScheduleResult = OperationResult<BroadcastOutputRecord>;

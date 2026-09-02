import { db } from "@venore/plugin-sdk";
import { broadcastOutputAgendas } from "../../../database/schema";

export async function findAllOutputAgendaLinks(): Promise<{ outputId: string; agendaId: string }[]> {
  return db.select({ outputId: broadcastOutputAgendas.outputId, agendaId: broadcastOutputAgendas.agendaId }).from(broadcastOutputAgendas);
}

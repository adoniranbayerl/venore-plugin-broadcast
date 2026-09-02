import { db } from "@venore/plugin-sdk";
import { broadcastAgendaEditors } from "../../../database/schema";

export async function findAllAgendaEditorLinks(): Promise<{ agendaId: string; userId: string }[]> {
  return db.select({ agendaId: broadcastAgendaEditors.agendaId, userId: broadcastAgendaEditors.userId }).from(broadcastAgendaEditors);
}

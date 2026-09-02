import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendaEditors, broadcastAgendas } from "../../../database/schema";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

export async function findAgendaById(id: string): Promise<BroadcastAgendaRecord | null> {
  const [row] = await db.select().from(broadcastAgendas).where(eq(broadcastAgendas.id, id)).limit(1);
  return (row as BroadcastAgendaRecord) ?? null;
}

// Substitui o conjunto inteiro de responsáveis desta agenda — mesmo padrão de
// set-agenda-outputs/store.ts (replaceAgendaOutputLinks). userIds=[] é um estado válido: "esta
// agenda não tem responsável nenhum atribuído" (broadcast.manage continua editando normalmente,
// só quem só tem broadcast.agenda.manage fica sem acesso até alguém ser atribuído).
export async function replaceAgendaEditors(agendaId: string, userIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(broadcastAgendaEditors).where(eq(broadcastAgendaEditors.agendaId, agendaId));
    if (userIds.length > 0) {
      await tx.insert(broadcastAgendaEditors).values(userIds.map((userId) => ({ agendaId, userId })));
    }
  });
}

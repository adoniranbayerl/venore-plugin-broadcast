import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendas, broadcastOutputAgendas } from "../../../database/schema";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

export async function findAgendaById(id: string): Promise<BroadcastAgendaRecord | null> {
  const [row] = await db.select().from(broadcastAgendas).where(eq(broadcastAgendas.id, id)).limit(1);
  return (row as BroadcastAgendaRecord) ?? null;
}

// Substitui o conjunto inteiro de vínculos desta agenda (apaga todos, insere os novos) — mesmo
// padrão de "reenviar a lista inteira" das features de reorder, só que aqui o "conjunto" é
// outputIds em vez de uma ordem. outputIds=[] é um estado válido: "esta agenda não aparece em
// nenhuma saída" (modelo opt-in, ver comentário no schema).
export async function replaceAgendaOutputLinks(agendaId: string, outputIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(broadcastOutputAgendas).where(eq(broadcastOutputAgendas.agendaId, agendaId));
    if (outputIds.length > 0) {
      await tx.insert(broadcastOutputAgendas).values(outputIds.map((outputId) => ({ outputId, agendaId })));
    }
  });
}

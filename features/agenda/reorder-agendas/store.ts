import { asc, eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendas } from "../../../database/schema";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

export async function findAllAgendas(): Promise<BroadcastAgendaRecord[]> {
  const rows = await db
    .select()
    .from(broadcastAgendas)
    .orderBy(asc(broadcastAgendas.order), asc(broadcastAgendas.createdAt), asc(broadcastAgendas.id));
  return rows as BroadcastAgendaRecord[];
}

export async function reorderAgendas(orderedIds: string[]): Promise<BroadcastAgendaRecord[]> {
  return db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(broadcastAgendas)
        .set({ order: index, updatedAt: sql`now()` })
        .where(eq(broadcastAgendas.id, id));
    }

    const rows = await tx
      .select()
      .from(broadcastAgendas)
      .orderBy(asc(broadcastAgendas.order), asc(broadcastAgendas.createdAt), asc(broadcastAgendas.id));
    return rows as BroadcastAgendaRecord[];
  });
}

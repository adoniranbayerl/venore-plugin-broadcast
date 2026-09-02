import { eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendas } from "../../../database/schema";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

export async function findAgendaById(id: string): Promise<BroadcastAgendaRecord | null> {
  const [row] = await db.select().from(broadcastAgendas).where(eq(broadcastAgendas.id, id)).limit(1);
  return (row as BroadcastAgendaRecord) ?? null;
}

export async function applyAgendaUpdate(input: {
  id: string;
  name: string;
  displaySeconds: number;
  backgroundColor: string | null;
  logoMediaAssetId: string | null;
}): Promise<BroadcastAgendaRecord> {
  const [row] = await db
    .update(broadcastAgendas)
    .set({
      name: input.name,
      displaySeconds: input.displaySeconds,
      backgroundColor: input.backgroundColor,
      logoMediaAssetId: input.logoMediaAssetId,
      updatedAt: sql`now()`,
    })
    .where(eq(broadcastAgendas.id, input.id))
    .returning();
  return row as BroadcastAgendaRecord;
}

import { eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputs } from "../../../database/schema";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export async function findOutputById(id: string): Promise<BroadcastOutputRecord | null> {
  const [row] = await db.select().from(broadcastOutputs).where(eq(broadcastOutputs.id, id)).limit(1);
  return (row as BroadcastOutputRecord) ?? null;
}

export async function applyOutputAgendaSchedule(input: {
  id: string;
  agendaOpenSeconds: number | null;
  agendaPauseSeconds: number | null;
}): Promise<BroadcastOutputRecord> {
  const [row] = await db
    .update(broadcastOutputs)
    .set({ agendaOpenSeconds: input.agendaOpenSeconds, agendaPauseSeconds: input.agendaPauseSeconds, updatedAt: sql`now()` })
    .where(eq(broadcastOutputs.id, input.id))
    .returning();
  return row as BroadcastOutputRecord;
}

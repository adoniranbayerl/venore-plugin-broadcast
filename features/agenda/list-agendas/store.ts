import { asc } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendas } from "../../../database/schema";
import type { BroadcastAgendaRecord } from "../../../contracts/types";

// Desempate por createdAt/id depois de order — mesmo racional de
// get-output-state/store.ts:findAllAgendas.
export async function findAllAgendas(): Promise<BroadcastAgendaRecord[]> {
  const rows = await db
    .select()
    .from(broadcastAgendas)
    .orderBy(asc(broadcastAgendas.order), asc(broadcastAgendas.createdAt), asc(broadcastAgendas.id));
  return rows as BroadcastAgendaRecord[];
}

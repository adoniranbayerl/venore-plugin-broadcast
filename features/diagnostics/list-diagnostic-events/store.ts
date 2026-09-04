import { desc } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputDiagEvents } from "../../../database/schema";
import type { BroadcastDiagEventRecord } from "../../../contracts/types";

const EVENTS_LIMIT = 100;

export async function findRecentDiagEvents(): Promise<BroadcastDiagEventRecord[]> {
  const rows = await db.select().from(broadcastOutputDiagEvents).orderBy(desc(broadcastOutputDiagEvents.createdAt)).limit(EVENTS_LIMIT);
  return rows as BroadcastDiagEventRecord[];
}

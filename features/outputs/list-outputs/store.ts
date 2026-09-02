import { asc } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputs } from "../../../database/schema";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export async function findAllOutputs(): Promise<BroadcastOutputRecord[]> {
  const rows = await db.select().from(broadcastOutputs).orderBy(asc(broadcastOutputs.name));
  return rows as BroadcastOutputRecord[];
}

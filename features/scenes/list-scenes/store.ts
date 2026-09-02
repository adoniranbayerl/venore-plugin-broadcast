import { asc } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastScenes } from "../../../database/schema";
import type { BroadcastSceneRecord } from "../../../contracts/types";

export async function findAllScenes(): Promise<BroadcastSceneRecord[]> {
  const rows = await db.select().from(broadcastScenes).orderBy(asc(broadcastScenes.order));
  return rows as BroadcastSceneRecord[];
}

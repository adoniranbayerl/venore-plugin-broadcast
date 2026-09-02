import { asc, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastLayers } from "../../../database/schema";
import type { BroadcastLayerRecord } from "../../../contracts/types";

export async function findLayersBySceneId(sceneId: string): Promise<BroadcastLayerRecord[]> {
  const rows = await db
    .select()
    .from(broadcastLayers)
    .where(eq(broadcastLayers.sceneId, sceneId))
    .orderBy(asc(broadcastLayers.zIndex));
  return rows as BroadcastLayerRecord[];
}

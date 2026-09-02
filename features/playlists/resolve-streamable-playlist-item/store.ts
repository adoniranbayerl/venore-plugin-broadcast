import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistItems } from "../../../database/schema";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export async function findPlaylistItemById(id: string): Promise<BroadcastPlaylistItemRecord | null> {
  const [row] = await db.select().from(broadcastPlaylistItems).where(eq(broadcastPlaylistItems.id, id)).limit(1);
  return (row as BroadcastPlaylistItemRecord) ?? null;
}

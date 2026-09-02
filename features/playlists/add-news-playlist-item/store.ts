import { desc, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistItems } from "../../../database/schema";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export async function findMaxPlaylistItemOrder(playlistId: string): Promise<number> {
  const [row] = await db
    .select({ order: broadcastPlaylistItems.order })
    .from(broadcastPlaylistItems)
    .where(eq(broadcastPlaylistItems.playlistId, playlistId))
    .orderBy(desc(broadcastPlaylistItems.order))
    .limit(1);
  return row?.order ?? -1;
}

export async function insertNewsPlaylistItem(input: {
  playlistId: string;
  order: number;
  title: string | null;
  durationSeconds: number | null;
}): Promise<BroadcastPlaylistItemRecord> {
  const [row] = await db
    .insert(broadcastPlaylistItems)
    .values({ ...input, sourceType: "news", relativePath: null, mediaAssetId: null, url: null })
    .returning();
  return row as BroadcastPlaylistItemRecord;
}

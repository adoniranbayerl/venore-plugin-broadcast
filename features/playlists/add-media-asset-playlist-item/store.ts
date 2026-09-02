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

export async function insertMediaAssetPlaylistItem(input: {
  playlistId: string;
  order: number;
  title: string | null;
  mediaAssetId: string;
  durationSeconds: number | null;
  withAudio: boolean;
}): Promise<BroadcastPlaylistItemRecord> {
  const [row] = await db
    .insert(broadcastPlaylistItems)
    .values({ ...input, sourceType: "media-asset", relativePath: null, url: null })
    .returning();
  return row as BroadcastPlaylistItemRecord;
}

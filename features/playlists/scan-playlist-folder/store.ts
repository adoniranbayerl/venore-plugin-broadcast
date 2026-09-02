import { and, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistItems, broadcastPlaylists } from "../../../database/schema";
import type { BroadcastPlaylistItemRecord, BroadcastPlaylistRecord } from "../../../contracts/types";

export async function findPlaylistById(id: string): Promise<BroadcastPlaylistRecord | null> {
  const [row] = await db.select().from(broadcastPlaylists).where(eq(broadcastPlaylists.id, id)).limit(1);
  return (row as BroadcastPlaylistRecord) ?? null;
}

export async function findLocalPlaylistItemsByPlaylistId(playlistId: string): Promise<BroadcastPlaylistItemRecord[]> {
  const rows = await db
    .select()
    .from(broadcastPlaylistItems)
    .where(and(eq(broadcastPlaylistItems.playlistId, playlistId), eq(broadcastPlaylistItems.sourceType, "local")));
  return rows as BroadcastPlaylistItemRecord[];
}

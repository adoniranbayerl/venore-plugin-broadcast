import { asc, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistItems } from "../../../database/schema";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

// Desempate por createdAt/id depois de order — mesmo racional de
// get-output-state/store.ts:findVisiblePlaylistItemsByPlaylistId (empate em order sem ORDER BY
// secundário deixa a ordem instável entre leituras).
export async function findPlaylistItemsByPlaylistId(playlistId: string): Promise<BroadcastPlaylistItemRecord[]> {
  const rows = await db
    .select()
    .from(broadcastPlaylistItems)
    .where(eq(broadcastPlaylistItems.playlistId, playlistId))
    .orderBy(asc(broadcastPlaylistItems.order), asc(broadcastPlaylistItems.createdAt), asc(broadcastPlaylistItems.id));
  return rows as BroadcastPlaylistItemRecord[];
}

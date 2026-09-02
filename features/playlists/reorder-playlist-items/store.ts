import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistItems } from "../../../database/schema";
import type { BroadcastPlaylistItemRecord } from "../../../contracts/types";

export async function findPlaylistItemsByPlaylistId(playlistId: string): Promise<BroadcastPlaylistItemRecord[]> {
  const rows = await db
    .select()
    .from(broadcastPlaylistItems)
    .where(eq(broadcastPlaylistItems.playlistId, playlistId))
    .orderBy(asc(broadcastPlaylistItems.order), asc(broadcastPlaylistItems.createdAt), asc(broadcastPlaylistItems.id));
  return rows as BroadcastPlaylistItemRecord[];
}

// Sem índice único em (playlistId, order) hoje (diferente de academy.lessons), então não precisa
// da dança de duas fases (posição negativa temporária) — grava a posição final direto.
export async function reorderPlaylistItems(playlistId: string, orderedIds: string[]): Promise<BroadcastPlaylistItemRecord[]> {
  return db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(broadcastPlaylistItems)
        .set({ order: index, updatedAt: sql`now()` })
        .where(and(eq(broadcastPlaylistItems.id, id), eq(broadcastPlaylistItems.playlistId, playlistId)));
    }

    const rows = await tx
      .select()
      .from(broadcastPlaylistItems)
      .where(eq(broadcastPlaylistItems.playlistId, playlistId))
      .orderBy(asc(broadcastPlaylistItems.order), asc(broadcastPlaylistItems.createdAt), asc(broadcastPlaylistItems.id));
    return rows as BroadcastPlaylistItemRecord[];
  });
}

import { desc, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendaEvents, broadcastPlaylistItems } from "../../../database/schema";
import type { BroadcastAgendaEventRecord, BroadcastPlaylistItemRecord } from "../../../contracts/types";

export async function findMaxPlaylistItemOrder(playlistId: string): Promise<number> {
  const [row] = await db
    .select({ order: broadcastPlaylistItems.order })
    .from(broadcastPlaylistItems)
    .where(eq(broadcastPlaylistItems.playlistId, playlistId))
    .orderBy(desc(broadcastPlaylistItems.order))
    .limit(1);
  return row?.order ?? -1;
}

// Confere que o evento existe antes de gravar o item — mesmo racional de
// add-media-asset-playlist-item validando o asset (evita um item de playlist referenciando um
// evento inexistente, já que a FK sozinha não conta o suficiente pra devolver um erro amigável).
// Não precisa das datas avulsas aqui (só confere existência e lê o título) — extraDates fica [].
export async function findAgendaEventById(id: string): Promise<BroadcastAgendaEventRecord | null> {
  const [row] = await db.select().from(broadcastAgendaEvents).where(eq(broadcastAgendaEvents.id, id)).limit(1);
  if (!row) return null;
  return { ...(row as Omit<BroadcastAgendaEventRecord, "extraDates">), extraDates: [] };
}

export async function insertAgendaEventPlaylistItem(input: {
  playlistId: string;
  order: number;
  title: string | null;
  agendaEventId: string;
  durationSeconds: number | null;
}): Promise<BroadcastPlaylistItemRecord> {
  const [row] = await db
    .insert(broadcastPlaylistItems)
    .values({ ...input, sourceType: "agenda-event", relativePath: null, mediaAssetId: null, url: null })
    .returning();
  return row as BroadcastPlaylistItemRecord;
}

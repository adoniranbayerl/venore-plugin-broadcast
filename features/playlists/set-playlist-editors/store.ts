import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistEditors, broadcastPlaylists } from "../../../database/schema";
import type { BroadcastPlaylistRecord } from "../../../contracts/types";

export async function findPlaylistById(id: string): Promise<BroadcastPlaylistRecord | null> {
  const [row] = await db.select().from(broadcastPlaylists).where(eq(broadcastPlaylists.id, id)).limit(1);
  return (row as BroadcastPlaylistRecord) ?? null;
}

// Substitui o conjunto inteiro de responsáveis desta playlist — mesmo padrão de
// set-agenda-editors/store.ts (replaceAgendaEditors). userIds=[] é um estado válido: "esta
// playlist não tem responsável nenhum atribuído" (broadcast.manage continua editando normalmente,
// só quem só tem broadcast.playlists.manage fica sem acesso até alguém ser atribuído).
export async function replacePlaylistEditors(playlistId: string, userIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(broadcastPlaylistEditors).where(eq(broadcastPlaylistEditors.playlistId, playlistId));
    if (userIds.length > 0) {
      await tx.insert(broadcastPlaylistEditors).values(userIds.map((userId) => ({ playlistId, userId })));
    }
  });
}

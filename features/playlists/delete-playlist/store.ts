import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylists } from "../../../database/schema";

// Itens da playlist somem em cascata (FK onDelete: "cascade" no schema) — não precisa de limpeza
// manual aqui. Uma saída cuja camada "video" apontava pra esta playlist fica com config.playlistId
// órfão (string solta, sem FK — mesmo racional de mediaAssetId em playlist_items); get-output-state
// já degrada bem pra playlistId sem itens resolvidos (playlistItemsByPlaylistId[playlistId] fica
// vazio), então a saída simplesmente não toca nada até o operador trocar a playlist.
export async function deletePlaylistById(id: string): Promise<boolean> {
  const rows = await db.delete(broadcastPlaylists).where(eq(broadcastPlaylists.id, id)).returning({ id: broadcastPlaylists.id });
  return rows.length > 0;
}

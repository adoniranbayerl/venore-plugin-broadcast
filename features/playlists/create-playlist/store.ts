import { db } from "@venore/plugin-sdk";
import { broadcastPlaylists } from "../../../database/schema";
import type { BroadcastPlaylistRecord } from "../../../contracts/types";

export async function insertPlaylist(input: { name: string; folderPath: string | null }): Promise<BroadcastPlaylistRecord> {
  const [row] = await db.insert(broadcastPlaylists).values(input).returning();
  return row as BroadcastPlaylistRecord;
}

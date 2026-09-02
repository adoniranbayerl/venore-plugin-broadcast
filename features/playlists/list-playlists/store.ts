import { asc } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylists } from "../../../database/schema";
import type { BroadcastPlaylistRecord } from "../../../contracts/types";

export async function findAllPlaylists(): Promise<BroadcastPlaylistRecord[]> {
  const rows = await db.select().from(broadcastPlaylists).orderBy(asc(broadcastPlaylists.name));
  return rows as BroadcastPlaylistRecord[];
}

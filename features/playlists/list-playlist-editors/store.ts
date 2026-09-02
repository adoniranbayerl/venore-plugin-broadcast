import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistEditors } from "../../../database/schema";

export async function findAllPlaylistEditorLinks(): Promise<{ playlistId: string; userId: string }[]> {
  return db.select({ playlistId: broadcastPlaylistEditors.playlistId, userId: broadcastPlaylistEditors.userId }).from(broadcastPlaylistEditors);
}

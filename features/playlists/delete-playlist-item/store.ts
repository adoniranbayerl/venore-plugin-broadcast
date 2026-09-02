import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastPlaylistItems } from "../../../database/schema";

export async function deletePlaylistItemById(id: string): Promise<boolean> {
  const rows = await db.delete(broadcastPlaylistItems).where(eq(broadcastPlaylistItems.id, id)).returning({ id: broadcastPlaylistItems.id });
  return rows.length > 0;
}

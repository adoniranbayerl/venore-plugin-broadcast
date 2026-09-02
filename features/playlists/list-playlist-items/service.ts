import { findPlaylistItemsByPlaylistId } from "./store";
import type { ListPlaylistItemsQuery, ListPlaylistItemsResult } from "./types";

export async function listPlaylistItems(query: ListPlaylistItemsQuery): Promise<ListPlaylistItemsResult> {
  return { success: true, data: await findPlaylistItemsByPlaylistId(query.playlistId) };
}

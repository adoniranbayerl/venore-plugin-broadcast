import { authorizePlaylistActor } from "../../../shared/scoped-authorization";
import { listPlaylistItems } from "./service";
import type { ListPlaylistItemsQuery, ListPlaylistItemsResult } from "./types";

export async function listPlaylistItemsHandler(query: ListPlaylistItemsQuery): Promise<ListPlaylistItemsResult> {
  const authz = await authorizePlaylistActor(query.playlistId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listPlaylistItems(query);
}

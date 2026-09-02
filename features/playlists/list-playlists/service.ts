import { findPlaylistIdsAssignedToUser } from "../../../shared/scoped-authorization";
import { findAllPlaylists } from "./store";
import type { ListPlaylistsResult } from "./types";

// assignedToUserId filtra pra só as playlists atribuídas a este usuário — usado quando o ator só
// tem a permission estreita (broadcast.playlists.manage), não a ampla (broadcast.manage) nem
// broadcast.outputs.manage (que sempre vê a lista inteira, ver handler.ts).
export async function listPlaylists(options?: { assignedToUserId?: string }): Promise<ListPlaylistsResult> {
  const playlists = await findAllPlaylists();
  if (!options?.assignedToUserId) return { success: true, data: playlists };

  const allowedIds = new Set(await findPlaylistIdsAssignedToUser(options.assignedToUserId));
  return { success: true, data: playlists.filter((playlist) => allowedIds.has(playlist.id)) };
}

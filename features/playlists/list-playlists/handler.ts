import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listPlaylists } from "./service";
import type { ListPlaylistsResult } from "./types";

// broadcast.manage e broadcast.outputs.manage sempre veem a lista INTEIRA — um "responsável por
// tela" precisa ver todas as playlists pra poder trocar qual sua saída atribuída toca
// (SetOutputPlaylistForm), mesmo sem broadcast.manage; isso não amplia o que ele pode FAZER com
// uma playlist (criar/editar/apagar continuam só broadcast.manage/broadcast.playlists.manage) — só
// o que ele pode LER pra montar o seletor. Quem só tem broadcast.playlists.manage (responsável por
// playlists específicas, sem os outros dois) vê só as suas atribuídas.
export async function listPlaylistsHandler(): Promise<ListPlaylistsResult> {
  const broad = await authorizeActor(["broadcast.manage", "broadcast.outputs.manage"]);
  if (broad.authorized) return listPlaylists();

  const scoped = await authorizeActor("broadcast.playlists.manage");
  if (!scoped.authorized) return { success: false, error: scoped.error };

  return listPlaylists({ assignedToUserId: scoped.actorId });
}

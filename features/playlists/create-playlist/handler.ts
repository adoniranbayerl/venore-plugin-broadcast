import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { createPlaylist } from "./service";
import { validateCreatePlaylistInput } from "./validation";
import type { CreatePlaylistInput, CreatePlaylistResult } from "./types";

// Só broadcast.manage — criar uma playlist nova é ação de admin (quem administra decide o que
// existe e depois atribui um responsável a ela via set-playlist-editors), mesmo racional de
// create-agenda/handler.ts; um "editor de playlist" (broadcast.playlists.manage) só edita
// playlists já atribuídas a ele, nunca cria novas.
export async function createPlaylistHandler(input: CreatePlaylistInput): Promise<CreatePlaylistResult> {
  const validationError = validateCreatePlaylistInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return createPlaylist({ ...input, actorId: authz.actorId });
}

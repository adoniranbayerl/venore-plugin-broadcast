import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { setPlaylistEditors } from "./service";
import type { SetPlaylistEditorsInput, SetPlaylistEditorsResult } from "./types";

// Só broadcast.manage — decidir quem é responsável por uma playlist é ação de admin, nunca do
// próprio editor atribuído (mesmo racional de set-agenda-editors/set-output-editors).
export async function setPlaylistEditorsHandler(input: SetPlaylistEditorsInput): Promise<SetPlaylistEditorsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setPlaylistEditors({ ...input, actorId: authz.actorId });
}

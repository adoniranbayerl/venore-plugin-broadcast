import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { setOutputPlaylist } from "./service";
import type { SetOutputPlaylistInput, SetOutputPlaylistResult } from "./types";

export async function setOutputPlaylistHandler(input: SetOutputPlaylistInput): Promise<SetOutputPlaylistResult> {
  if (!input.outputId) {
    return { success: false, error: { code: "broadcast.set-output-playlist.invalid_output", message: "Saída inválida." } };
  }
  if (!input.playlistId) {
    return { success: false, error: { code: "broadcast.set-output-playlist.invalid_playlist", message: "Escolha uma playlist." } };
  }

  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputPlaylist({ ...input, actorId: authz.actorId });
}

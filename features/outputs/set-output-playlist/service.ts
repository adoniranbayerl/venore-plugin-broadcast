import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { publishOutputEvent } from "../../../runtime/output-bus";
import { applyVideoLayerPlaylist, findOutputById, findVideoLayerBySceneId } from "./store";
import type { SetOutputPlaylistCommand, SetOutputPlaylistResult } from "./types";

export async function setOutputPlaylist(command: SetOutputPlaylistCommand): Promise<SetOutputPlaylistResult> {
  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-playlist.not_found", message: "Saída não encontrada." } };
  }
  if (!output.currentSceneId) {
    return {
      success: false,
      error: { code: "broadcast.set-output-playlist.no_scene", message: "Esta saída não tem uma cena — exclua e crie de novo." },
    };
  }

  const videoLayer = await findVideoLayerBySceneId(output.currentSceneId);
  if (!videoLayer) {
    return {
      success: false,
      error: { code: "broadcast.set-output-playlist.no_video_layer", message: "Esta saída não tem uma camada de vídeo." },
    };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-playlist",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const updatedOutput = await applyVideoLayerPlaylist(output.id, videoLayer.id, videoLayer.config, command.playlistId);

  endOperation(handle, { success: true });

  // TV rebusca o estado em ~1s em vez de esperar o poll de 15s (FALLBACK_POLL_MS em
  // output-canvas.tsx). Só a saída afetada — troca de playlist não é global.
  publishOutputEvent(updatedOutput.token, { type: "playlist-changed" });

  return { success: true, data: updatedOutput };
}

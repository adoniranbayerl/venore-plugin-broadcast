import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findPlaylistById, replacePlaylistEditors } from "./store";
import type { SetPlaylistEditorsCommand, SetPlaylistEditorsResult } from "./types";

export async function setPlaylistEditors(command: SetPlaylistEditorsCommand): Promise<SetPlaylistEditorsResult> {
  const playlist = await findPlaylistById(command.playlistId);
  if (!playlist) {
    return { success: false, error: { code: "broadcast.set-playlist-editors.not_found", message: "Playlist não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-playlist-editors",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  await replacePlaylistEditors(command.playlistId, command.userIds);

  endOperation(handle, { success: true });
  return { success: true, data: { playlistId: command.playlistId, userIds: command.userIds } };
}

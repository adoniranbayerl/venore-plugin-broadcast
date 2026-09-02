import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { BROADCAST_VIDEOS_FOLDER_PATH } from "../../../shared/settings";
import { insertPlaylist } from "./store";
import type { CreatePlaylistCommand, CreatePlaylistResult } from "./types";

// folderPath não é mais escolhido pelo operador — toda playlist aponta pra mesma pasta
// compartilhada (BROADCAST_VIDEOS_FOLDER_PATH), o "Escanear pasta" de cada playlist decide qual
// subconjunto dos arquivos ali entra (feedback direto: "a pasta sempre vai ser
// public/broadcast/videos", o campo era desnecessário).
export async function createPlaylist(command: CreatePlaylistCommand): Promise<CreatePlaylistResult> {
  const handle = beginOperation({
    useCase: "broadcast.create-playlist",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const record = await insertPlaylist({ name: command.name.trim(), folderPath: BROADCAST_VIDEOS_FOLDER_PATH });

  endOperation(handle, { success: true });
  return { success: true, data: record };
}

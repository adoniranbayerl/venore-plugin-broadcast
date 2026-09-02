import { stat } from "node:fs/promises";
import path from "node:path";
import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { BROADCAST_ROOT_FOLDER } from "../../../shared/settings";
import { normalizePlaylistFolderPath, resolveWithinRoot } from "../../../shared/sandboxed-path";
import { isVideoExtension } from "../../../shared/video-extensions";
import { findMaxPlaylistItemOrder, findPlaylistById, insertLocalPlaylistItems } from "./store";
import type { AddScannedPlaylistItemsCommand, AddScannedPlaylistItemsResult } from "./types";

// Nunca confia cegamente na lista de relativePath vinda do client, mesmo tendo saído de um scan
// (scan-playlist-folder) recente — reconfere que cada um: está dentro da pasta configurada desta
// playlist (não só da raiz), tem extensão de vídeo válida, e o arquivo ainda existe no disco
// (pode ter sumido entre o scan e a confirmação). Mesma defesa em profundidade de
// resolve-streamable-playlist-item.
export async function addScannedPlaylistItems(command: AddScannedPlaylistItemsCommand): Promise<AddScannedPlaylistItemsResult> {
  const playlist = await findPlaylistById(command.playlistId);
  if (!playlist || !playlist.folderPath) {
    return {
      success: false,
      error: { code: "broadcast.add-scanned-playlist-items.invalid_playlist", message: "Playlist inválida." },
    };
  }

  // normalizePlaylistFolderPath também aqui (não só em create-playlist) — defesa em profundidade
  // pra uma playlist com folderPath salvo antes do fix (barra sobrando) continuar funcionando sem
  // precisar de migração manual.
  const normalizedFolderPath = normalizePlaylistFolderPath(playlist.folderPath);
  const validRelativePaths: string[] = [];
  for (const relativePath of command.relativePaths) {
    const withinPlaylistFolder = relativePath === normalizedFolderPath || relativePath.startsWith(`${normalizedFolderPath}/`);
    if (!withinPlaylistFolder || !isVideoExtension(path.extname(relativePath))) continue;

    const absolutePath = resolveWithinRoot(BROADCAST_ROOT_FOLDER, relativePath);
    if (!absolutePath) continue;

    try {
      const info = await stat(absolutePath);
      if (info.isFile()) validRelativePaths.push(relativePath);
    } catch {
      // Arquivo sumiu entre o scan e a confirmação — ignora esse item, não falha a operação inteira.
    }
  }

  if (validRelativePaths.length === 0) {
    return {
      success: false,
      error: {
        code: "broadcast.add-scanned-playlist-items.no_valid_items",
        message: "Nenhum dos vídeos selecionados foi encontrado na pasta — tente escanear de novo.",
      },
    };
  }

  const handle = beginOperation({
    useCase: "broadcast.add-scanned-playlist-items",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  let nextOrder = (await findMaxPlaylistItemOrder(command.playlistId)) + 1;
  const items = await insertLocalPlaylistItems(
    validRelativePaths.map((relativePath) => ({
      playlistId: command.playlistId,
      order: nextOrder++,
      title: null,
      relativePath,
    })),
  );

  endOperation(handle, { success: true });
  return { success: true, data: items };
}

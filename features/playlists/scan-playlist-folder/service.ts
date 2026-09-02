import { readdir } from "node:fs/promises";
import path from "node:path";
import { BROADCAST_ROOT_FOLDER } from "../../../shared/settings";
import { resolveWithinRoot, toStoredRelativePath } from "../../../shared/sandboxed-path";
import { isVideoExtension } from "../../../shared/video-extensions";
import { findLocalPlaylistItemsByPlaylistId, findPlaylistById } from "./store";
import type { ScanPlaylistFolderCommand, ScanPlaylistFolderResult } from "./types";

// Descobre só vídeo — imagem tem seu próprio fluxo dedicado (biblioteca de mídia, via
// AddMediaAssetItemForm), então a pasta varrida automaticamente não mistura os dois (feedback
// direto: "o botão reescanear pasta faz sentido apenas para adicionar vídeos"). Nunca segue
// symlink (entry.isSymbolicLink() é pulado) — um link dentro da pasta sandboxed apontando pra
// fora seria uma forma de escapar resolveWithinRoot depois do primeiro check.
async function listStreamableFilesRecursively(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listStreamableFilesRecursively(entryPath)));
      continue;
    }

    if (entry.isFile() && isVideoExtension(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

// Só leitura — não insere nem apaga nada (era assim antes: "escanear" adicionava/removia tudo
// automaticamente; feedback direto: "quero poder escolher o que entra... e o que não entra").
// Devolve o que a pasta tem e a playlist não (toAdd) e o que a playlist tem e a pasta não mais
// (toRemove); a inserção de fato acontece em add-scanned-playlist-items, com a lista que o
// operador escolheu.
export async function scanPlaylistFolder(command: ScanPlaylistFolderCommand): Promise<ScanPlaylistFolderResult> {
  const playlist = await findPlaylistById(command.playlistId);
  if (!playlist) {
    return {
      success: false,
      error: { code: "broadcast.scan-playlist-folder.not_found", message: "Playlist não encontrada." },
    };
  }
  if (!playlist.folderPath) {
    return {
      success: false,
      error: {
        code: "broadcast.scan-playlist-folder.no_folder",
        message: "Esta playlist não tem uma pasta configurada.",
      },
    };
  }

  const targetDir = resolveWithinRoot(BROADCAST_ROOT_FOLDER, playlist.folderPath);
  if (!targetDir) {
    return {
      success: false,
      error: {
        code: "broadcast.scan-playlist-folder.path_escape",
        message: "A pasta da playlist está fora da raiz configurada.",
      },
    };
  }

  let discoveredFiles: string[];
  try {
    discoveredFiles = await listStreamableFilesRecursively(targetDir);
  } catch {
    return {
      success: false,
      error: {
        code: "broadcast.scan-playlist-folder.folder_not_found",
        message: "Não foi possível ler a pasta configurada — confira se ela existe no servidor.",
      },
    };
  }

  const discoveredRelativePaths = new Set(discoveredFiles.map((filePath) => toStoredRelativePath(BROADCAST_ROOT_FOLDER, filePath)));

  const existingItems = await findLocalPlaylistItemsByPlaylistId(command.playlistId);
  const existingRelativePaths = new Set(existingItems.map((item) => item.relativePath));

  const toRemove = existingItems
    .filter((item) => !discoveredRelativePaths.has(item.relativePath as string))
    .map((item) => ({ id: item.id, relativePath: item.relativePath as string }));
  const toAdd = [...discoveredRelativePaths].filter((relativePath) => !existingRelativePaths.has(relativePath));

  return { success: true, data: { toAdd, toRemove } };
}

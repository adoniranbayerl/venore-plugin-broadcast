import { readdir } from "node:fs/promises";
import path from "node:path";
import { BROADCAST_IMAGES_FOLDER_PATH, BROADCAST_ROOT_FOLDER } from "../../../shared/settings";
import { resolveWithinRoot, toStoredRelativePath } from "../../../shared/sandboxed-path";
import { isImageExtension, isVideoExtension } from "../../../shared/video-extensions";
import { findLocalPlaylistItemsByPlaylistId, findPlaylistById } from "./store";
import type { ScanPlaylistFolderCommand, ScanPlaylistFolderResult } from "./types";

// Nunca segue symlink (entry.isSymbolicLink() é pulado) — um link dentro da pasta sandboxed
// apontando pra fora seria uma forma de escapar resolveWithinRoot depois do primeiro check.
// matchesExtension parametriza vídeo vs imagem (ver scanPlaylistFolder abaixo) — mesma varredura
// recursiva pros dois casos, só o filtro de extensão muda.
async function listStreamableFilesRecursively(dir: string, matchesExtension: (extension: string) => boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listStreamableFilesRecursively(entryPath, matchesExtension)));
      continue;
    }

    if (entry.isFile() && matchesExtension(path.extname(entry.name))) {
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
//
// kind="video" continua lendo playlist.folderPath (sempre BROADCAST_VIDEOS_FOLDER_PATH hoje,
// comportamento inalterado); kind="image" usa BROADCAST_IMAGES_FOLDER_PATH direto, independente
// dessa coluna — pedido explícito: "Vídeos da pasta, vamos fazer algo similar para 'Imagens na
// pasta'", um fluxo paralelo, não uma opção a mais da mesma pasta configurada.
export async function scanPlaylistFolder(command: ScanPlaylistFolderCommand): Promise<ScanPlaylistFolderResult> {
  const playlist = await findPlaylistById(command.playlistId);
  if (!playlist) {
    return {
      success: false,
      error: { code: "broadcast.scan-playlist-folder.not_found", message: "Playlist não encontrada." },
    };
  }

  const folderPath = command.kind === "video" ? playlist.folderPath : BROADCAST_IMAGES_FOLDER_PATH;
  if (!folderPath) {
    return {
      success: false,
      error: {
        code: "broadcast.scan-playlist-folder.no_folder",
        message: "Esta playlist não tem uma pasta configurada.",
      },
    };
  }

  const targetDir = resolveWithinRoot(BROADCAST_ROOT_FOLDER, folderPath);
  if (!targetDir) {
    return {
      success: false,
      error: {
        code: "broadcast.scan-playlist-folder.path_escape",
        message: "A pasta da playlist está fora da raiz configurada.",
      },
    };
  }

  const matchesExtension = command.kind === "video" ? isVideoExtension : isImageExtension;

  let discoveredFiles: string[];
  try {
    discoveredFiles = await listStreamableFilesRecursively(targetDir, matchesExtension);
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

  // Só os itens locais DESTA pasta (vídeo ou imagem, conforme kind) entram no diff — sem isso,
  // escanear imagem marcaria todo vídeo já cadastrado como "sumiu da pasta" (relativePath começa
  // com "videos/", nunca aparece no discoveredRelativePaths de imagem), e vice-versa.
  const folderPrefix = `${folderPath}/`;
  const existingItems = (await findLocalPlaylistItemsByPlaylistId(command.playlistId)).filter((item) =>
    (item.relativePath as string).startsWith(folderPrefix),
  );
  const existingRelativePaths = new Set(existingItems.map((item) => item.relativePath));

  const toRemove = existingItems
    .filter((item) => !discoveredRelativePaths.has(item.relativePath as string))
    .map((item) => ({ id: item.id, relativePath: item.relativePath as string }));
  const toAdd = [...discoveredRelativePaths].filter((relativePath) => !existingRelativePaths.has(relativePath));

  return { success: true, data: { toAdd, toRemove } };
}

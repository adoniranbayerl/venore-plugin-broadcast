import { stat } from "node:fs/promises";
import path from "node:path";
import { getMediaAsset } from "@venore/plugin-sdk/media";
import { BROADCAST_ROOT_FOLDER } from "../../../shared/settings";
import { resolveWithinRoot } from "../../../shared/sandboxed-path";
import { streamableContentTypeForExtension } from "../../../shared/video-extensions";
import { findPlaylistItemById } from "./store";
import type { ResolveStreamableItemQuery, ResolveStreamableItemResult } from "./types";

// Resolve um item de playlist pro que a rota de stream (app/api/broadcast/stream) precisa: um
// item "media-asset" vira um redirect pra URL do Blob (que já serve Range request nativamente,
// sem precisar de proxy); um item "local" é revalidado contra a raiz configurada de novo (nunca
// confia que relativePath, já gravado no banco pelo scan, continua seguro sem reconferir — mesma
// defesa em profundidade de scan-playlist-folder/service.ts).
export async function resolveStreamableItem(query: ResolveStreamableItemQuery): Promise<ResolveStreamableItemResult> {
  const item = await findPlaylistItemById(query.itemId);
  if (!item) {
    return {
      success: false,
      error: { code: "broadcast.resolve-streamable-item.not_found", message: "Item de playlist não encontrado." },
    };
  }

  if (item.sourceType === "media-asset") {
    if (!item.mediaAssetId) {
      return {
        success: false,
        error: { code: "broadcast.resolve-streamable-item.invalid_item", message: "Item de mídia inválido." },
      };
    }

    const asset = await getMediaAsset({ id: item.mediaAssetId });
    if (!asset.success || !asset.data) {
      return {
        success: false,
        error: { code: "broadcast.resolve-streamable-item.media_not_found", message: "Mídia não encontrada." },
      };
    }

    return { success: true, data: { kind: "redirect", url: asset.data.url } };
  }

  if (item.sourceType === "webpage") {
    // Item "webpage" nunca deveria bater nesta rota — a view de saída embute item.url num
    // <iframe> direto, sem passar por app/api/broadcast/stream (não é um arquivo).
    return {
      success: false,
      error: { code: "broadcast.resolve-streamable-item.invalid_item", message: "Item de página web não é um arquivo." },
    };
  }

  if (!item.relativePath) {
    return {
      success: false,
      error: { code: "broadcast.resolve-streamable-item.invalid_item", message: "Item local inválido." },
    };
  }

  const absolutePath = resolveWithinRoot(BROADCAST_ROOT_FOLDER, item.relativePath);
  const contentType = streamableContentTypeForExtension(path.extname(item.relativePath));
  if (!absolutePath || !contentType) {
    return {
      success: false,
      error: { code: "broadcast.resolve-streamable-item.path_escape", message: "Caminho do arquivo inválido." },
    };
  }

  try {
    const fileStat = await stat(absolutePath);
    return { success: true, data: { kind: "local", absolutePath, contentType, size: fileStat.size } };
  } catch {
    return {
      success: false,
      error: { code: "broadcast.resolve-streamable-item.file_not_found", message: "Arquivo não encontrado no servidor." },
    };
  }
}

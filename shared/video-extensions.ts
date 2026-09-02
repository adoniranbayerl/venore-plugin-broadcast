// Formatos com suporte garantido pela tag <video>/<img> nativa entre browsers/TVs sem plugin
// extra — mesmo par de vídeo já usado por MEDIA_ALLOWED_TYPES (@/contexts/media). Cobre tanto o
// scan de pasta (Fase 2) quanto a rota de stream (que agora também serve imagem — item de
// playlist "local"/"media-asset" pode resolver pra vídeo OU imagem, nunca webpage, que não tem
// arquivo). O prefixo do content type ("video/"/"image/") é como get-output-state classifica o
// "kind" de um item — não existe coluna própria pra isso, ver contracts/types.ts.
export const BROADCAST_STREAMABLE_CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function streamableContentTypeForExtension(extension: string): string | null {
  return BROADCAST_STREAMABLE_CONTENT_TYPE_BY_EXTENSION[extension.toLowerCase()] ?? null;
}

// Usado só pelo scan de pasta (scan-playlist-folder) — imagem tem seu próprio fluxo dedicado
// (biblioteca de mídia, MediaPickerField), então a pasta varrida automaticamente só traz vídeo,
// pra não confundir o operador sobre de onde cada tipo de item vem.
export function isVideoExtension(extension: string): boolean {
  const contentType = streamableContentTypeForExtension(extension);
  return contentType !== null && contentType.startsWith("video/");
}

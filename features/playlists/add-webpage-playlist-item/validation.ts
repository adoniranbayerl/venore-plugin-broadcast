import type { AddWebpagePlaylistItemInput } from "./types";

// Aceita tanto uma rota interna do próprio site ("/cursos") quanto uma URL absoluta http(s) — o
// <iframe> na view de saída (Fase 4/5) usa o valor cru como src, então "rota" e "URL completa"
// funcionam do mesmo jeito no browser.
function isValidWebpageUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateAddWebpagePlaylistItemInput(
  input: AddWebpagePlaylistItemInput,
): { code: string; message: string } | null {
  if (!input.playlistId) {
    return { code: "broadcast.add-webpage-playlist-item.invalid_playlist", message: "Playlist inválida." };
  }
  if (!input.url || !isValidWebpageUrl(input.url.trim())) {
    return {
      code: "broadcast.add-webpage-playlist-item.invalid_url",
      message: 'Informe uma URL completa (https://...) ou uma rota interna começando com "/".',
    };
  }
  if (input.durationSeconds !== undefined && input.durationSeconds !== null && !(input.durationSeconds > 0)) {
    return {
      code: "broadcast.add-webpage-playlist-item.invalid_duration",
      message: "A duração precisa ser um número maior que zero.",
    };
  }
  return null;
}

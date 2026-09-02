import type { CreatePlaylistInput } from "./types";

export function validateCreatePlaylistInput(input: CreatePlaylistInput): { code: string; message: string } | null {
  if (!input.name || !input.name.trim()) {
    return { code: "broadcast.create-playlist.invalid_name", message: "Informe um nome para a playlist." };
  }

  return null;
}

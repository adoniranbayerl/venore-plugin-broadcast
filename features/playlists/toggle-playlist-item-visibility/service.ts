import { applyPlaylistItemHidden } from "./store";
import type { TogglePlaylistItemVisibilityInput, TogglePlaylistItemVisibilityResult } from "./types";

export async function togglePlaylistItemVisibility(
  input: TogglePlaylistItemVisibilityInput,
): Promise<TogglePlaylistItemVisibilityResult> {
  const record = await applyPlaylistItemHidden(input.itemId, input.hidden);
  if (!record) {
    return {
      success: false,
      error: { code: "broadcast.toggle-playlist-item-visibility.not_found", message: "Item de playlist não encontrado." },
    };
  }
  return { success: true, data: record };
}

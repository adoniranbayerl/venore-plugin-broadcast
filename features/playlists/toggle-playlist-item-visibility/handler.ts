import { authorizePlaylistItemActor } from "../../../shared/scoped-authorization";
import { togglePlaylistItemVisibility } from "./service";
import type { TogglePlaylistItemVisibilityInput, TogglePlaylistItemVisibilityResult } from "./types";

export async function togglePlaylistItemVisibilityHandler(
  input: TogglePlaylistItemVisibilityInput,
): Promise<TogglePlaylistItemVisibilityResult> {
  const authz = await authorizePlaylistItemActor(input.itemId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return togglePlaylistItemVisibility(input);
}

import { authorizePlaylistActor } from "../../../shared/scoped-authorization";
import { addMediaAssetPlaylistItem } from "./service";
import { validateAddMediaAssetPlaylistItemInput } from "./validation";
import type { AddMediaAssetPlaylistItemInput, AddMediaAssetPlaylistItemResult } from "./types";

export async function addMediaAssetPlaylistItemHandler(
  input: AddMediaAssetPlaylistItemInput,
): Promise<AddMediaAssetPlaylistItemResult> {
  const validationError = validateAddMediaAssetPlaylistItemInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizePlaylistActor(input.playlistId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return addMediaAssetPlaylistItem({ ...input, actorId: authz.actorId });
}

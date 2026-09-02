import { authorizePlaylistActor } from "../../../shared/scoped-authorization";
import { addNewsPlaylistItem } from "./service";
import { validateAddNewsPlaylistItemInput } from "./validation";
import type { AddNewsPlaylistItemInput, AddNewsPlaylistItemResult } from "./types";

export async function addNewsPlaylistItemHandler(
  input: AddNewsPlaylistItemInput,
): Promise<AddNewsPlaylistItemResult> {
  const validationError = validateAddNewsPlaylistItemInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizePlaylistActor(input.playlistId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return addNewsPlaylistItem({ ...input, actorId: authz.actorId });
}

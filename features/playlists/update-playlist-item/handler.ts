import { authorizePlaylistItemActor } from "../../../shared/scoped-authorization";
import { updatePlaylistItem } from "./service";
import { validateUpdatePlaylistItemInput } from "./validation";
import type { UpdatePlaylistItemInput, UpdatePlaylistItemResult } from "./types";

export async function updatePlaylistItemHandler(input: UpdatePlaylistItemInput): Promise<UpdatePlaylistItemResult> {
  const validationError = validateUpdatePlaylistItemInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizePlaylistItemActor(input.itemId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return updatePlaylistItem({ ...input, actorId: authz.actorId });
}

import { authorizePlaylistActor } from "../../../shared/scoped-authorization";
import { addAgendaEventPlaylistItem } from "./service";
import { validateAddAgendaEventPlaylistItemInput } from "./validation";
import type { AddAgendaEventPlaylistItemInput, AddAgendaEventPlaylistItemResult } from "./types";

export async function addAgendaEventPlaylistItemHandler(
  input: AddAgendaEventPlaylistItemInput,
): Promise<AddAgendaEventPlaylistItemResult> {
  const validationError = validateAddAgendaEventPlaylistItemInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizePlaylistActor(input.playlistId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return addAgendaEventPlaylistItem({ ...input, actorId: authz.actorId });
}

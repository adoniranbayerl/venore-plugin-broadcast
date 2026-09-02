import { authorizeAgendaEventActor } from "../../../shared/scoped-authorization";
import { updateAgendaEvent } from "./service";
import { validateUpdateAgendaEventInput } from "./validation";
import type { UpdateAgendaEventInput, UpdateAgendaEventResult } from "./types";

export async function updateAgendaEventHandler(input: UpdateAgendaEventInput): Promise<UpdateAgendaEventResult> {
  const validationError = validateUpdateAgendaEventInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizeAgendaEventActor(input.eventId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return updateAgendaEvent({ ...input, actorId: authz.actorId });
}

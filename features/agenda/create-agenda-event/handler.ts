import { authorizeAgendaActor } from "../../../shared/scoped-authorization";
import { createAgendaEvent } from "./service";
import { validateCreateAgendaEventInput } from "./validation";
import type { CreateAgendaEventInput, CreateAgendaEventResult } from "./types";

export async function createAgendaEventHandler(input: CreateAgendaEventInput): Promise<CreateAgendaEventResult> {
  const validationError = validateCreateAgendaEventInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizeAgendaActor(input.agendaId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return createAgendaEvent({ ...input, actorId: authz.actorId });
}

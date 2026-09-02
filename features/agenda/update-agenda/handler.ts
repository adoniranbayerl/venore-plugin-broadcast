import { authorizeAgendaActor } from "../../../shared/scoped-authorization";
import { updateAgenda } from "./service";
import { validateUpdateAgendaInput } from "./validation";
import type { UpdateAgendaInput, UpdateAgendaResult } from "./types";

export async function updateAgendaHandler(input: UpdateAgendaInput): Promise<UpdateAgendaResult> {
  const validationError = validateUpdateAgendaInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizeAgendaActor(input.agendaId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return updateAgenda({ ...input, actorId: authz.actorId });
}

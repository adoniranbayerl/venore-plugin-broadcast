import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { createAgenda } from "./service";
import { validateCreateAgendaInput } from "./validation";
import type { CreateAgendaInput, CreateAgendaResult } from "./types";

// Só broadcast.manage — criar uma agenda nova é ação de admin (quem administra decide o que
// existe e depois atribui um responsável a ela via set-agenda-editors); um "editor de agenda"
// (broadcast.agenda.manage) só edita agendas já atribuídas a ele, nunca cria novas.
export async function createAgendaHandler(input: CreateAgendaInput): Promise<CreateAgendaResult> {
  const validationError = validateCreateAgendaInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return createAgenda({ ...input, actorId: authz.actorId });
}

import { authorizeAgendaEventActor } from "../../../shared/scoped-authorization";
import { deleteAgendaEvent } from "./service";
import type { DeleteAgendaEventInput, DeleteAgendaEventResult } from "./types";

export async function deleteAgendaEventHandler(input: DeleteAgendaEventInput): Promise<DeleteAgendaEventResult> {
  const authz = await authorizeAgendaEventActor(input.eventId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return deleteAgendaEvent(input);
}

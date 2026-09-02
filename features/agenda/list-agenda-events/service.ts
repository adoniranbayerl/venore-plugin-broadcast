import { findAgendaIdsAssignedToUser } from "../../../shared/scoped-authorization";
import { findAllAgendaEvents } from "./store";
import type { ListAgendaEventsResult } from "./types";

export async function listAgendaEvents(options?: { assignedToUserId?: string }): Promise<ListAgendaEventsResult> {
  const events = await findAllAgendaEvents();
  if (!options?.assignedToUserId) return { success: true, data: events };

  const allowedAgendaIds = new Set(await findAgendaIdsAssignedToUser(options.assignedToUserId));
  return { success: true, data: events.filter((event) => allowedAgendaIds.has(event.agendaId)) };
}

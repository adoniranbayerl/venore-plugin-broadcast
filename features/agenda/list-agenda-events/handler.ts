import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listAgendaEvents } from "./service";
import type { ListAgendaEventsResult } from "./types";

// Mesmo racional de list-agendas/handler.ts.
export async function listAgendaEventsHandler(): Promise<ListAgendaEventsResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return listAgendaEvents();

  const scoped = await authorizeActor("broadcast.agenda.manage");
  if (!scoped.authorized) return { success: false, error: scoped.error };

  return listAgendaEvents({ assignedToUserId: scoped.actorId });
}

import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listAgendas } from "./service";
import type { ListAgendasResult } from "./types";

// Quem só tem broadcast.agenda.manage (não broadcast.manage) vê só as agendas atribuídas a ele —
// ver shared/scoped-authorization/index.ts pro racional completo de "responsável por agenda".
export async function listAgendasHandler(): Promise<ListAgendasResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return listAgendas();

  const scoped = await authorizeActor("broadcast.agenda.manage");
  if (!scoped.authorized) return { success: false, error: scoped.error };

  return listAgendas({ assignedToUserId: scoped.actorId });
}

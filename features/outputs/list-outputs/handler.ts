import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listOutputs } from "./service";
import type { ListOutputsResult } from "./types";

// Quem só tem broadcast.outputs.manage (não broadcast.manage) vê só as telas atribuídas a ele —
// mesmo racional de list-agendas/handler.ts.
export async function listOutputsHandler(): Promise<ListOutputsResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return listOutputs();

  const scoped = await authorizeActor("broadcast.outputs.manage");
  if (!scoped.authorized) return { success: false, error: scoped.error };

  return listOutputs({ assignedToUserId: scoped.actorId });
}

import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listDiagnosticEvents } from "./service";
import type { ListDiagnosticEventsResult } from "./types";

export async function listDiagnosticEventsHandler(): Promise<ListDiagnosticEventsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listDiagnosticEvents();
}

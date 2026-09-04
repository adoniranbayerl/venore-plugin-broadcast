import { findRecentDiagEvents } from "./store";
import type { ListDiagnosticEventsResult } from "./types";

export async function listDiagnosticEvents(): Promise<ListDiagnosticEventsResult> {
  return { success: true, data: await findRecentDiagEvents() };
}

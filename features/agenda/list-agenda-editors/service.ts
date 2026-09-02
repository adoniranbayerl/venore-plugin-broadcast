import { findAllAgendaEditorLinks } from "./store";
import type { ListAgendaEditorsResult } from "./types";

export async function listAgendaEditors(): Promise<ListAgendaEditorsResult> {
  const links = await findAllAgendaEditorLinks();
  const userIdsByAgendaId: Record<string, string[]> = {};
  for (const link of links) {
    (userIdsByAgendaId[link.agendaId] ??= []).push(link.userId);
  }
  return { success: true, data: userIdsByAgendaId };
}

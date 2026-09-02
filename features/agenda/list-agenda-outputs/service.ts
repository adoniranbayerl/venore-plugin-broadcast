import { findAllOutputAgendaLinks } from "./store";
import type { ListAgendaOutputsResult } from "./types";

export async function listAgendaOutputs(): Promise<ListAgendaOutputsResult> {
  const links = await findAllOutputAgendaLinks();
  const outputIdsByAgendaId: Record<string, string[]> = {};
  for (const link of links) {
    (outputIdsByAgendaId[link.agendaId] ??= []).push(link.outputId);
  }
  return { success: true, data: outputIdsByAgendaId };
}

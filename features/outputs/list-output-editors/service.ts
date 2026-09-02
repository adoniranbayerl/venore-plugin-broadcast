import { findAllOutputEditorLinks } from "./store";
import type { ListOutputEditorsResult } from "./types";

export async function listOutputEditors(): Promise<ListOutputEditorsResult> {
  const links = await findAllOutputEditorLinks();
  const userIdsByOutputId: Record<string, string[]> = {};
  for (const link of links) {
    (userIdsByOutputId[link.outputId] ??= []).push(link.userId);
  }
  return { success: true, data: userIdsByOutputId };
}

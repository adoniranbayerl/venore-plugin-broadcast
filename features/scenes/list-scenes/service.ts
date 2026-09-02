import { findAllScenes } from "./store";
import type { ListScenesResult } from "./types";

export async function listScenes(): Promise<ListScenesResult> {
  return { success: true, data: await findAllScenes() };
}

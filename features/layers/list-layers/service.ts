import { findLayersBySceneId } from "./store";
import type { ListLayersQuery, ListLayersResult } from "./types";

export async function listLayers(query: ListLayersQuery): Promise<ListLayersResult> {
  return { success: true, data: await findLayersBySceneId(query.sceneId) };
}

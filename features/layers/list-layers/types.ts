import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastLayerRecord } from "../../../contracts/types";

export type ListLayersQuery = { sceneId: string };
export type ListLayersResult = OperationResult<BroadcastLayerRecord[]>;

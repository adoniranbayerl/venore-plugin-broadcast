import { getOutputState } from "./service";
import type { GetOutputStateQuery, GetOutputStateResult } from "./types";

// Sem authorizeActor de propósito — a view de saída (TV) acessa por token, não por sessão. Mesmo
// espírito de resolve-streamable-playlist-item/handler.ts.
export async function getOutputStateHandler(query: GetOutputStateQuery): Promise<GetOutputStateResult> {
  return getOutputState(query);
}

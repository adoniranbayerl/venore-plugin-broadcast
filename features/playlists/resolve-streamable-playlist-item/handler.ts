import { resolveStreamableItem } from "./service";
import type { ResolveStreamableItemQuery, ResolveStreamableItemResult } from "./types";

// Sem authorizeActor de propósito — a view de saída (TV) não tem sessão; o token do output já
// gateia o acesso à página que embute este stream (Fase 3/4). Mesmo espírito de
// list-public-birthdays/handler.ts.
export async function resolveStreamableItemHandler(
  query: ResolveStreamableItemQuery,
): Promise<ResolveStreamableItemResult> {
  return resolveStreamableItem(query);
}

import { db } from "@venore/plugin-sdk";
import { broadcastOutputs } from "../database/schema";

// O aviso rápido (broadcast_alerts) é global — não tem coluna de saída. Quando um alerta entra ou
// é limpo, TODA TV precisa rebuscar o estado. publish-alert e clear-alert são use cases separados,
// com stores separados, e um store não importa o store de outra use case (AGENTS.md seção 2) —
// por isso esta leitura mínima mora aqui em shared/, compartilhada pelos dois.
export async function findAllOutputTokens(): Promise<string[]> {
  const rows = await db.select({ token: broadcastOutputs.token }).from(broadcastOutputs);
  return rows.map((row) => row.token);
}

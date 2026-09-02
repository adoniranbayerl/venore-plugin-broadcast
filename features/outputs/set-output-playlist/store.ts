import { and, eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastLayers, broadcastOutputs } from "../../../database/schema";
import type { BroadcastLayerRecord, BroadcastOutputRecord } from "../../../contracts/types";

export async function findOutputById(id: string): Promise<BroadcastOutputRecord | null> {
  const [row] = await db.select().from(broadcastOutputs).where(eq(broadcastOutputs.id, id)).limit(1);
  return (row as BroadcastOutputRecord) ?? null;
}

// A saída não guarda playlistId direto — quem guarda é a camada "video" da cena padrão dela
// (auto-provisionada em create-output). Uma saída sempre tem exatamente uma camada desse tipo.
export async function findVideoLayerBySceneId(sceneId: string): Promise<BroadcastLayerRecord | null> {
  const [row] = await db
    .select()
    .from(broadcastLayers)
    .where(and(eq(broadcastLayers.sceneId, sceneId), eq(broadcastLayers.type, "video")))
    .limit(1);
  return (row as BroadcastLayerRecord) ?? null;
}

// Troca a playlist na config da camada de vídeo e devolve o registro ATUALIZADO da saída — a
// playlist mora na config da layer, não numa coluna da saída, então o `updatedAt` da saída é
// bumpado aqui pra que "o que essa saída toca mudou" fique visível pra list-outputs/revalidação
// e o retorno reflita o estado pós-escrita (não a cópia lida antes do update).
export async function applyVideoLayerPlaylist(
  outputId: string,
  layerId: string,
  config: Record<string, unknown>,
  playlistId: string,
): Promise<BroadcastOutputRecord> {
  await db
    .update(broadcastLayers)
    .set({ config: { ...config, playlistId } })
    .where(eq(broadcastLayers.id, layerId));

  const [row] = await db
    .update(broadcastOutputs)
    .set({ updatedAt: sql`now()` })
    .where(eq(broadcastOutputs.id, outputId))
    .returning();
  return row as BroadcastOutputRecord;
}

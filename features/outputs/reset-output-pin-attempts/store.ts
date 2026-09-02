import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputs } from "../../../database/schema";

// Só o token (o limitador de PIN é chaveado por token, não por id) — o service resolve isto antes
// de limpar o contador em memória.
export async function findOutputTokenById(id: string): Promise<string | null> {
  const [row] = await db
    .select({ token: broadcastOutputs.token })
    .from(broadcastOutputs)
    .where(eq(broadcastOutputs.id, id))
    .limit(1);
  return row?.token ?? null;
}

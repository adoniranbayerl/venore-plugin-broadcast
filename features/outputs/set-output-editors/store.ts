import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputEditors, broadcastOutputs } from "../../../database/schema";
import type { BroadcastOutputRecord } from "../../../contracts/types";

export async function findOutputById(id: string): Promise<BroadcastOutputRecord | null> {
  const [row] = await db.select().from(broadcastOutputs).where(eq(broadcastOutputs.id, id)).limit(1);
  return (row as BroadcastOutputRecord) ?? null;
}

export async function replaceOutputEditors(outputId: string, userIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(broadcastOutputEditors).where(eq(broadcastOutputEditors.outputId, outputId));
    if (userIds.length > 0) {
      await tx.insert(broadcastOutputEditors).values(userIds.map((userId) => ({ outputId, userId })));
    }
  });
}

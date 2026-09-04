import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputs } from "../../../database/schema";

export async function findOutputNameByToken(token: string): Promise<string | null> {
  const [row] = await db.select({ name: broadcastOutputs.name }).from(broadcastOutputs).where(eq(broadcastOutputs.token, token)).limit(1);
  return row?.name ?? null;
}

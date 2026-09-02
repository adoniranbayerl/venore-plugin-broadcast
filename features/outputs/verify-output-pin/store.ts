import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputs } from "../../../database/schema";

// Seleciona só a coluna pin (nunca a linha inteira) — quem chama nunca vê o PIN armazenado além
// do necessário pra comparar, e o service nunca repassa esse valor pra fora (ver types.ts).
export async function findOutputPinByToken(token: string): Promise<{ pin: string | null } | null> {
  const [row] = await db.select({ pin: broadcastOutputs.pin }).from(broadcastOutputs).where(eq(broadcastOutputs.token, token)).limit(1);
  return row ?? null;
}

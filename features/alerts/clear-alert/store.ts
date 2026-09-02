import { gt } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAlerts } from "../../../database/schema";

// "Limpar" = fazer todo alerta ainda válido (expiresAt no futuro) expirar agora — não apaga a
// linha (histórico), só reduz expiresAt pro passado, mesmo efeito de "sumir da tela" que o CHECK
// de get-output-state (expiresAt > now) já respeitava antes.
export async function expireActiveAlerts(): Promise<number> {
  const rows = await db
    .update(broadcastAlerts)
    .set({ expiresAt: new Date() })
    .where(gt(broadcastAlerts.expiresAt, new Date()))
    .returning({ id: broadcastAlerts.id });
  return rows.length;
}

import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendas } from "../../../database/schema";

// Eventos da agenda somem em cascata (FK onDelete: "cascade" no schema) — não precisa de limpeza
// manual aqui.
export async function deleteAgendaById(id: string): Promise<boolean> {
  const rows = await db.delete(broadcastAgendas).where(eq(broadcastAgendas.id, id)).returning({ id: broadcastAgendas.id });
  return rows.length > 0;
}

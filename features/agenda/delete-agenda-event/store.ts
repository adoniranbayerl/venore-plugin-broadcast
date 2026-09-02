import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendaEvents } from "../../../database/schema";

export async function deleteAgendaEventById(id: string): Promise<boolean> {
  const rows = await db.delete(broadcastAgendaEvents).where(eq(broadcastAgendaEvents.id, id)).returning({ id: broadcastAgendaEvents.id });
  return rows.length > 0;
}

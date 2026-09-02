import { asc, eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendaEventDates, broadcastAgendaEvents } from "../../../database/schema";
import type { BroadcastAgendaEventDate, BroadcastAgendaEventRecord } from "../../../contracts/types";

// Datas avulsas de um evento, ordenadas por início — anexadas a todo registro devolvido pelos
// finders daqui (mesmo racional dos outros finders de evento no plugin).
async function findAgendaEventDates(eventId: string): Promise<BroadcastAgendaEventDate[]> {
  const rows = await db
    .select({
      id: broadcastAgendaEventDates.id,
      startAt: broadcastAgendaEventDates.startAt,
      endAt: broadcastAgendaEventDates.endAt,
    })
    .from(broadcastAgendaEventDates)
    .where(eq(broadcastAgendaEventDates.eventId, eventId))
    .orderBy(asc(broadcastAgendaEventDates.startAt));
  return rows as BroadcastAgendaEventDate[];
}

export async function findAgendaEventById(id: string): Promise<BroadcastAgendaEventRecord | null> {
  const [row] = await db.select().from(broadcastAgendaEvents).where(eq(broadcastAgendaEvents.id, id)).limit(1);
  if (!row) return null;
  return { ...(row as Omit<BroadcastAgendaEventRecord, "extraDates">), extraDates: await findAgendaEventDates(id) };
}

export async function applyAgendaEventUpdate(input: {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  recurring: boolean;
  endAt: Date | null;
  coverMediaAssetId: string | null;
  location: string | null;
}): Promise<BroadcastAgendaEventRecord> {
  const [row] = await db
    .update(broadcastAgendaEvents)
    .set({
      title: input.title,
      description: input.description,
      startAt: input.startAt,
      recurring: input.recurring,
      endAt: input.endAt,
      coverMediaAssetId: input.coverMediaAssetId,
      location: input.location,
      updatedAt: sql`now()`,
    })
    .where(eq(broadcastAgendaEvents.id, input.id))
    .returning();
  return { ...(row as Omit<BroadcastAgendaEventRecord, "extraDates">), extraDates: await findAgendaEventDates(input.id) };
}

// Substitui TODAS as datas avulsas do evento numa transação — apaga as atuais e insere as novas.
// dates vazio = evento fica só com a data primária (usado também quando recurring liga).
export async function replaceAgendaEventDates(
  eventId: string,
  dates: { startAt: Date; endAt: Date | null }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(broadcastAgendaEventDates).where(eq(broadcastAgendaEventDates.eventId, eventId));
    if (dates.length > 0) {
      await tx
        .insert(broadcastAgendaEventDates)
        .values(dates.map((date) => ({ eventId, startAt: date.startAt, endAt: date.endAt })));
    }
  });
}

import { asc } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastAgendaEventDates, broadcastAgendaEvents } from "../../../database/schema";
import type { BroadcastAgendaEventDate, BroadcastAgendaEventRecord } from "../../../contracts/types";

// Todos os eventos + todas as datas avulsas em duas queries (sem N+1), agrupadas em JS — o
// formulário de editar evento no admin precisa de event.extraDates pra pré-preencher a seção
// "Outras datas".
export async function findAllAgendaEvents(): Promise<BroadcastAgendaEventRecord[]> {
  const [events, dates] = await Promise.all([
    db.select().from(broadcastAgendaEvents).orderBy(asc(broadcastAgendaEvents.startAt)),
    db
      .select({
        id: broadcastAgendaEventDates.id,
        eventId: broadcastAgendaEventDates.eventId,
        startAt: broadcastAgendaEventDates.startAt,
        endAt: broadcastAgendaEventDates.endAt,
      })
      .from(broadcastAgendaEventDates)
      .orderBy(asc(broadcastAgendaEventDates.startAt)),
  ]);

  const datesByEventId = new Map<string, BroadcastAgendaEventDate[]>();
  for (const date of dates) {
    const bucket = datesByEventId.get(date.eventId) ?? [];
    bucket.push({ id: date.id, startAt: date.startAt, endAt: date.endAt });
    datesByEventId.set(date.eventId, bucket);
  }

  return (events as Omit<BroadcastAgendaEventRecord, "extraDates">[]).map((event) => ({
    ...event,
    extraDates: datesByEventId.get(event.id) ?? [],
  }));
}

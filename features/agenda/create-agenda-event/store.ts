import { db } from "@venore/plugin-sdk";
import { broadcastAgendaEventDates, broadcastAgendaEvents } from "../../../database/schema";
import type { BroadcastAgendaEventDate, BroadcastAgendaEventRecord } from "../../../contracts/types";

export async function insertAgendaEvent(input: {
  agendaId: string;
  title: string;
  description: string | null;
  startAt: Date;
  recurring: boolean;
  endAt: Date | null;
  coverMediaAssetId: string | null;
  location: string | null;
}): Promise<BroadcastAgendaEventRecord> {
  const [row] = await db.insert(broadcastAgendaEvents).values(input).returning();
  // extraDates é sempre anexado por quem lê o evento — recém-inserido não tem nenhuma ainda; o
  // service grava as datas logo em seguida (insertAgendaEventDates) e devolve o registro completo.
  return { ...(row as Omit<BroadcastAgendaEventRecord, "extraDates">), extraDates: [] };
}

// Insere as datas avulsas de um evento já existente e devolve as linhas gravadas (ordenadas por
// início) — o service anexa isso ao registro retornado. [] quando não há nenhuma (evento simples
// de data única ou recorrente).
export async function insertAgendaEventDates(
  eventId: string,
  dates: { startAt: Date; endAt: Date | null }[],
): Promise<BroadcastAgendaEventDate[]> {
  if (dates.length === 0) return [];
  const rows = await db
    .insert(broadcastAgendaEventDates)
    .values(dates.map((date) => ({ eventId, startAt: date.startAt, endAt: date.endAt })))
    .returning({
      id: broadcastAgendaEventDates.id,
      startAt: broadcastAgendaEventDates.startAt,
      endAt: broadcastAgendaEventDates.endAt,
    });
  return (rows as BroadcastAgendaEventDate[])
    .slice()
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

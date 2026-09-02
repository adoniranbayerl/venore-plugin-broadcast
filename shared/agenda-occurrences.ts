import type { BroadcastAgendaEventDate } from "../contracts/types";

// Puro (sem I/O), por isso vive em shared/ — usado pelo store de get-output-state (filtro de
// eventos "no ar") e testável sem banco. Um evento não-recorrente continua no rodízio da agenda
// enquanto a ÚLTIMA ocorrência (primária OU qualquer data extra) ainda não terminou — pedido
// explícito: "sai do rodízio da agenda só quando a última data já passou". Sem endAt, uma
// ocorrência "termina" no próprio início (comportamento original: some quando o horário de início
// passa). Evento recorrente (recurring=true) é sempre "no ar" — startAt é só a âncora do padrão
// semanal (ver weekly-recurrence.ts), nunca a data real da próxima ocorrência.
export function isAgendaEventUpcoming(
  event: { startAt: Date; endAt: Date | null; recurring: boolean; extraDates: BroadcastAgendaEventDate[] },
  now: Date,
): boolean {
  if (event.recurring) return true;
  const lastEnd = Math.max(
    (event.endAt ?? event.startAt).getTime(),
    ...event.extraDates.map((date) => (date.endAt ?? date.startAt).getTime()),
  );
  return lastEnd >= now.getTime();
}

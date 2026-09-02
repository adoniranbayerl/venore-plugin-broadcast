import type { CreateAgendaEventInput } from "./types";

export function validateCreateAgendaEventInput(input: CreateAgendaEventInput): { code: string; message: string } | null {
  if (!input.agendaId) {
    return { code: "broadcast.create-agenda-event.invalid_agenda", message: "Escolha uma agenda." };
  }
  if (!input.title || !input.title.trim()) {
    return { code: "broadcast.create-agenda-event.invalid_title", message: "Informe um título para o evento." };
  }
  if (!(input.startAt instanceof Date) || Number.isNaN(input.startAt.getTime())) {
    return { code: "broadcast.create-agenda-event.invalid_date", message: "Informe uma data válida." };
  }
  // endAt agora é um timestamp completo, não só uma hora (pode ser dias depois do início) — a
  // única regra é que a duração (endAt - startAt) seja positiva; pra evento recorrente essa
  // duração é o que se repete toda semana (ver shared/weekly-recurrence.ts), então precisa fazer
  // sentido no par de âncoras também, não só na primeira ocorrência.
  if (input.endAt) {
    if (!(input.endAt instanceof Date) || Number.isNaN(input.endAt.getTime())) {
      return { code: "broadcast.create-agenda-event.invalid_end_date", message: "Término inválido." };
    }
    if (input.endAt.getTime() <= input.startAt.getTime()) {
      return { code: "broadcast.create-agenda-event.invalid_end_date", message: "O término precisa ser depois do início." };
    }
  }
  // Datas extras (evento em dias separados) — lenient: só checa que cada início é uma data válida e
  // que, quando tem término, ele vem depois do início. O service ignora tudo isso quando recurring.
  for (const extra of input.extraDates ?? []) {
    if (!(extra.startAt instanceof Date) || Number.isNaN(extra.startAt.getTime())) {
      return { code: "broadcast.create-agenda-event.invalid_extra_date", message: "Uma das datas extras é inválida." };
    }
    if (extra.endAt) {
      if (!(extra.endAt instanceof Date) || Number.isNaN(extra.endAt.getTime())) {
        return { code: "broadcast.create-agenda-event.invalid_extra_date", message: "O término de uma data extra é inválido." };
      }
      if (extra.endAt.getTime() <= extra.startAt.getTime()) {
        return { code: "broadcast.create-agenda-event.invalid_extra_date", message: "O término de uma data extra precisa ser depois do início." };
      }
    }
  }
  return null;
}

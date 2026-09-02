import type { UpdateAgendaEventInput } from "./types";

export function validateUpdateAgendaEventInput(input: UpdateAgendaEventInput): { code: string; message: string } | null {
  if (!input.eventId) {
    return { code: "broadcast.update-agenda-event.invalid_event", message: "Evento inválido." };
  }
  if (!input.title || !input.title.trim()) {
    return { code: "broadcast.update-agenda-event.invalid_title", message: "Informe um título para o evento." };
  }
  if (!(input.startAt instanceof Date) || Number.isNaN(input.startAt.getTime())) {
    return { code: "broadcast.update-agenda-event.invalid_date", message: "Informe uma data válida." };
  }
  // Mesmo racional de create-agenda-event/validation.ts.
  if (input.endAt) {
    if (!(input.endAt instanceof Date) || Number.isNaN(input.endAt.getTime())) {
      return { code: "broadcast.update-agenda-event.invalid_end_date", message: "Término inválido." };
    }
    if (input.endAt.getTime() <= input.startAt.getTime()) {
      return { code: "broadcast.update-agenda-event.invalid_end_date", message: "O término precisa ser depois do início." };
    }
  }
  // Mesmo racional de create-agenda-event/validation.ts (datas extras, lenient).
  for (const extra of input.extraDates ?? []) {
    if (!(extra.startAt instanceof Date) || Number.isNaN(extra.startAt.getTime())) {
      return { code: "broadcast.update-agenda-event.invalid_extra_date", message: "Uma das datas extras é inválida." };
    }
    if (extra.endAt) {
      if (!(extra.endAt instanceof Date) || Number.isNaN(extra.endAt.getTime())) {
        return { code: "broadcast.update-agenda-event.invalid_extra_date", message: "O término de uma data extra é inválido." };
      }
      if (extra.endAt.getTime() <= extra.startAt.getTime()) {
        return { code: "broadcast.update-agenda-event.invalid_extra_date", message: "O término de uma data extra precisa ser depois do início." };
      }
    }
  }
  return null;
}

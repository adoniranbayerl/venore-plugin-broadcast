import { isValidHexColor } from "../../../shared/hex-color";
import type { UpdateAgendaInput } from "./types";

export function validateUpdateAgendaInput(input: UpdateAgendaInput): { code: string; message: string } | null {
  if (!input.agendaId) {
    return { code: "broadcast.update-agenda.invalid_agenda", message: "Agenda inválida." };
  }
  if (!input.name || !input.name.trim()) {
    return { code: "broadcast.update-agenda.invalid_name", message: 'Informe um nome para a agenda (ex: "Semanal").' };
  }
  if (!(input.displaySeconds > 0)) {
    return { code: "broadcast.update-agenda.invalid_duration", message: "O tempo em tela precisa ser maior que zero." };
  }
  if (input.backgroundColor && !isValidHexColor(input.backgroundColor)) {
    return { code: "broadcast.update-agenda.invalid_color", message: "A cor de fundo precisa ser um valor válido (ex: #1a1a2e)." };
  }
  return null;
}

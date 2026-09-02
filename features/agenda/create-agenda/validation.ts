import { isValidHexColor } from "../../../shared/hex-color";
import type { CreateAgendaInput } from "./types";

export function validateCreateAgendaInput(input: CreateAgendaInput): { code: string; message: string } | null {
  if (!input.name || !input.name.trim()) {
    return { code: "broadcast.create-agenda.invalid_name", message: 'Informe um nome para a agenda (ex: "Semanal").' };
  }
  if (input.displaySeconds !== undefined && !(input.displaySeconds > 0)) {
    return { code: "broadcast.create-agenda.invalid_duration", message: "O tempo em tela precisa ser maior que zero." };
  }
  if (input.backgroundColor && !isValidHexColor(input.backgroundColor)) {
    return { code: "broadcast.create-agenda.invalid_color", message: "A cor de fundo precisa ser um valor válido (ex: #1a1a2e)." };
  }
  return null;
}

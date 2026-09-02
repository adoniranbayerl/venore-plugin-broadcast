import type { PublishAlertInput } from "./types";

export function validatePublishAlertInput(input: PublishAlertInput): { code: string; message: string } | null {
  if (!input.message || !input.message.trim()) {
    return { code: "broadcast.publish-alert.invalid_message", message: "Escreva a mensagem do aviso." };
  }
  if (!(input.durationSeconds > 0)) {
    return { code: "broadcast.publish-alert.invalid_duration", message: "A duração precisa ser maior que zero." };
  }
  return null;
}

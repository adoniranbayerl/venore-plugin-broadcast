import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { hashPin } from "../../../shared/pin-hash";
import { applyOutputPin, findOutputById } from "./store";
import type { SetOutputPinCommand, SetOutputPinResult } from "./types";

// Sem publishOutputEvent — diferente de drawer/footer/ticker, o PIN não faz parte de
// BroadcastOutputState (nunca deve ser serializado pro browser, ver contracts/types.ts), então não
// há nada pra sincronizar em tempo real com a view de saída.
export async function setOutputPin(command: SetOutputPinCommand): Promise<SetOutputPinResult> {
  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-pin.not_found", message: "Saída não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-pin",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  // Nunca guarda o PIN em texto plano — a coluna passa a carregar o hash `scrypt$...` (ver
  // shared/pin-hash.ts e verify-output-pin/service.ts). pin=null continua removendo a proteção.
  const pinToStore = command.pin === null ? null : await hashPin(command.pin);
  const record = await applyOutputPin({ id: command.outputId, pin: pinToStore });

  endOperation(handle, { success: true });

  return { success: true, data: record };
}

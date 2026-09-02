import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { publishOutputEvent } from "../../../runtime/output-bus";
import { applyOutputOffline, findOutputById } from "./store";
import type { SetOutputOfflineCommand, SetOutputOfflineResult } from "./types";

// Liga/desliga a tela de espera branded de uma saída — mesmo padrão de set-output-drawer/
// set-output-footer (gate por authorizeOutputActor no handler, publica o evento SSE aqui pra TV
// trocar em ~1s sem revalidatePath no admin).
export async function setOutputOffline(command: SetOutputOfflineCommand): Promise<SetOutputOfflineResult> {
  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-offline.not_found", message: "Saída não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-offline",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const record = await applyOutputOffline({ id: command.outputId, offline: command.offline });

  endOperation(handle, { success: true });
  publishOutputEvent(output.token, { type: "offline-changed", offline: command.offline });

  return { success: true, data: record };
}

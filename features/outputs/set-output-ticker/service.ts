import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { publishOutputEvent } from "../../../runtime/output-bus";
import { applyOutputTicker, findOutputById } from "./store";
import type { SetOutputTickerCommand, SetOutputTickerResult } from "./types";

export async function setOutputTicker(command: SetOutputTickerCommand): Promise<SetOutputTickerResult> {
  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-ticker.not_found", message: "Saída não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-ticker",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const record = await applyOutputTicker({ id: command.outputId, tickerEnabled: command.tickerEnabled });

  endOperation(handle, { success: true });
  publishOutputEvent(output.token, { type: "ticker-changed", tickerEnabled: command.tickerEnabled });

  return { success: true, data: record };
}

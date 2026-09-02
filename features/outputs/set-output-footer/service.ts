import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { publishOutputEvent } from "../../../runtime/output-bus";
import { applyOutputFooter, findOutputById } from "./store";
import type { SetOutputFooterCommand, SetOutputFooterResult } from "./types";

export async function setOutputFooter(command: SetOutputFooterCommand): Promise<SetOutputFooterResult> {
  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-footer.not_found", message: "Saída não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-footer",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const record = await applyOutputFooter({ id: command.outputId, footerOpen: command.footerOpen });

  endOperation(handle, { success: true });
  publishOutputEvent(output.token, { type: "footer-changed", footerOpen: command.footerOpen });

  return { success: true, data: record };
}

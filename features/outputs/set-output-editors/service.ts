import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findOutputById, replaceOutputEditors } from "./store";
import type { SetOutputEditorsCommand, SetOutputEditorsResult } from "./types";

export async function setOutputEditors(command: SetOutputEditorsCommand): Promise<SetOutputEditorsResult> {
  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-editors.not_found", message: "Saída não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-editors",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  await replaceOutputEditors(command.outputId, command.userIds);

  endOperation(handle, { success: true });
  return { success: true, data: { outputId: command.outputId, userIds: command.userIds } };
}

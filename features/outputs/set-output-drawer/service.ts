import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { publishOutputEvent } from "../../../runtime/output-bus";
import { applyOutputDrawer, findOutputById } from "./store";
import type { SetOutputDrawerCommand, SetOutputDrawerResult } from "./types";

export async function setOutputDrawer(command: SetOutputDrawerCommand): Promise<SetOutputDrawerResult> {
  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-drawer.not_found", message: "Saída não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-drawer",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const record = await applyOutputDrawer({ id: command.outputId, drawerOpen: command.drawerOpen });

  endOperation(handle, { success: true });
  publishOutputEvent(output.token, { type: "drawer-changed", drawerOpen: command.drawerOpen });

  return { success: true, data: record };
}

import { findOutputIdsAssignedToUser } from "../../../shared/scoped-authorization";
import { findAllOutputs } from "./store";
import type { ListOutputsResult } from "./types";

// assignedToUserId filtra pra só as saídas atribuídas a este usuário — usado quando o ator só tem
// a permission estreita (broadcast.outputs.manage), não a ampla (broadcast.manage), ver handler.ts.
export async function listOutputs(options?: { assignedToUserId?: string }): Promise<ListOutputsResult> {
  const outputs = await findAllOutputs();
  if (!options?.assignedToUserId) return { success: true, data: outputs };

  const allowedIds = new Set(await findOutputIdsAssignedToUser(options.assignedToUserId));
  return { success: true, data: outputs.filter((output) => allowedIds.has(output.id)) };
}

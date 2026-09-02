import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { deleteOutput } from "./service";
import type { DeleteOutputInput, DeleteOutputResult } from "./types";

export async function deleteOutputHandler(input: DeleteOutputInput): Promise<DeleteOutputResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return deleteOutput(input);
}

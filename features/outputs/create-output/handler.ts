import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { createOutput } from "./service";
import { validateCreateOutputInput } from "./validation";
import type { CreateOutputInput, CreateOutputResult } from "./types";

export async function createOutputHandler(input: CreateOutputInput): Promise<CreateOutputResult> {
  const validationError = validateCreateOutputInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return createOutput({ ...input, actorId: authz.actorId });
}

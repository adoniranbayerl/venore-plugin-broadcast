import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { publishAlert } from "./service";
import { validatePublishAlertInput } from "./validation";
import type { PublishAlertInput, PublishAlertResult } from "./types";

export async function publishAlertHandler(input: PublishAlertInput): Promise<PublishAlertResult> {
  const validationError = validatePublishAlertInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return publishAlert({ ...input, actorId: authz.actorId });
}

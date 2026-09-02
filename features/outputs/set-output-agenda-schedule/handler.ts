import { authorizeOutputActor } from "../../../shared/scoped-authorization";
import { setOutputAgendaSchedule } from "./service";
import type { SetOutputAgendaScheduleInput, SetOutputAgendaScheduleResult } from "./types";

export async function setOutputAgendaScheduleHandler(input: SetOutputAgendaScheduleInput): Promise<SetOutputAgendaScheduleResult> {
  const authz = await authorizeOutputActor(input.outputId);
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return setOutputAgendaSchedule({ ...input, actorId: authz.actorId });
}

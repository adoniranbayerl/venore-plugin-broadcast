import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { publishOutputEvent } from "../../../runtime/output-bus";
import { applyOutputAgendaSchedule, findOutputById } from "./store";
import type { SetOutputAgendaScheduleCommand, SetOutputAgendaScheduleResult } from "./types";

// null/0 vira null (desliga aquele campo); negativo ou não-inteiro é erro — mesmo nível de checagem
// que os outros campos numéricos do plugin (ver requireNumber/optionalNumber em
// components/admin/actions.ts, que já garantem "número finito" antes de chegar aqui; isto cobre o
// resto do contrato: inteiro e não-negativo).
function normalizeSeconds(value: number | null): { ok: true; value: number | null } | { ok: false } {
  if (value === null || value === 0) return { ok: true, value: null };
  if (!Number.isInteger(value) || value < 0) return { ok: false };
  return { ok: true, value };
}

export async function setOutputAgendaSchedule(command: SetOutputAgendaScheduleCommand): Promise<SetOutputAgendaScheduleResult> {
  const normalizedOpen = normalizeSeconds(command.agendaOpenSeconds);
  const normalizedPause = normalizeSeconds(command.agendaPauseSeconds);
  if (!normalizedOpen.ok || !normalizedPause.ok) {
    return {
      success: false,
      error: { code: "broadcast.set-output-agenda-schedule.invalid_value", message: "Os tempos precisam ser em segundos, inteiros e positivos." },
    };
  }
  // Os dois campos formam um par — ter só um preenchido não liga o ciclo (ver useAgendaRotationSchedule
  // em output-canvas.tsx), e ficaria confuso pro operador salvar um valor que não faz nada sozinho.
  if (Boolean(normalizedOpen.value) !== Boolean(normalizedPause.value)) {
    return {
      success: false,
      error: {
        code: "broadcast.set-output-agenda-schedule.incomplete_pair",
        message: "Preencha os dois tempos (aberto e pausa) ou deixe os dois em branco.",
      },
    };
  }

  const output = await findOutputById(command.outputId);
  if (!output) {
    return { success: false, error: { code: "broadcast.set-output-agenda-schedule.not_found", message: "Saída não encontrada." } };
  }

  const handle = beginOperation({
    useCase: "broadcast.set-output-agenda-schedule",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const record = await applyOutputAgendaSchedule({
    id: command.outputId,
    agendaOpenSeconds: normalizedOpen.value,
    agendaPauseSeconds: normalizedPause.value,
  });

  endOperation(handle, { success: true });
  publishOutputEvent(output.token, {
    type: "agenda-schedule-changed",
    agendaOpenSeconds: normalizedOpen.value,
    agendaPauseSeconds: normalizedPause.value,
  });

  return { success: true, data: record };
}

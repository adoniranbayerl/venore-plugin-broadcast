import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const publishOutputEvent = vi.fn();
vi.mock("../../../runtime/output-bus", () => ({
  publishOutputEvent: (...args: unknown[]) => publishOutputEvent(...args),
}));

const findOutputById = vi.fn();
const applyOutputAgendaSchedule = vi.fn();
vi.mock("./store", () => ({
  findOutputById: (...args: unknown[]) => findOutputById(...args),
  applyOutputAgendaSchedule: (...args: unknown[]) => applyOutputAgendaSchedule(...args),
}));

describe("setOutputAgendaSchedule", () => {
  beforeEach(() => {
    findOutputById.mockReset();
    applyOutputAgendaSchedule.mockReset();
    publishOutputEvent.mockReset();
  });

  it("rejects a negative value", async () => {
    const { setOutputAgendaSchedule } = await import("./service");
    const result = await setOutputAgendaSchedule({ outputId: "o1", agendaOpenSeconds: -5, agendaPauseSeconds: 60, actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-agenda-schedule.invalid_value");
    expect(findOutputById).not.toHaveBeenCalled();
  });

  it("rejects a non-integer value", async () => {
    const { setOutputAgendaSchedule } = await import("./service");
    const result = await setOutputAgendaSchedule({ outputId: "o1", agendaOpenSeconds: 180.5, agendaPauseSeconds: 60, actorId: "actor-1" });

    expect(result.success).toBe(false);
  });

  it("rejects only one of the pair being set", async () => {
    const { setOutputAgendaSchedule } = await import("./service");
    const result = await setOutputAgendaSchedule({ outputId: "o1", agendaOpenSeconds: 180, agendaPauseSeconds: null, actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-agenda-schedule.incomplete_pair");
    expect(findOutputById).not.toHaveBeenCalled();
  });

  it("normalizes 0/0 to null/null (ciclo desligado)", async () => {
    findOutputById.mockResolvedValue({ id: "o1", token: "recepcao" });
    applyOutputAgendaSchedule.mockResolvedValue({ id: "o1", agendaOpenSeconds: null, agendaPauseSeconds: null });

    const { setOutputAgendaSchedule } = await import("./service");
    const result = await setOutputAgendaSchedule({ outputId: "o1", agendaOpenSeconds: 0, agendaPauseSeconds: 0, actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(applyOutputAgendaSchedule).toHaveBeenCalledWith({ id: "o1", agendaOpenSeconds: null, agendaPauseSeconds: null });
  });

  it("fails when the output does not exist", async () => {
    findOutputById.mockResolvedValue(null);

    const { setOutputAgendaSchedule } = await import("./service");
    const result = await setOutputAgendaSchedule({ outputId: "missing", agendaOpenSeconds: 180, agendaPauseSeconds: 60, actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-agenda-schedule.not_found");
  });

  it("sets a valid open/pause pair and publishes the change", async () => {
    findOutputById.mockResolvedValue({ id: "o1", token: "recepcao" });
    applyOutputAgendaSchedule.mockResolvedValue({ id: "o1", agendaOpenSeconds: 180, agendaPauseSeconds: 60 });

    const { setOutputAgendaSchedule } = await import("./service");
    const result = await setOutputAgendaSchedule({ outputId: "o1", agendaOpenSeconds: 180, agendaPauseSeconds: 60, actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(applyOutputAgendaSchedule).toHaveBeenCalledWith({ id: "o1", agendaOpenSeconds: 180, agendaPauseSeconds: 60 });
    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", {
      type: "agenda-schedule-changed",
      agendaOpenSeconds: 180,
      agendaPauseSeconds: 60,
    });
  });
});

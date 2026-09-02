import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const findAgendaEventById = vi.fn();
const applyAgendaEventUpdate = vi.fn();
const replaceAgendaEventDates = vi.fn();
vi.mock("./store", () => ({
  findAgendaEventById: (...args: unknown[]) => findAgendaEventById(...args),
  applyAgendaEventUpdate: (...args: unknown[]) => applyAgendaEventUpdate(...args),
  replaceAgendaEventDates: (...args: unknown[]) => replaceAgendaEventDates(...args),
}));

const baseCommand = {
  eventId: "e1",
  title: "Evento",
  startAt: new Date("2026-09-10T14:00:00Z"),
  actorId: "actor-1",
};

describe("updateAgendaEvent", () => {
  beforeEach(() => {
    findAgendaEventById.mockReset();
    applyAgendaEventUpdate.mockReset();
    replaceAgendaEventDates.mockReset();
    findAgendaEventById.mockResolvedValue({ id: "e1", extraDates: [] });
    applyAgendaEventUpdate.mockResolvedValue({ id: "e1", title: "Evento", extraDates: [] });
  });

  it("replaces all of the event's extra dates with the ones supplied", async () => {
    const { updateAgendaEvent } = await import("./service");
    const extraDates = [
      { startAt: new Date("2026-09-15T14:00:00Z"), endAt: new Date("2026-09-15T16:00:00Z") },
      { startAt: new Date("2026-09-20T09:00:00Z") },
    ];

    const result = await updateAgendaEvent({ ...baseCommand, extraDates });

    expect(result.success).toBe(true);
    expect(replaceAgendaEventDates).toHaveBeenCalledWith("e1", [
      { startAt: extraDates[0].startAt, endAt: extraDates[0].endAt },
      { startAt: extraDates[1].startAt, endAt: null },
    ]);
    // A substituição roda ANTES do update do evento (pra applyAgendaEventUpdate reler as datas).
    expect(replaceAgendaEventDates.mock.invocationCallOrder[0]).toBeLessThan(
      applyAgendaEventUpdate.mock.invocationCallOrder[0],
    );
  });

  it("persists zero extra dates for a recurring event, even if some were supplied", async () => {
    const { updateAgendaEvent } = await import("./service");

    await updateAgendaEvent({
      ...baseCommand,
      recurring: true,
      extraDates: [{ startAt: new Date("2026-09-15T14:00:00Z") }],
    });

    expect(replaceAgendaEventDates).toHaveBeenCalledWith("e1", []);
  });

  it("clears the extra dates when none are supplied", async () => {
    const { updateAgendaEvent } = await import("./service");

    await updateAgendaEvent(baseCommand);

    expect(replaceAgendaEventDates).toHaveBeenCalledWith("e1", []);
  });

  it("fails with not_found and never touches the dates when the event does not exist", async () => {
    findAgendaEventById.mockResolvedValue(null);
    const { updateAgendaEvent } = await import("./service");

    const result = await updateAgendaEvent({ ...baseCommand, extraDates: [{ startAt: new Date("2026-09-15T14:00:00Z") }] });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.update-agenda-event.not_found");
    expect(replaceAgendaEventDates).not.toHaveBeenCalled();
    expect(applyAgendaEventUpdate).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// Handler de agenda — cobre os 3 estados do gate de escopo (via authorizeAgendaActor, ver
// shared/scoped-authorization): sem permission / com a permission estreita mas sem atribuição /
// com permission + atribuição. Mocka só @/contexts/rbac (authorizeActor) e o store de escopo; a
// validação de input roda de verdade.
const authorizeActor = vi.fn();
vi.mock("@venore/plugin-sdk/rbac", () => ({
  authorizeActor: (...args: unknown[]) => authorizeActor(...args),
}));

const isUserAssignedToAgenda = vi.fn();
vi.mock("../../../shared/scoped-authorization/store", () => ({
  isUserAssignedToAgenda: (...args: unknown[]) => isUserAssignedToAgenda(...args),
  isUserAssignedToOutput: vi.fn(),
  isUserAssignedToPlaylist: vi.fn(),
  findAgendaIdByEventId: vi.fn(),
  findPlaylistIdByItemId: vi.fn(),
  findAgendaIdsAssignedToUser: vi.fn(),
  findOutputIdsAssignedToUser: vi.fn(),
  findPlaylistIdsAssignedToUser: vi.fn(),
}));

const createAgendaEvent = vi.fn();
vi.mock("./service", () => ({
  createAgendaEvent: (...args: unknown[]) => createAgendaEvent(...args),
}));

const forbidden = { authorized: false as const, error: { code: "rbac.authorization.forbidden", message: "forbidden" } };
const input = { agendaId: "agenda-1", title: "Reunião de pais", startAt: new Date("2026-09-01T13:00:00Z") };

describe("createAgendaEventHandler", () => {
  beforeEach(() => {
    authorizeActor.mockReset();
    isUserAssignedToAgenda.mockReset();
    createAgendaEvent.mockReset();
  });

  it("fails validation before authorization when the title is blank", async () => {
    const { createAgendaEventHandler } = await import("./handler");
    const result = await createAgendaEventHandler({ ...input, title: "   " });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.create-agenda-event.invalid_title");
    expect(authorizeActor).not.toHaveBeenCalled();
  });

  it("rejects an actor with neither broadcast.manage nor broadcast.agenda.manage, without touching the service", async () => {
    authorizeActor.mockResolvedValue(forbidden);

    const { createAgendaEventHandler } = await import("./handler");
    const result = await createAgendaEventHandler(input);

    expect(result).toEqual({ success: false, error: forbidden.error });
    expect(isUserAssignedToAgenda).not.toHaveBeenCalled();
    expect(createAgendaEvent).not.toHaveBeenCalled();
  });

  it("rejects a scoped editor (broadcast.agenda.manage) who is NOT assigned to the agenda", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.agenda.manage" ? { authorized: true, actorId: "editor-3" } : forbidden,
    );
    isUserAssignedToAgenda.mockResolvedValue(false);

    const { createAgendaEventHandler } = await import("./handler");
    const result = await createAgendaEventHandler(input);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.agenda.forbidden_resource");
    expect(isUserAssignedToAgenda).toHaveBeenCalledWith("agenda-1", "editor-3");
    expect(createAgendaEvent).not.toHaveBeenCalled();
  });

  it("calls the service with the resolved actorId for a scoped editor assigned to the agenda", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.agenda.manage" ? { authorized: true, actorId: "editor-3" } : forbidden,
    );
    isUserAssignedToAgenda.mockResolvedValue(true);
    createAgendaEvent.mockResolvedValue({ success: true, data: { id: "event-1" } });

    const { createAgendaEventHandler } = await import("./handler");
    const result = await createAgendaEventHandler(input);

    expect(createAgendaEvent).toHaveBeenCalledWith({ ...input, actorId: "editor-3" });
    expect(result).toEqual({ success: true, data: { id: "event-1" } });
  });
});

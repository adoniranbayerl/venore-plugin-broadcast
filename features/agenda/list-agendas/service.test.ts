import { beforeEach, describe, expect, it, vi } from "vitest";

const findAllAgendas = vi.fn();
vi.mock("./store", () => ({
  findAllAgendas: (...args: unknown[]) => findAllAgendas(...args),
}));

const findAgendaIdsAssignedToUser = vi.fn();
vi.mock("../../../shared/scoped-authorization", () => ({
  findAgendaIdsAssignedToUser: (...args: unknown[]) => findAgendaIdsAssignedToUser(...args),
}));

describe("listAgendas", () => {
  beforeEach(() => {
    findAllAgendas.mockReset();
    findAgendaIdsAssignedToUser.mockReset();
    findAllAgendas.mockResolvedValue([
      { id: "a1", name: "Semanal" },
      { id: "a2", name: "Mensal" },
      { id: "a3", name: "Administrativo" },
    ]);
  });

  it("returns every agenda when no assignedToUserId filter is given (broadcast.manage path)", async () => {
    const { listAgendas } = await import("./service");
    const result = await listAgendas();

    expect(result.success && result.data).toHaveLength(3);
    expect(findAgendaIdsAssignedToUser).not.toHaveBeenCalled();
  });

  it("filters to only the agendas assigned to the user when assignedToUserId is given (scoped editor path)", async () => {
    findAgendaIdsAssignedToUser.mockResolvedValue(["a3"]);

    const { listAgendas } = await import("./service");
    const result = await listAgendas({ assignedToUserId: "editor-1" });

    expect(result.success && result.data.map((agenda) => agenda.id)).toEqual(["a3"]);
    expect(findAgendaIdsAssignedToUser).toHaveBeenCalledWith("editor-1");
  });

  it("returns an empty list when the user has no assignments at all", async () => {
    findAgendaIdsAssignedToUser.mockResolvedValue([]);

    const { listAgendas } = await import("./service");
    const result = await listAgendas({ assignedToUserId: "editor-1" });

    expect(result.success && result.data).toEqual([]);
  });
});

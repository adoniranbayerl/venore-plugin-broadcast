import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const findAllAgendas = vi.fn();
const reorderAgendas = vi.fn();

vi.mock("./store", () => ({
  findAllAgendas: (...args: unknown[]) => findAllAgendas(...args),
  reorderAgendas: (...args: unknown[]) => reorderAgendas(...args),
}));

function agenda(id: string, order: number) {
  return {
    id,
    name: id,
    displaySeconds: 20,
    order,
    backgroundColor: null,
    logoMediaAssetId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("reorderAgendasService", () => {
  beforeEach(() => {
    findAllAgendas.mockReset();
    reorderAgendas.mockReset();
  });

  it("fails when the provided agendaIds do not match the existing agendas exactly", async () => {
    findAllAgendas.mockResolvedValue([agenda("a1", 0), agenda("a2", 1)]);

    const { reorderAgendasService } = await import("./service");
    const result = await reorderAgendasService({ agendaIds: ["a1", "a3"], actorId: "actor-1" });

    expect(result).toEqual({
      success: false,
      error: { code: "broadcast.reorder-agendas.mismatch", message: expect.any(String) },
    });
    expect(reorderAgendas).not.toHaveBeenCalled();
  });

  it("reorders the agendas when the set of ids matches exactly", async () => {
    findAllAgendas.mockResolvedValue([agenda("a1", 0), agenda("a2", 1)]);
    reorderAgendas.mockResolvedValue([agenda("a2", 0), agenda("a1", 1)]);

    const { reorderAgendasService } = await import("./service");
    const result = await reorderAgendasService({ agendaIds: ["a2", "a1"], actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(reorderAgendas).toHaveBeenCalledWith(["a2", "a1"]);
  });
});

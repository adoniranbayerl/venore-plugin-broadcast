import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const createOutputWithDefaultScene = vi.fn();
vi.mock("./store", () => ({
  createOutputWithDefaultScene: (...args: unknown[]) => createOutputWithDefaultScene(...args),
}));

describe("createOutput", () => {
  beforeEach(() => {
    createOutputWithDefaultScene.mockReset();
  });

  it("trims the name and forwards the chosen playlist to the store", async () => {
    createOutputWithDefaultScene.mockResolvedValue({ id: "o1", name: "TV da recepção", token: "tv-da-recepcao" });

    const { createOutput } = await import("./service");
    const result = await createOutput({ name: "  TV da recepção  ", playlistId: "p1", actorId: "actor-1" });

    expect(result).toEqual({ success: true, data: { id: "o1", name: "TV da recepção", token: "tv-da-recepcao" } });
    expect(createOutputWithDefaultScene).toHaveBeenCalledWith({ name: "TV da recepção", playlistId: "p1" });
  });
});

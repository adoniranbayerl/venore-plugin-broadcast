import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({
    operationId: "op-1",
    useCase: "test",
    actor: { id: "actor-1", type: "user" },
    kind: "write",
    startedAt: new Date(),
  })),
  endOperation: vi.fn(),
}));

const insertPlaylist = vi.fn();
vi.mock("./store", () => ({
  insertPlaylist: (...args: unknown[]) => insertPlaylist(...args),
}));

describe("createPlaylist", () => {
  beforeEach(() => {
    insertPlaylist.mockReset();
    insertPlaylist.mockResolvedValue({ id: "p1", name: "Externo", folderPath: "videos" });
  });

  it("always creates the playlist pointed at the shared videos folder (no per-playlist folderPath input anymore)", async () => {
    const { createPlaylist } = await import("./service");
    await createPlaylist({ name: "Externo", actorId: "actor-1" });

    expect(insertPlaylist).toHaveBeenCalledWith({ name: "Externo", folderPath: "videos" });
  });

  it("trims the playlist name", async () => {
    const { createPlaylist } = await import("./service");
    await createPlaylist({ name: "  Catracas  ", actorId: "actor-1" });

    expect(insertPlaylist).toHaveBeenCalledWith({ name: "Catracas", folderPath: "videos" });
  });
});

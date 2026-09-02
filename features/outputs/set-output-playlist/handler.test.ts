import { beforeEach, describe, expect, it, vi } from "vitest";

// Cobre os 3 estados do gate de escopo (via authorizeOutputActor, ver shared/scoped-authorization):
// sem permission / com a permission estreita mas sem atribuição / com permission + atribuição.
// Mocka só @/contexts/rbac (authorizeActor) e o store de escopo — o resto do caminho
// (authorizeOutputActor) roda de verdade.
const authorizeActor = vi.fn();
vi.mock("@venore/plugin-sdk/rbac", () => ({
  authorizeActor: (...args: unknown[]) => authorizeActor(...args),
}));

const isUserAssignedToOutput = vi.fn();
vi.mock("../../../shared/scoped-authorization/store", () => ({
  isUserAssignedToAgenda: vi.fn(),
  isUserAssignedToOutput: (...args: unknown[]) => isUserAssignedToOutput(...args),
  isUserAssignedToPlaylist: vi.fn(),
  findAgendaIdByEventId: vi.fn(),
  findPlaylistIdByItemId: vi.fn(),
  findAgendaIdsAssignedToUser: vi.fn(),
  findOutputIdsAssignedToUser: vi.fn(),
  findPlaylistIdsAssignedToUser: vi.fn(),
}));

const setOutputPlaylist = vi.fn();
vi.mock("./service", () => ({
  setOutputPlaylist: (...args: unknown[]) => setOutputPlaylist(...args),
}));

const forbidden = { authorized: false as const, error: { code: "rbac.authorization.forbidden", message: "forbidden" } };
const input = { outputId: "output-1", playlistId: "playlist-1" };

describe("setOutputPlaylistHandler", () => {
  beforeEach(() => {
    authorizeActor.mockReset();
    isUserAssignedToOutput.mockReset();
    setOutputPlaylist.mockReset();
  });

  it("rejects an actor with neither broadcast.manage nor broadcast.outputs.manage, without touching the service", async () => {
    authorizeActor.mockResolvedValue(forbidden);

    const { setOutputPlaylistHandler } = await import("./handler");
    const result = await setOutputPlaylistHandler(input);

    expect(result).toEqual({ success: false, error: forbidden.error });
    expect(isUserAssignedToOutput).not.toHaveBeenCalled();
    expect(setOutputPlaylist).not.toHaveBeenCalled();
  });

  it("rejects a scoped editor (broadcast.outputs.manage) who is NOT assigned to the output", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.outputs.manage" ? { authorized: true, actorId: "editor-1" } : forbidden,
    );
    isUserAssignedToOutput.mockResolvedValue(false);

    const { setOutputPlaylistHandler } = await import("./handler");
    const result = await setOutputPlaylistHandler(input);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.outputs.forbidden_resource");
    expect(isUserAssignedToOutput).toHaveBeenCalledWith("output-1", "editor-1");
    expect(setOutputPlaylist).not.toHaveBeenCalled();
  });

  it("calls the service with the resolved actorId for a scoped editor assigned to the output", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.outputs.manage" ? { authorized: true, actorId: "editor-1" } : forbidden,
    );
    isUserAssignedToOutput.mockResolvedValue(true);
    setOutputPlaylist.mockResolvedValue({ success: true, data: { id: "output-1" } });

    const { setOutputPlaylistHandler } = await import("./handler");
    const result = await setOutputPlaylistHandler(input);

    expect(setOutputPlaylist).toHaveBeenCalledWith({ outputId: "output-1", playlistId: "playlist-1", actorId: "editor-1" });
    expect(result).toEqual({ success: true, data: { id: "output-1" } });
  });

  it("lets broadcast.manage through without an assignment lookup", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.manage" ? { authorized: true, actorId: "admin-1" } : forbidden,
    );
    setOutputPlaylist.mockResolvedValue({ success: true, data: { id: "output-1" } });

    const { setOutputPlaylistHandler } = await import("./handler");
    await setOutputPlaylistHandler(input);

    expect(isUserAssignedToOutput).not.toHaveBeenCalled();
    expect(setOutputPlaylist).toHaveBeenCalledWith({ outputId: "output-1", playlistId: "playlist-1", actorId: "admin-1" });
  });
});

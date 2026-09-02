import { beforeEach, describe, expect, it, vi } from "vitest";

// Cobre os 3 estados do gate de escopo (via authorizeOutputActor, ver shared/scoped-authorization):
// sem permission / com a permission estreita mas sem atribuição / com permission + atribuição.
// Mesmo padrão de set-output-playlist/handler.test.ts.
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

const setOutputOffline = vi.fn();
vi.mock("./service", () => ({
  setOutputOffline: (...args: unknown[]) => setOutputOffline(...args),
}));

const forbidden = { authorized: false as const, error: { code: "rbac.authorization.forbidden", message: "forbidden" } };
const input = { outputId: "output-1", offline: true };

describe("setOutputOfflineHandler", () => {
  beforeEach(() => {
    authorizeActor.mockReset();
    isUserAssignedToOutput.mockReset();
    setOutputOffline.mockReset();
  });

  it("rejects an actor with neither broadcast.manage nor broadcast.outputs.manage, without touching the service", async () => {
    authorizeActor.mockResolvedValue(forbidden);

    const { setOutputOfflineHandler } = await import("./handler");
    const result = await setOutputOfflineHandler(input);

    expect(result).toEqual({ success: false, error: forbidden.error });
    expect(isUserAssignedToOutput).not.toHaveBeenCalled();
    expect(setOutputOffline).not.toHaveBeenCalled();
  });

  it("rejects a scoped editor (broadcast.outputs.manage) who is NOT assigned to the output", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.outputs.manage" ? { authorized: true, actorId: "editor-1" } : forbidden,
    );
    isUserAssignedToOutput.mockResolvedValue(false);

    const { setOutputOfflineHandler } = await import("./handler");
    const result = await setOutputOfflineHandler(input);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.outputs.forbidden_resource");
    expect(setOutputOffline).not.toHaveBeenCalled();
  });

  it("calls the service with the resolved actorId for a scoped editor assigned to the output", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.outputs.manage" ? { authorized: true, actorId: "editor-1" } : forbidden,
    );
    isUserAssignedToOutput.mockResolvedValue(true);
    setOutputOffline.mockResolvedValue({ success: true, data: { id: "output-1" } });

    const { setOutputOfflineHandler } = await import("./handler");
    const result = await setOutputOfflineHandler(input);

    expect(setOutputOffline).toHaveBeenCalledWith({ outputId: "output-1", offline: true, actorId: "editor-1" });
    expect(result).toEqual({ success: true, data: { id: "output-1" } });
  });

  it("lets broadcast.manage through without an assignment lookup", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.manage" ? { authorized: true, actorId: "admin-1" } : forbidden,
    );
    setOutputOffline.mockResolvedValue({ success: true, data: { id: "output-1" } });

    const { setOutputOfflineHandler } = await import("./handler");
    await setOutputOfflineHandler(input);

    expect(isUserAssignedToOutput).not.toHaveBeenCalled();
    expect(setOutputOffline).toHaveBeenCalledWith({ outputId: "output-1", offline: true, actorId: "admin-1" });
  });
});

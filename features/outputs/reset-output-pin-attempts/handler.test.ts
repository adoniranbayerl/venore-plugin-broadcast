import { beforeEach, describe, expect, it, vi } from "vitest";

// Mesmo padrão de set-output-pin/set-output-playlist: mocka só @/contexts/rbac e o store de
// escopo; authorizeOutputActor roda de verdade.
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

const resetOutputPinAttempts = vi.fn();
vi.mock("./service", () => ({
  resetOutputPinAttempts: (...args: unknown[]) => resetOutputPinAttempts(...args),
}));

const forbidden = { authorized: false as const, error: { code: "rbac.authorization.forbidden", message: "forbidden" } };
const input = { outputId: "output-1" };

describe("resetOutputPinAttemptsHandler", () => {
  beforeEach(() => {
    authorizeActor.mockReset();
    isUserAssignedToOutput.mockReset();
    resetOutputPinAttempts.mockReset();
  });

  it("rejects an actor without the required permissions, without touching the service", async () => {
    authorizeActor.mockResolvedValue(forbidden);

    const { resetOutputPinAttemptsHandler } = await import("./handler");
    const result = await resetOutputPinAttemptsHandler(input);

    expect(result).toEqual({ success: false, error: forbidden.error });
    expect(resetOutputPinAttempts).not.toHaveBeenCalled();
  });

  it("rejects a scoped editor not assigned to the output", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.outputs.manage" ? { authorized: true, actorId: "editor-1" } : forbidden,
    );
    isUserAssignedToOutput.mockResolvedValue(false);

    const { resetOutputPinAttemptsHandler } = await import("./handler");
    const result = await resetOutputPinAttemptsHandler(input);

    expect(result.success).toBe(false);
    expect(resetOutputPinAttempts).not.toHaveBeenCalled();
  });

  it("lets broadcast.manage through to the service", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.manage" ? { authorized: true, actorId: "admin-1" } : forbidden,
    );
    resetOutputPinAttempts.mockResolvedValue({ success: true, data: { cleared: 2 } });

    const { resetOutputPinAttemptsHandler } = await import("./handler");
    const result = await resetOutputPinAttemptsHandler(input);

    expect(isUserAssignedToOutput).not.toHaveBeenCalled();
    expect(resetOutputPinAttempts).toHaveBeenCalledWith(input);
    expect(result).toEqual({ success: true, data: { cleared: 2 } });
  });
});

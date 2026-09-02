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
const applyOutputOffline = vi.fn();
vi.mock("./store", () => ({
  findOutputById: (...args: unknown[]) => findOutputById(...args),
  applyOutputOffline: (...args: unknown[]) => applyOutputOffline(...args),
}));

describe("setOutputOffline", () => {
  beforeEach(() => {
    findOutputById.mockReset();
    applyOutputOffline.mockReset();
    publishOutputEvent.mockReset();
  });

  it("fails when the output does not exist", async () => {
    findOutputById.mockResolvedValue(null);

    const { setOutputOffline } = await import("./service");
    const result = await setOutputOffline({ outputId: "missing", offline: true, actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-offline.not_found");
    expect(applyOutputOffline).not.toHaveBeenCalled();
  });

  it("updates the flag and publishes an offline-changed event to the output's token", async () => {
    findOutputById.mockResolvedValue({ id: "o1", token: "recepcao" });
    applyOutputOffline.mockResolvedValue({ id: "o1", offline: true });

    const { setOutputOffline } = await import("./service");
    const result = await setOutputOffline({ outputId: "o1", offline: true, actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(applyOutputOffline).toHaveBeenCalledWith({ id: "o1", offline: true });
    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", { type: "offline-changed", offline: true });
  });

  it("publishes offline=false when turning the standby screen back off", async () => {
    findOutputById.mockResolvedValue({ id: "o1", token: "recepcao" });
    applyOutputOffline.mockResolvedValue({ id: "o1", offline: false });

    const { setOutputOffline } = await import("./service");
    await setOutputOffline({ outputId: "o1", offline: false, actorId: "actor-1" });

    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", { type: "offline-changed", offline: false });
  });
});

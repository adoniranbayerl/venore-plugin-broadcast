import { beforeEach, describe, expect, it, vi } from "vitest";

const authorizeActor = vi.fn();
vi.mock("@venore/plugin-sdk/rbac", () => ({
  authorizeActor: (...args: unknown[]) => authorizeActor(...args),
}));

const listConnectedOutputIps = vi.fn();
vi.mock("./service", () => ({
  listConnectedOutputIps: (...args: unknown[]) => listConnectedOutputIps(...args),
}));

describe("listConnectedOutputIpsHandler", () => {
  beforeEach(() => {
    authorizeActor.mockReset();
    listConnectedOutputIps.mockReset();
  });

  it("requires broadcast.manage and never reads the bus when the actor is not authorized", async () => {
    authorizeActor.mockResolvedValue({ authorized: false, error: { code: "rbac.authorization.unauthenticated", message: "..." } });

    const { listConnectedOutputIpsHandler } = await import("./handler");
    const result = await listConnectedOutputIpsHandler();

    expect(authorizeActor).toHaveBeenCalledWith("broadcast.manage");
    expect(result).toEqual({ success: false, error: { code: "rbac.authorization.unauthenticated", message: "..." } });
    expect(listConnectedOutputIps).not.toHaveBeenCalled();
  });

  it("returns the service result for an authorized actor", async () => {
    authorizeActor.mockResolvedValue({ authorized: true, actorId: "admin-1" });
    listConnectedOutputIps.mockResolvedValue({ success: true, data: { recepcao: ["192.168.0.10"] } });

    const { listConnectedOutputIpsHandler } = await import("./handler");
    const result = await listConnectedOutputIpsHandler();

    expect(result).toEqual({ success: true, data: { recepcao: ["192.168.0.10"] } });
  });
});

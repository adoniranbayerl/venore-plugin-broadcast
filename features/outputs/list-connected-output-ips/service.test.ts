import { beforeEach, describe, expect, it, vi } from "vitest";

const getConnectedOutputIps = vi.fn();
vi.mock("../../../runtime/output-bus", () => ({
  getConnectedOutputIps: (...args: unknown[]) => getConnectedOutputIps(...args),
}));

describe("listConnectedOutputIps", () => {
  beforeEach(() => {
    getConnectedOutputIps.mockReset();
  });

  it("wraps the in-memory bus reading in a success OperationResult", async () => {
    getConnectedOutputIps.mockReturnValue({ recepcao: ["192.168.0.10"], refeitorio: [] });

    const { listConnectedOutputIps } = await import("./service");
    const result = await listConnectedOutputIps();

    expect(result).toEqual({ success: true, data: { recepcao: ["192.168.0.10"], refeitorio: [] } });
  });
});

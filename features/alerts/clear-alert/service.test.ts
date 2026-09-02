import { beforeEach, describe, expect, it, vi } from "vitest";

const publishOutputEvent = vi.fn();
vi.mock("../../../runtime/output-bus", () => ({
  publishOutputEvent: (...args: unknown[]) => publishOutputEvent(...args),
}));

const findAllOutputTokens = vi.fn();
vi.mock("../../../shared/output-tokens", () => ({
  findAllOutputTokens: (...args: unknown[]) => findAllOutputTokens(...args),
}));

const expireActiveAlerts = vi.fn();
vi.mock("./store", () => ({
  expireActiveAlerts: (...args: unknown[]) => expireActiveAlerts(...args),
}));

describe("clearAlert", () => {
  beforeEach(() => {
    publishOutputEvent.mockReset();
    findAllOutputTokens.mockReset();
    expireActiveAlerts.mockReset();
  });

  it("expires active alerts and pushes an alert-changed event to every output", async () => {
    expireActiveAlerts.mockResolvedValue(1);
    findAllOutputTokens.mockResolvedValue(["recepcao", "auditorio"]);

    const { clearAlert } = await import("./service");
    const result = await clearAlert();

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cleared).toBe(1);
    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", { type: "alert-changed" });
    expect(publishOutputEvent).toHaveBeenCalledWith("auditorio", { type: "alert-changed" });
  });

  it("still notifies outputs when nothing needed clearing", async () => {
    expireActiveAlerts.mockResolvedValue(0);
    findAllOutputTokens.mockResolvedValue(["recepcao"]);

    const { clearAlert } = await import("./service");
    const result = await clearAlert();

    expect(result.success).toBe(true);
    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", { type: "alert-changed" });
  });
});

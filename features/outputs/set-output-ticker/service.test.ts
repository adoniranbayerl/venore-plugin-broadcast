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
const applyOutputTicker = vi.fn();
vi.mock("./store", () => ({
  findOutputById: (...args: unknown[]) => findOutputById(...args),
  applyOutputTicker: (...args: unknown[]) => applyOutputTicker(...args),
}));

describe("setOutputTicker", () => {
  beforeEach(() => {
    findOutputById.mockReset();
    applyOutputTicker.mockReset();
    publishOutputEvent.mockReset();
  });

  it("fails when the output does not exist", async () => {
    findOutputById.mockResolvedValue(null);

    const { setOutputTicker } = await import("./service");
    const result = await setOutputTicker({ outputId: "missing", tickerEnabled: true, actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-ticker.not_found");
  });

  it("updates the flag and publishes a ticker-changed event", async () => {
    findOutputById.mockResolvedValue({ id: "o1", token: "recepcao" });
    applyOutputTicker.mockResolvedValue({ id: "o1", tickerEnabled: true });

    const { setOutputTicker } = await import("./service");
    const result = await setOutputTicker({ outputId: "o1", tickerEnabled: true, actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(applyOutputTicker).toHaveBeenCalledWith({ id: "o1", tickerEnabled: true });
    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", { type: "ticker-changed", tickerEnabled: true });
  });
});

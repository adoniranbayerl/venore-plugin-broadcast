import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const findOutputById = vi.fn();
const applyOutputPin = vi.fn();
vi.mock("./store", () => ({
  findOutputById: (...args: unknown[]) => findOutputById(...args),
  applyOutputPin: (...args: unknown[]) => applyOutputPin(...args),
}));

describe("setOutputPin", () => {
  beforeEach(() => {
    findOutputById.mockReset();
    applyOutputPin.mockReset();
  });

  it("fails when the output does not exist", async () => {
    findOutputById.mockResolvedValue(null);

    const { setOutputPin } = await import("./service");
    const result = await setOutputPin({ outputId: "missing", pin: "1234", actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-pin.not_found");
  });

  it("hashes the pin before storing it (never plaintext)", async () => {
    findOutputById.mockResolvedValue({ id: "o1", token: "recepcao" });
    applyOutputPin.mockResolvedValue({ id: "o1", pin: "scrypt$..." });

    const { setOutputPin } = await import("./service");
    const result = await setOutputPin({ outputId: "o1", pin: "1234", actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(applyOutputPin).toHaveBeenCalledTimes(1);
    const stored = applyOutputPin.mock.calls[0][0] as { id: string; pin: string };
    expect(stored.id).toBe("o1");
    expect(stored.pin).not.toBe("1234");
    expect(stored.pin.startsWith("scrypt$")).toBe(true);
  });

  it("clears the pin when null is passed", async () => {
    findOutputById.mockResolvedValue({ id: "o1", token: "recepcao" });
    applyOutputPin.mockResolvedValue({ id: "o1", pin: null });

    const { setOutputPin } = await import("./service");
    const result = await setOutputPin({ outputId: "o1", pin: null, actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(applyOutputPin).toHaveBeenCalledWith({ id: "o1", pin: null });
  });
});

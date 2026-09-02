import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPin } from "../../../shared/pin-hash";

const findOutputPinByToken = vi.fn();
vi.mock("./store", () => ({
  findOutputPinByToken: (...args: unknown[]) => findOutputPinByToken(...args),
}));

describe("verifyOutputPin", () => {
  beforeEach(() => {
    findOutputPinByToken.mockReset();
  });

  it("is not required when the output has no pin configured", async () => {
    findOutputPinByToken.mockResolvedValue({ pin: null });

    const { verifyOutputPin } = await import("./service");
    const result = await verifyOutputPin({ token: "recepcao" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ required: false, valid: true });
  });

  it("is not required when the token doesn't resolve to any output", async () => {
    findOutputPinByToken.mockResolvedValue(null);

    const { verifyOutputPin } = await import("./service");
    const result = await verifyOutputPin({ token: "missing" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ required: false, valid: true });
  });

  it("is required and invalid when the candidate doesn't match the stored hash", async () => {
    findOutputPinByToken.mockResolvedValue({ pin: await hashPin("1234") });

    const { verifyOutputPin } = await import("./service");
    const result = await verifyOutputPin({ token: "recepcao", candidate: "0000" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ required: true, valid: false });
  });

  it("is required and invalid when no candidate is provided", async () => {
    findOutputPinByToken.mockResolvedValue({ pin: await hashPin("1234") });

    const { verifyOutputPin } = await import("./service");
    const result = await verifyOutputPin({ token: "recepcao" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ required: true, valid: false });
  });

  it("is required and valid when the candidate matches the stored hash", async () => {
    findOutputPinByToken.mockResolvedValue({ pin: await hashPin("1234") });

    const { verifyOutputPin } = await import("./service");
    const result = await verifyOutputPin({ token: "recepcao", candidate: "1234" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ required: true, valid: true });
  });

  it("still accepts a legacy plaintext pin (pre-hash rows)", async () => {
    findOutputPinByToken.mockResolvedValue({ pin: "1234" });

    const { verifyOutputPin } = await import("./service");
    const ok = await verifyOutputPin({ token: "recepcao", candidate: "1234" });
    const bad = await verifyOutputPin({ token: "recepcao", candidate: "0000" });

    expect(ok.success && ok.data).toEqual({ required: true, valid: true });
    expect(bad.success && bad.data).toEqual({ required: true, valid: false });
  });
});

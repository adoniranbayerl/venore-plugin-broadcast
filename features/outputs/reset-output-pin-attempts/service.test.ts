import { beforeEach, describe, expect, it, vi } from "vitest";

const findOutputTokenById = vi.fn();
const clearPinAttemptsForToken = vi.fn();
vi.mock("./store", () => ({
  findOutputTokenById: (...args: unknown[]) => findOutputTokenById(...args),
}));
vi.mock("../../../runtime/pin-attempts", () => ({
  clearPinAttemptsForToken: (...args: unknown[]) => clearPinAttemptsForToken(...args),
}));

describe("resetOutputPinAttempts", () => {
  beforeEach(() => {
    findOutputTokenById.mockReset();
    clearPinAttemptsForToken.mockReset();
  });

  it("fails when the output does not exist", async () => {
    findOutputTokenById.mockResolvedValue(null);

    const { resetOutputPinAttempts } = await import("./service");
    const result = await resetOutputPinAttempts({ outputId: "missing" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.reset-output-pin-attempts.not_found");
    expect(clearPinAttemptsForToken).not.toHaveBeenCalled();
  });

  it("clears the in-memory counter for the output token", async () => {
    findOutputTokenById.mockResolvedValue("recepcao");
    clearPinAttemptsForToken.mockReturnValue(3);

    const { resetOutputPinAttempts } = await import("./service");
    const result = await resetOutputPinAttempts({ outputId: "o1" });

    expect(clearPinAttemptsForToken).toHaveBeenCalledWith("recepcao");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ cleared: 3 });
  });
});

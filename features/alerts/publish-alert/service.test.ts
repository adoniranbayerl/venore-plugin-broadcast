import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const publishOutputEvent = vi.fn();
vi.mock("../../../runtime/output-bus", () => ({
  publishOutputEvent: (...args: unknown[]) => publishOutputEvent(...args),
}));

const findAllOutputTokens = vi.fn();
vi.mock("../../../shared/output-tokens", () => ({
  findAllOutputTokens: (...args: unknown[]) => findAllOutputTokens(...args),
}));

const insertAlert = vi.fn();
vi.mock("./store", () => ({
  insertAlert: (...args: unknown[]) => insertAlert(...args),
}));

describe("publishAlert", () => {
  beforeEach(() => {
    publishOutputEvent.mockReset();
    findAllOutputTokens.mockReset();
    insertAlert.mockReset();
  });

  it("inserts the trimmed message and pushes an alert-changed event to every output", async () => {
    insertAlert.mockResolvedValue({ id: "a1", message: "Reunião agora", expiresAt: new Date() });
    findAllOutputTokens.mockResolvedValue(["recepcao", "auditorio"]);

    const { publishAlert } = await import("./service");
    const result = await publishAlert({ message: "  Reunião agora  ", durationSeconds: 30, actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(insertAlert).toHaveBeenCalledWith(expect.objectContaining({ message: "Reunião agora" }));
    expect(publishOutputEvent).toHaveBeenCalledTimes(2);
    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", { type: "alert-changed" });
    expect(publishOutputEvent).toHaveBeenCalledWith("auditorio", { type: "alert-changed" });
  });

  it("does not throw when there are no outputs", async () => {
    insertAlert.mockResolvedValue({ id: "a1", message: "x", expiresAt: new Date() });
    findAllOutputTokens.mockResolvedValue([]);

    const { publishAlert } = await import("./service");
    const result = await publishAlert({ message: "x", durationSeconds: 30, actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(publishOutputEvent).not.toHaveBeenCalled();
  });
});

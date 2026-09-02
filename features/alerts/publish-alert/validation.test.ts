import { describe, expect, it } from "vitest";
import { validatePublishAlertInput } from "./validation";

describe("validatePublishAlertInput", () => {
  it("accepts a valid message and duration", () => {
    expect(validatePublishAlertInput({ message: "Reunião às 15h no auditório", durationSeconds: 30 })).toBeNull();
  });

  it("rejects an empty message", () => {
    expect(validatePublishAlertInput({ message: "  ", durationSeconds: 30 })?.code).toBe(
      "broadcast.publish-alert.invalid_message",
    );
  });

  it("rejects a zero or negative duration", () => {
    expect(validatePublishAlertInput({ message: "Aviso", durationSeconds: 0 })?.code).toBe(
      "broadcast.publish-alert.invalid_duration",
    );
  });
});

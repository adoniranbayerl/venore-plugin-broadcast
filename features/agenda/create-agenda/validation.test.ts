import { describe, expect, it } from "vitest";
import { validateCreateAgendaInput } from "./validation";

describe("validateCreateAgendaInput", () => {
  it("accepts a valid name without an explicit duration", () => {
    expect(validateCreateAgendaInput({ name: "Semanal" })).toBeNull();
  });

  it("accepts a valid name with a positive duration", () => {
    expect(validateCreateAgendaInput({ name: "Semanal", displaySeconds: 30 })).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateCreateAgendaInput({ name: "  " })?.code).toBe("broadcast.create-agenda.invalid_name");
  });

  it("rejects a zero or negative duration", () => {
    expect(validateCreateAgendaInput({ name: "Semanal", displaySeconds: 0 })?.code).toBe(
      "broadcast.create-agenda.invalid_duration",
    );
  });

  it("accepts a valid hex background color", () => {
    expect(validateCreateAgendaInput({ name: "Semanal", backgroundColor: "#1a1a2e" })).toBeNull();
  });

  it("rejects a malformed background color", () => {
    expect(validateCreateAgendaInput({ name: "Semanal", backgroundColor: "blue" })?.code).toBe(
      "broadcast.create-agenda.invalid_color",
    );
  });
});

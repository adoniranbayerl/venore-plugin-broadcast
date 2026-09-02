import { describe, expect, it } from "vitest";
import { validateUpdateAgendaInput } from "./validation";

describe("validateUpdateAgendaInput", () => {
  it("accepts a valid update", () => {
    expect(validateUpdateAgendaInput({ agendaId: "a1", name: "Semanal", displaySeconds: 20 })).toBeNull();
  });

  it("rejects a missing agendaId", () => {
    expect(validateUpdateAgendaInput({ agendaId: "", name: "Semanal", displaySeconds: 20 })?.code).toBe(
      "broadcast.update-agenda.invalid_agenda",
    );
  });

  it("rejects an empty name", () => {
    expect(validateUpdateAgendaInput({ agendaId: "a1", name: " ", displaySeconds: 20 })?.code).toBe(
      "broadcast.update-agenda.invalid_name",
    );
  });

  it("rejects a zero or negative duration", () => {
    expect(validateUpdateAgendaInput({ agendaId: "a1", name: "Semanal", displaySeconds: 0 })?.code).toBe(
      "broadcast.update-agenda.invalid_duration",
    );
  });

  it("rejects a malformed background color", () => {
    expect(
      validateUpdateAgendaInput({ agendaId: "a1", name: "Semanal", displaySeconds: 20, backgroundColor: "blue" })?.code,
    ).toBe("broadcast.update-agenda.invalid_color");
  });

  it("accepts a valid hex background color", () => {
    expect(
      validateUpdateAgendaInput({ agendaId: "a1", name: "Semanal", displaySeconds: 20, backgroundColor: "#1a1a2e" }),
    ).toBeNull();
  });
});

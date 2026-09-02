import { describe, expect, it } from "vitest";
import { validateCreateAgendaEventInput } from "./validation";

describe("validateCreateAgendaEventInput", () => {
  it("accepts a valid agenda, title and date", () => {
    expect(
      validateCreateAgendaEventInput({ agendaId: "a1", title: "Reunião geral", startAt: new Date("2026-09-01T14:00:00Z") }),
    ).toBeNull();
  });

  it("rejects a missing agendaId", () => {
    expect(validateCreateAgendaEventInput({ agendaId: "", title: "Reunião", startAt: new Date() })?.code).toBe(
      "broadcast.create-agenda-event.invalid_agenda",
    );
  });

  it("rejects an empty title", () => {
    expect(validateCreateAgendaEventInput({ agendaId: "a1", title: "  ", startAt: new Date() })?.code).toBe(
      "broadcast.create-agenda-event.invalid_title",
    );
  });

  it("rejects an invalid date", () => {
    expect(validateCreateAgendaEventInput({ agendaId: "a1", title: "Evento", startAt: new Date("not-a-date") })?.code).toBe(
      "broadcast.create-agenda-event.invalid_date",
    );
  });

  it("accepts an endAt several days after startAt", () => {
    expect(
      validateCreateAgendaEventInput({
        agendaId: "a1",
        title: "Retiro",
        startAt: new Date("2026-09-01T09:00:00Z"),
        endAt: new Date("2026-09-04T18:00:00Z"),
      }),
    ).toBeNull();
  });

  it("rejects an endAt at or before startAt", () => {
    expect(
      validateCreateAgendaEventInput({
        agendaId: "a1",
        title: "Evento",
        startAt: new Date("2026-09-01T09:00:00Z"),
        endAt: new Date("2026-09-01T09:00:00Z"),
      })?.code,
    ).toBe("broadcast.create-agenda-event.invalid_end_date");
  });

  it("accepts valid extra dates (with and without an end)", () => {
    expect(
      validateCreateAgendaEventInput({
        agendaId: "a1",
        title: "Evento em dois dias",
        startAt: new Date("2026-09-10T14:00:00Z"),
        extraDates: [
          { startAt: new Date("2026-09-15T14:00:00Z") },
          { startAt: new Date("2026-09-20T09:00:00Z"), endAt: new Date("2026-09-20T11:00:00Z") },
        ],
      }),
    ).toBeNull();
  });

  it("rejects an extra date with an invalid startAt", () => {
    expect(
      validateCreateAgendaEventInput({
        agendaId: "a1",
        title: "Evento",
        startAt: new Date("2026-09-10T14:00:00Z"),
        extraDates: [{ startAt: new Date("not-a-date") }],
      })?.code,
    ).toBe("broadcast.create-agenda-event.invalid_extra_date");
  });

  it("rejects an extra date whose endAt is at or before its startAt", () => {
    expect(
      validateCreateAgendaEventInput({
        agendaId: "a1",
        title: "Evento",
        startAt: new Date("2026-09-10T14:00:00Z"),
        extraDates: [{ startAt: new Date("2026-09-15T14:00:00Z"), endAt: new Date("2026-09-15T13:00:00Z") }],
      })?.code,
    ).toBe("broadcast.create-agenda-event.invalid_extra_date");
  });
});

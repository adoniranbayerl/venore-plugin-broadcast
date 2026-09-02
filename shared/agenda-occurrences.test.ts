import { describe, expect, it } from "vitest";
import { isAgendaEventUpcoming } from "./agenda-occurrences";

const NOW = new Date("2026-09-10T12:00:00Z");

describe("isAgendaEventUpcoming", () => {
  it("keeps a non-recurring event whose primary date is still in the future", () => {
    expect(
      isAgendaEventUpcoming(
        { startAt: new Date("2026-09-15T14:00:00Z"), endAt: null, recurring: false, extraDates: [] },
        NOW,
      ),
    ).toBe(true);
  });

  it("drops a non-recurring event whose primary date (no endAt) has passed", () => {
    expect(
      isAgendaEventUpcoming(
        { startAt: new Date("2026-09-05T14:00:00Z"), endAt: null, recurring: false, extraDates: [] },
        NOW,
      ),
    ).toBe(false);
  });

  it("keeps an event whose primary date passed but has a future extra date", () => {
    expect(
      isAgendaEventUpcoming(
        {
          startAt: new Date("2026-09-05T14:00:00Z"),
          endAt: null,
          recurring: false,
          extraDates: [{ id: "d1", startAt: new Date("2026-09-15T14:00:00Z"), endAt: null }],
        },
        NOW,
      ),
    ).toBe(true);
  });

  it("drops an event once every date (primary and extra) has passed", () => {
    expect(
      isAgendaEventUpcoming(
        {
          startAt: new Date("2026-09-01T14:00:00Z"),
          endAt: new Date("2026-09-01T16:00:00Z"),
          recurring: false,
          extraDates: [{ id: "d1", startAt: new Date("2026-09-05T14:00:00Z"), endAt: new Date("2026-09-05T16:00:00Z") }],
        },
        NOW,
      ),
    ).toBe(false);
  });

  it("keeps an in-progress extra date (started, not yet ended)", () => {
    expect(
      isAgendaEventUpcoming(
        {
          startAt: new Date("2026-09-01T14:00:00Z"),
          endAt: null,
          recurring: false,
          extraDates: [{ id: "d1", startAt: new Date("2026-09-10T09:00:00Z"), endAt: new Date("2026-09-10T18:00:00Z") }],
        },
        NOW,
      ),
    ).toBe(true);
  });

  it("always keeps a recurring event even with a stale anchor and no extra dates", () => {
    expect(
      isAgendaEventUpcoming(
        { startAt: new Date("2025-01-01T14:00:00Z"), endAt: null, recurring: true, extraDates: [] },
        NOW,
      ),
    ).toBe(true);
  });
});

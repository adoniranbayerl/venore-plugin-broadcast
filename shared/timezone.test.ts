import { describe, expect, it } from "vitest";
import {
  DEFAULT_BROADCAST_TIMEZONE,
  getZonedParts,
  isSameZonedCalendarDay,
  isValidTimeZone,
  normalizeTimeZone,
  parseWallTimeInZone,
  zonedPartsToInstant,
} from "./timezone";

describe("parseWallTimeInZone", () => {
  it("interprets a datetime-local string as wall time in the given zone and returns the UTC instant (DoD case)", () => {
    // Criar um evento às 19:30 no admin, com o fuso da instituição em São Paulo (GMT-3 fixo).
    const instant = parseWallTimeInZone("2026-08-28T19:30", "America/Sao_Paulo");
    expect(instant?.toISOString()).toBe("2026-08-28T22:30:00.000Z");
  });

  it("treats the same wall string differently per zone", () => {
    expect(parseWallTimeInZone("2026-08-28T19:30", "UTC")?.toISOString()).toBe("2026-08-28T19:30:00.000Z");
    // Tokyo é GMT+9 sem horário de verão.
    expect(parseWallTimeInZone("2026-08-28T19:30", "Asia/Tokyo")?.toISOString()).toBe("2026-08-28T10:30:00.000Z");
  });

  it("accepts an optional seconds component", () => {
    expect(parseWallTimeInZone("2026-08-28T19:30:45", "America/Sao_Paulo")?.toISOString()).toBe("2026-08-28T22:30:45.000Z");
  });

  it("returns null for a string that is not a datetime-local value", () => {
    expect(parseWallTimeInZone("", "America/Sao_Paulo")).toBeNull();
    expect(parseWallTimeInZone("not-a-date", "America/Sao_Paulo")).toBeNull();
    expect(parseWallTimeInZone("2026-08-28", "America/Sao_Paulo")).toBeNull();
  });

  it("round-trips: the instant, read back in the same zone, is the same wall time", () => {
    const wall = { year: 2026, month: 3, day: 10, hour: 14, minute: 5 };
    const instant = parseWallTimeInZone("2026-03-10T14:05", "America/New_York");
    expect(instant).not.toBeNull();
    const parts = getZonedParts(instant as Date, "America/New_York");
    expect({ year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute }).toEqual(wall);
  });

  it("resolves a wall time inside the US spring-forward gap without throwing", () => {
    // 2026-03-08 02:30 America/New_York não existe (relógio pula de 02:00 pra 03:00) — o helper
    // ainda devolve um instante válido (a implementação escolhe um dos lados da virada), nunca NaN.
    const instant = parseWallTimeInZone("2026-03-08T02:30", "America/New_York");
    expect(instant).not.toBeNull();
    expect(Number.isNaN((instant as Date).getTime())).toBe(false);
  });
});

describe("zonedPartsToInstant", () => {
  it("normalizes an out-of-range day (used by the weekly recurrence math)", () => {
    // dia 30 + 5 = 35 → 4 do mês seguinte.
    const instant = zonedPartsToInstant({ year: 2026, month: 1, day: 35, hour: 8, minute: 0 }, "UTC");
    expect(instant.toISOString()).toBe("2026-02-04T08:00:00.000Z");
  });
});

describe("getZonedParts", () => {
  it("reads the weekday in the given zone (0=domingo)", () => {
    // 2026-01-14T02:00Z é quarta (3) em UTC/Tokyo mas ainda terça (2) em São Paulo (23:00 do dia 13).
    const instant = new Date("2026-01-14T02:00:00Z");
    expect(getZonedParts(instant, "UTC").weekday).toBe(3);
    expect(getZonedParts(instant, "Asia/Tokyo").weekday).toBe(3);
    expect(getZonedParts(instant, "America/Sao_Paulo").weekday).toBe(2);
    expect(getZonedParts(instant, "America/Sao_Paulo").day).toBe(13);
  });
});

describe("isSameZonedCalendarDay", () => {
  it("compares the calendar day in the given zone, not in UTC", () => {
    const a = new Date("2026-01-14T01:00:00Z"); // SP: 13/01 22:00
    const b = new Date("2026-01-14T04:00:00Z"); // SP: 14/01 01:00
    expect(isSameZonedCalendarDay(a, b, "UTC")).toBe(true);
    expect(isSameZonedCalendarDay(a, b, "America/Sao_Paulo")).toBe(false);
  });
});

describe("isValidTimeZone / normalizeTimeZone", () => {
  it("accepts real IANA ids and rejects junk", () => {
    expect(isValidTimeZone("America/Sao_Paulo")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isValidTimeZone("GMT-3")).toBe(false);
  });

  it("normalizeTimeZone falls back to the default for anything invalid", () => {
    expect(normalizeTimeZone("Asia/Tokyo")).toBe("Asia/Tokyo");
    expect(normalizeTimeZone(null)).toBe(DEFAULT_BROADCAST_TIMEZONE);
    expect(normalizeTimeZone(undefined)).toBe(DEFAULT_BROADCAST_TIMEZONE);
    expect(normalizeTimeZone("#221100")).toBe(DEFAULT_BROADCAST_TIMEZONE);
    expect(normalizeTimeZone(42)).toBe(DEFAULT_BROADCAST_TIMEZONE);
  });
});

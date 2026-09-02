import { describe, expect, it } from "vitest";
import { parseRangeHeader } from "./range-header";

describe("parseRangeHeader", () => {
  const size = 1000;

  it("parses a bounded range", () => {
    expect(parseRangeHeader("bytes=0-499", size)).toEqual({ start: 0, end: 499 });
  });

  it("parses an open-ended range as up to the end of the file", () => {
    expect(parseRangeHeader("bytes=500-", size)).toEqual({ start: 500, end: 999 });
  });

  it("parses a suffix range as the last N bytes", () => {
    expect(parseRangeHeader("bytes=-200", size)).toEqual({ start: 800, end: 999 });
  });

  it("clamps a suffix range longer than the file to the whole file", () => {
    expect(parseRangeHeader("bytes=-5000", size)).toEqual({ start: 0, end: 999 });
  });

  it("rejects a range with no digits at all", () => {
    expect(parseRangeHeader("bytes=-", size)).toBeNull();
  });

  it("rejects a range whose end is past the end of the file", () => {
    expect(parseRangeHeader("bytes=0-1000", size)).toBeNull();
  });

  it("rejects a range where start is after end", () => {
    expect(parseRangeHeader("bytes=500-100", size)).toBeNull();
  });

  it("rejects a malformed unit", () => {
    expect(parseRangeHeader("chunks=0-499", size)).toBeNull();
  });

  it("rejects multi-range requests (unsupported subset)", () => {
    expect(parseRangeHeader("bytes=0-99,200-299", size)).toBeNull();
  });
});

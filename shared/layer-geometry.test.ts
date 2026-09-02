import { describe, expect, it } from "vitest";
import { resolveLayerGeometry } from "./layer-geometry";

describe("resolveLayerGeometry", () => {
  const base = { x: 0, y: 0, width: 100, height: 100 };

  it("returns the base geometry when the drawer is closed", () => {
    expect(resolveLayerGeometry(base, { width: 60 }, false)).toEqual(base);
  });

  it("returns the base geometry when the drawer is open but no variant is configured", () => {
    expect(resolveLayerGeometry(base, undefined, true)).toEqual(base);
  });

  it("overlays only the fields present in the drawer variant", () => {
    expect(resolveLayerGeometry(base, { width: 60 }, true)).toEqual({ x: 0, y: 0, width: 60, height: 100 });
  });

  it("overlays every field when the variant is fully specified", () => {
    expect(resolveLayerGeometry(base, { x: 5, y: 5, width: 40, height: 40 }, true)).toEqual({
      x: 5,
      y: 5,
      width: 40,
      height: 40,
    });
  });
});

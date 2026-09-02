import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveWithinRoot, toStoredRelativePath } from "./sandboxed-path";

describe("resolveWithinRoot", () => {
  const root = path.join("C:", "media", "broadcast");

  it("resolves a plain relative path inside the root", () => {
    expect(resolveWithinRoot(root, "clips/intro.mp4")).toBe(path.join(root, "clips", "intro.mp4"));
  });

  it("resolves the root itself", () => {
    expect(resolveWithinRoot(root, ".")).toBe(path.resolve(root));
  });

  it("rejects a relative path that escapes the root via ..", () => {
    expect(resolveWithinRoot(root, "../secrets/data.mp4")).toBeNull();
  });

  it("rejects a relative path that escapes the root via a nested ..", () => {
    expect(resolveWithinRoot(root, "clips/../../secrets/data.mp4")).toBeNull();
  });

  it("rejects an absolute path pointing outside the root", () => {
    expect(resolveWithinRoot(root, path.join("C:", "other", "data.mp4"))).toBeNull();
  });

  it("does not treat a sibling directory with a shared prefix as inside the root", () => {
    const siblingRoot = path.join("C:", "media", "broadcast-other");
    expect(resolveWithinRoot(root, path.relative(root, siblingRoot))).toBeNull();
  });
});

describe("toStoredRelativePath", () => {
  it("normalizes the OS separator to forward slashes", () => {
    const root = path.join("C:", "media", "broadcast");
    const absolute = path.join(root, "clips", "intro.mp4");
    expect(toStoredRelativePath(root, absolute)).toBe("clips/intro.mp4");
  });
});

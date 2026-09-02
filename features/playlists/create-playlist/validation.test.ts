import { describe, expect, it } from "vitest";
import { validateCreatePlaylistInput } from "./validation";

describe("validateCreatePlaylistInput", () => {
  it("accepts a valid name", () => {
    expect(validateCreatePlaylistInput({ name: "Comerciais" })).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateCreatePlaylistInput({ name: "   " })?.code).toBe("broadcast.create-playlist.invalid_name");
  });
});

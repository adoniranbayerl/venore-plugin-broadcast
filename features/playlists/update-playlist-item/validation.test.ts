import { describe, expect, it } from "vitest";
import { validateUpdatePlaylistItemInput } from "./validation";

describe("validateUpdatePlaylistItemInput", () => {
  it("accepts a minimal valid update", () => {
    expect(validateUpdatePlaylistItemInput({ itemId: "item-1" })).toBeNull();
  });

  it("rejects a missing itemId", () => {
    expect(validateUpdatePlaylistItemInput({ itemId: "" })?.code).toBe("broadcast.update-playlist-item.invalid_item");
  });

  it("rejects a zero or negative duration", () => {
    expect(validateUpdatePlaylistItemInput({ itemId: "item-1", durationSeconds: 0 })?.code).toBe(
      "broadcast.update-playlist-item.invalid_duration",
    );
  });

  it("accepts a valid internal route as url", () => {
    expect(validateUpdatePlaylistItemInput({ itemId: "item-1", url: "/cursos" })).toBeNull();
  });

  it("accepts a valid absolute url", () => {
    expect(validateUpdatePlaylistItemInput({ itemId: "item-1", url: "https://example.com" })).toBeNull();
  });

  it("rejects a malformed url", () => {
    expect(validateUpdatePlaylistItemInput({ itemId: "item-1", url: "not a url" })?.code).toBe(
      "broadcast.update-playlist-item.invalid_url",
    );
  });
});

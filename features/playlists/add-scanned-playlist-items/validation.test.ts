import { describe, expect, it } from "vitest";
import { validateAddScannedPlaylistItemsInput } from "./validation";

describe("validateAddScannedPlaylistItemsInput", () => {
  it("accepts a valid selection", () => {
    expect(validateAddScannedPlaylistItemsInput({ playlistId: "p1", relativePaths: ["clips/a.mp4"] })).toBeNull();
  });

  it("rejects a missing playlistId", () => {
    expect(validateAddScannedPlaylistItemsInput({ playlistId: "", relativePaths: ["clips/a.mp4"] })?.code).toBe(
      "broadcast.add-scanned-playlist-items.invalid_playlist",
    );
  });

  it("rejects an empty selection", () => {
    expect(validateAddScannedPlaylistItemsInput({ playlistId: "p1", relativePaths: [] })?.code).toBe(
      "broadcast.add-scanned-playlist-items.invalid_items",
    );
  });
});

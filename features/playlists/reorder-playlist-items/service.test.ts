import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const findPlaylistItemsByPlaylistId = vi.fn();
const reorderPlaylistItems = vi.fn();

vi.mock("./store", () => ({
  findPlaylistItemsByPlaylistId: (...args: unknown[]) => findPlaylistItemsByPlaylistId(...args),
  reorderPlaylistItems: (...args: unknown[]) => reorderPlaylistItems(...args),
}));

function item(id: string, order: number) {
  return {
    id,
    playlistId: "playlist-1",
    order,
    title: null,
    sourceType: "news" as const,
    relativePath: null,
    mediaAssetId: null,
    url: null,
    durationSeconds: null,
    hidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("reorderPlaylistItemsService", () => {
  beforeEach(() => {
    findPlaylistItemsByPlaylistId.mockReset();
    reorderPlaylistItems.mockReset();
  });

  it("fails when the provided itemIds do not match the playlist's items exactly", async () => {
    findPlaylistItemsByPlaylistId.mockResolvedValue([item("item-1", 0), item("item-2", 1)]);

    const { reorderPlaylistItemsService } = await import("./service");
    const result = await reorderPlaylistItemsService({
      playlistId: "playlist-1",
      itemIds: ["item-1", "item-3"],
      actorId: "actor-1",
    });

    expect(result).toEqual({
      success: false,
      error: { code: "broadcast.reorder-playlist-items.mismatch", message: expect.any(String) },
    });
    expect(reorderPlaylistItems).not.toHaveBeenCalled();
  });

  it("fails when the provided itemIds contain duplicates", async () => {
    findPlaylistItemsByPlaylistId.mockResolvedValue([item("item-1", 0), item("item-2", 1)]);

    const { reorderPlaylistItemsService } = await import("./service");
    const result = await reorderPlaylistItemsService({
      playlistId: "playlist-1",
      itemIds: ["item-1", "item-1"],
      actorId: "actor-1",
    });

    expect(result.success).toBe(false);
    expect(reorderPlaylistItems).not.toHaveBeenCalled();
  });

  it("reorders the items when the set of ids matches exactly", async () => {
    findPlaylistItemsByPlaylistId.mockResolvedValue([item("item-1", 0), item("item-2", 1)]);
    reorderPlaylistItems.mockResolvedValue([item("item-2", 0), item("item-1", 1)]);

    const { reorderPlaylistItemsService } = await import("./service");
    const result = await reorderPlaylistItemsService({
      playlistId: "playlist-1",
      itemIds: ["item-2", "item-1"],
      actorId: "actor-1",
    });

    expect(result.success).toBe(true);
    expect(reorderPlaylistItems).toHaveBeenCalledWith("playlist-1", ["item-2", "item-1"]);
  });
});

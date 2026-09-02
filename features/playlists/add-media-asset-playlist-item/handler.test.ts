import { beforeEach, describe, expect, it, vi } from "vitest";

// Cobre os 3 estados do gate de escopo (via authorizePlaylistActor, ver shared/scoped-authorization):
// sem permission / com a permission estreita mas sem atribuição / com permission + atribuição.
// Mocka só @/contexts/rbac (authorizeActor) e o store de escopo; a validação de input roda de
// verdade.
const authorizeActor = vi.fn();
vi.mock("@venore/plugin-sdk/rbac", () => ({
  authorizeActor: (...args: unknown[]) => authorizeActor(...args),
}));

const isUserAssignedToPlaylist = vi.fn();
vi.mock("../../../shared/scoped-authorization/store", () => ({
  isUserAssignedToAgenda: vi.fn(),
  isUserAssignedToOutput: vi.fn(),
  isUserAssignedToPlaylist: (...args: unknown[]) => isUserAssignedToPlaylist(...args),
  findAgendaIdByEventId: vi.fn(),
  findPlaylistIdByItemId: vi.fn(),
  findAgendaIdsAssignedToUser: vi.fn(),
  findOutputIdsAssignedToUser: vi.fn(),
  findPlaylistIdsAssignedToUser: vi.fn(),
}));

const addMediaAssetPlaylistItem = vi.fn();
vi.mock("./service", () => ({
  addMediaAssetPlaylistItem: (...args: unknown[]) => addMediaAssetPlaylistItem(...args),
}));

const forbidden = { authorized: false as const, error: { code: "rbac.authorization.forbidden", message: "forbidden" } };
const input = { playlistId: "playlist-1", mediaAssetId: "asset-1" };

describe("addMediaAssetPlaylistItemHandler", () => {
  beforeEach(() => {
    authorizeActor.mockReset();
    isUserAssignedToPlaylist.mockReset();
    addMediaAssetPlaylistItem.mockReset();
  });

  it("fails validation before authorization when the media asset is missing", async () => {
    const { addMediaAssetPlaylistItemHandler } = await import("./handler");
    const result = await addMediaAssetPlaylistItemHandler({ playlistId: "playlist-1", mediaAssetId: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.add-media-asset-playlist-item.invalid_media");
    expect(authorizeActor).not.toHaveBeenCalled();
  });

  it("rejects an actor with neither broadcast.manage nor broadcast.playlists.manage, without touching the service", async () => {
    authorizeActor.mockResolvedValue(forbidden);

    const { addMediaAssetPlaylistItemHandler } = await import("./handler");
    const result = await addMediaAssetPlaylistItemHandler(input);

    expect(result).toEqual({ success: false, error: forbidden.error });
    expect(isUserAssignedToPlaylist).not.toHaveBeenCalled();
    expect(addMediaAssetPlaylistItem).not.toHaveBeenCalled();
  });

  it("rejects a scoped editor (broadcast.playlists.manage) who is NOT assigned to the playlist", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.playlists.manage" ? { authorized: true, actorId: "editor-2" } : forbidden,
    );
    isUserAssignedToPlaylist.mockResolvedValue(false);

    const { addMediaAssetPlaylistItemHandler } = await import("./handler");
    const result = await addMediaAssetPlaylistItemHandler(input);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.playlists.forbidden_resource");
    expect(isUserAssignedToPlaylist).toHaveBeenCalledWith("playlist-1", "editor-2");
    expect(addMediaAssetPlaylistItem).not.toHaveBeenCalled();
  });

  it("calls the service with the resolved actorId for a scoped editor assigned to the playlist", async () => {
    authorizeActor.mockImplementation(async (permission: string) =>
      permission === "broadcast.playlists.manage" ? { authorized: true, actorId: "editor-2" } : forbidden,
    );
    isUserAssignedToPlaylist.mockResolvedValue(true);
    addMediaAssetPlaylistItem.mockResolvedValue({ success: true, data: { id: "item-1" } });

    const { addMediaAssetPlaylistItemHandler } = await import("./handler");
    const result = await addMediaAssetPlaylistItemHandler(input);

    expect(addMediaAssetPlaylistItem).toHaveBeenCalledWith({ playlistId: "playlist-1", mediaAssetId: "asset-1", actorId: "editor-2" });
    expect(result).toEqual({ success: true, data: { id: "item-1" } });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const findAllPlaylists = vi.fn();
vi.mock("./store", () => ({
  findAllPlaylists: (...args: unknown[]) => findAllPlaylists(...args),
}));

const findPlaylistIdsAssignedToUser = vi.fn();
vi.mock("../../../shared/scoped-authorization", () => ({
  findPlaylistIdsAssignedToUser: (...args: unknown[]) => findPlaylistIdsAssignedToUser(...args),
}));

describe("listPlaylists", () => {
  beforeEach(() => {
    findAllPlaylists.mockReset();
    findPlaylistIdsAssignedToUser.mockReset();
    findAllPlaylists.mockResolvedValue([
      { id: "p1", name: "Recepção" },
      { id: "p2", name: "Corredor" },
      { id: "p3", name: "Institucional" },
    ]);
  });

  it("returns every playlist when no assignedToUserId filter is given (broadcast.manage/broadcast.outputs.manage path)", async () => {
    const { listPlaylists } = await import("./service");
    const result = await listPlaylists();

    expect(result.success && result.data).toHaveLength(3);
    expect(findPlaylistIdsAssignedToUser).not.toHaveBeenCalled();
  });

  it("filters to only the playlists assigned to the user when assignedToUserId is given (scoped editor path)", async () => {
    findPlaylistIdsAssignedToUser.mockResolvedValue(["p3"]);

    const { listPlaylists } = await import("./service");
    const result = await listPlaylists({ assignedToUserId: "editor-1" });

    expect(result.success && result.data.map((playlist) => playlist.id)).toEqual(["p3"]);
    expect(findPlaylistIdsAssignedToUser).toHaveBeenCalledWith("editor-1");
  });

  it("returns an empty list when the user has no assignments at all", async () => {
    findPlaylistIdsAssignedToUser.mockResolvedValue([]);

    const { listPlaylists } = await import("./service");
    const result = await listPlaylists({ assignedToUserId: "editor-1" });

    expect(result.success && result.data).toEqual([]);
  });
});

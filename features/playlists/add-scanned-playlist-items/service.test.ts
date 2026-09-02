import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BROADCAST_ROOT_FOLDER } from "../../../shared/settings";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({
    operationId: "op-1",
    useCase: "test",
    actor: { id: "actor-1", type: "user" },
    kind: "write",
    startedAt: new Date(),
  })),
  endOperation: vi.fn(),
}));

const stat = vi.fn();
vi.mock("node:fs/promises", () => ({
  stat: (...args: unknown[]) => stat(...args),
}));

const findPlaylistById = vi.fn();
const findMaxPlaylistItemOrder = vi.fn();
const insertLocalPlaylistItems = vi.fn();
vi.mock("./store", () => ({
  findPlaylistById: (...args: unknown[]) => findPlaylistById(...args),
  findMaxPlaylistItemOrder: (...args: unknown[]) => findMaxPlaylistItemOrder(...args),
  insertLocalPlaylistItems: (...args: unknown[]) => insertLocalPlaylistItems(...args),
}));

// BROADCAST_ROOT_FOLDER agora é uma constante fixa (não mais lida de contexts/settings), então o
// path absoluto esperado é sempre relativo ao process.cwd() do processo de teste.
const ROOT = path.resolve(BROADCAST_ROOT_FOLDER);

describe("addScannedPlaylistItems", () => {
  beforeEach(() => {
    stat.mockReset();
    findPlaylistById.mockReset();
    findMaxPlaylistItemOrder.mockReset();
    insertLocalPlaylistItems.mockReset();
  });

  it("fails when the playlist has no folder configured", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", folderPath: null });

    const { addScannedPlaylistItems } = await import("./service");
    const result = await addScannedPlaylistItems({ playlistId: "p1", relativePaths: ["clips/a.mp4"], actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.add-scanned-playlist-items.invalid_playlist");
    expect(insertLocalPlaylistItems).not.toHaveBeenCalled();
  });

  it("only inserts paths that are within the playlist's folder, have a video extension, and still exist on disk", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", folderPath: "clips" });
    findMaxPlaylistItemOrder.mockResolvedValue(0);
    stat.mockImplementation(async (target: string) => {
      if (target === path.join(ROOT, "clips", "intro.mp4")) return { isFile: () => true };
      throw new Error("ENOENT");
    });
    insertLocalPlaylistItems.mockResolvedValue([{ id: "item-1", relativePath: "clips/intro.mp4" }]);

    const { addScannedPlaylistItems } = await import("./service");
    const result = await addScannedPlaylistItems({
      playlistId: "p1",
      relativePaths: [
        "clips/intro.mp4", // válido
        "clips/gone.mp4", // sumiu do disco (stat rejeita)
        "other-playlist/video.mp4", // fora da pasta desta playlist
        "clips/notes.txt", // extensão não é vídeo
      ],
      actorId: "actor-1",
    });

    expect(result.success).toBe(true);
    expect(insertLocalPlaylistItems).toHaveBeenCalledWith([
      { playlistId: "p1", order: 1, title: null, relativePath: "clips/intro.mp4" },
    ]);
  });

  it("still matches when the playlist's folderPath has a trailing slash (real bug: 'videos/' rejected every valid path)", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", folderPath: "clips/" });
    findMaxPlaylistItemOrder.mockResolvedValue(0);
    stat.mockImplementation(async (target: string) => {
      if (target === path.join(ROOT, "clips", "intro.mp4")) return { isFile: () => true };
      throw new Error("ENOENT");
    });
    insertLocalPlaylistItems.mockResolvedValue([{ id: "item-1", relativePath: "clips/intro.mp4" }]);

    const { addScannedPlaylistItems } = await import("./service");
    const result = await addScannedPlaylistItems({ playlistId: "p1", relativePaths: ["clips/intro.mp4"], actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(insertLocalPlaylistItems).toHaveBeenCalledWith([
      { playlistId: "p1", order: 1, title: null, relativePath: "clips/intro.mp4" },
    ]);
  });

  it("fails when none of the submitted paths are valid", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", folderPath: "clips" });
    stat.mockRejectedValue(new Error("ENOENT"));

    const { addScannedPlaylistItems } = await import("./service");
    const result = await addScannedPlaylistItems({ playlistId: "p1", relativePaths: ["clips/gone.mp4"], actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.add-scanned-playlist-items.no_valid_items");
    expect(insertLocalPlaylistItems).not.toHaveBeenCalled();
  });
});

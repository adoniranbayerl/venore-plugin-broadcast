import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BROADCAST_ROOT_FOLDER } from "../../../shared/settings";

const readdir = vi.fn();
vi.mock("node:fs/promises", () => ({
  readdir: (...args: unknown[]) => readdir(...args),
}));

const findPlaylistById = vi.fn();
const findLocalPlaylistItemsByPlaylistId = vi.fn();
vi.mock("./store", () => ({
  findPlaylistById: (...args: unknown[]) => findPlaylistById(...args),
  findLocalPlaylistItemsByPlaylistId: (...args: unknown[]) => findLocalPlaylistItemsByPlaylistId(...args),
}));

// BROADCAST_ROOT_FOLDER agora é uma constante fixa (não mais lida de contexts/settings), então o
// path absoluto esperado é sempre relativo ao process.cwd() do processo de teste.
const ROOT = path.resolve(BROADCAST_ROOT_FOLDER);

function fileEntry(name: string) {
  return { name, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false };
}
function dirEntry(name: string) {
  return { name, isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false };
}

describe("scanPlaylistFolder", () => {
  beforeEach(() => {
    readdir.mockReset();
    findPlaylistById.mockReset();
    findLocalPlaylistItemsByPlaylistId.mockReset();
  });

  it("fails when the playlist does not exist", async () => {
    findPlaylistById.mockResolvedValue(null);

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "missing", kind: "video", actorId: "actor-1" });

    expect(result).toEqual({
      success: false,
      error: { code: "broadcast.scan-playlist-folder.not_found", message: expect.any(String) },
    });
  });

  it("fails when the playlist has no folder configured (kind video)", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", name: "Clips", folderPath: null });

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "p1", kind: "video", actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.scan-playlist-folder.no_folder");
  });

  it("fails when the playlist folder escapes the configured root", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", name: "Clips", folderPath: "../../outside" });

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "p1", kind: "video", actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.scan-playlist-folder.path_escape");
    expect(readdir).not.toHaveBeenCalled();
  });

  it("previews newly discovered video files and items no longer on disk, without writing anything", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", name: "Clips", folderPath: "clips" });
    findLocalPlaylistItemsByPlaylistId.mockResolvedValue([
      { id: "item-kept", relativePath: "clips/intro.mp4" },
      { id: "item-stale", relativePath: "clips/removed.mp4" },
    ]);

    const clipsDir = path.join(ROOT, "clips");
    const subDir = path.join(clipsDir, "sub");
    readdir.mockImplementation(async (dir: string) => {
      if (dir === clipsDir) return [fileEntry("intro.mp4"), fileEntry("notes.txt"), dirEntry("sub")];
      if (dir === subDir) return [fileEntry("clip2.webm")];
      throw new Error(`unexpected readdir(${dir})`);
    });

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "p1", kind: "video", actorId: "actor-1" });

    expect(result).toEqual({
      success: true,
      data: {
        toAdd: ["clips/sub/clip2.webm"],
        toRemove: [{ id: "item-stale", relativePath: "clips/removed.mp4" }],
      },
    });
  });

  it("kind video ignores image files in the same folder", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", name: "Clips", folderPath: "clips" });
    findLocalPlaylistItemsByPlaylistId.mockResolvedValue([]);

    const clipsDir = path.join(ROOT, "clips");
    readdir.mockImplementation(async (dir: string) => {
      if (dir === clipsDir) return [fileEntry("intro.mp4"), fileEntry("banner.png"), fileEntry("photo.jpg")];
      throw new Error(`unexpected readdir(${dir})`);
    });

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "p1", kind: "video", actorId: "actor-1" });

    expect(result).toEqual({ success: true, data: { toAdd: ["clips/intro.mp4"], toRemove: [] } });
  });

  it("surfaces a clear error when the configured folder can't be read from disk", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", name: "Clips", folderPath: "clips" });
    readdir.mockRejectedValue(new Error("ENOENT"));

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "p1", kind: "video", actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.scan-playlist-folder.folder_not_found");
  });

  // kind="image" — pedido explícito: "Vídeos da pasta, vamos fazer algo similar para 'Imagens na
  // pasta'". Ao contrário de vídeo, NUNCA lê playlist.folderPath — sempre escaneia
  // BROADCAST_IMAGES_FOLDER_PATH ("images"), mesmo quando a playlist não tem folderPath configurado.
  it("kind image discovers image files under BROADCAST_IMAGES_FOLDER_PATH, ignoring video", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", name: "Clips", folderPath: "clips" });
    findLocalPlaylistItemsByPlaylistId.mockResolvedValue([]);

    const imagesDir = path.join(ROOT, "images");
    readdir.mockImplementation(async (dir: string) => {
      if (dir === imagesDir) return [fileEntry("banner.png"), fileEntry("clip.mp4")];
      throw new Error(`unexpected readdir(${dir})`);
    });

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "p1", kind: "image", actorId: "actor-1" });

    expect(result).toEqual({ success: true, data: { toAdd: ["images/banner.png"], toRemove: [] } });
  });

  // Sem isso, um vídeo já cadastrado ("videos/x.mp4") apareceria como "sumiu da pasta" ao
  // escanear imagens, só porque não está entre os arquivos de images/ descobertos.
  it("kind image never treats an existing video item as removed", async () => {
    findPlaylistById.mockResolvedValue({ id: "p1", name: "Clips", folderPath: "videos" });
    findLocalPlaylistItemsByPlaylistId.mockResolvedValue([
      { id: "video-item", relativePath: "videos/intro.mp4" },
      { id: "image-item", relativePath: "images/banner.png" },
    ]);

    const imagesDir = path.join(ROOT, "images");
    readdir.mockImplementation(async (dir: string) => {
      if (dir === imagesDir) return [fileEntry("banner.png")];
      throw new Error(`unexpected readdir(${dir})`);
    });

    const { scanPlaylistFolder } = await import("./service");
    const result = await scanPlaylistFolder({ playlistId: "p1", kind: "image", actorId: "actor-1" });

    expect(result).toEqual({ success: true, data: { toAdd: [], toRemove: [] } });
  });
});

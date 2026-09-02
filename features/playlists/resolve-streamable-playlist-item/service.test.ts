import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BROADCAST_ROOT_FOLDER } from "../../../shared/settings";

const findPlaylistItemById = vi.fn();
vi.mock("./store", () => ({
  findPlaylistItemById: (...args: unknown[]) => findPlaylistItemById(...args),
}));

const getMediaAsset = vi.fn();
vi.mock("@venore/plugin-sdk/media", () => ({
  getMediaAsset: (...args: unknown[]) => getMediaAsset(...args),
}));

const stat = vi.fn();
vi.mock("node:fs/promises", () => ({
  stat: (...args: unknown[]) => stat(...args),
}));

// BROADCAST_ROOT_FOLDER agora é uma constante fixa (não mais lida de contexts/settings), então o
// path absoluto esperado é sempre relativo ao process.cwd() do processo de teste — mesma resolução
// que resolveWithinRoot faz de verdade, não um mock de valor arbitrário.
const ROOT = path.resolve(BROADCAST_ROOT_FOLDER);

describe("resolveStreamableItem", () => {
  beforeEach(() => {
    findPlaylistItemById.mockReset();
    getMediaAsset.mockReset();
    stat.mockReset();
  });

  it("fails when the item does not exist", async () => {
    findPlaylistItemById.mockResolvedValue(null);

    const { resolveStreamableItem } = await import("./service");
    const result = await resolveStreamableItem({ itemId: "missing" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.resolve-streamable-item.not_found");
  });

  it("resolves a media-asset item as a redirect to the asset's URL", async () => {
    findPlaylistItemById.mockResolvedValue({ id: "i1", sourceType: "media-asset", mediaAssetId: "asset-1", relativePath: null });
    getMediaAsset.mockResolvedValue({ success: true, data: { id: "asset-1", url: "https://blob.example/video.mp4" } });

    const { resolveStreamableItem } = await import("./service");
    const result = await resolveStreamableItem({ itemId: "i1" });

    expect(result).toEqual({ success: true, data: { kind: "redirect", url: "https://blob.example/video.mp4" } });
  });

  it("fails when the referenced media asset no longer exists", async () => {
    findPlaylistItemById.mockResolvedValue({ id: "i1", sourceType: "media-asset", mediaAssetId: "asset-1", relativePath: null });
    getMediaAsset.mockResolvedValue({ success: true, data: null });

    const { resolveStreamableItem } = await import("./service");
    const result = await resolveStreamableItem({ itemId: "i1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.resolve-streamable-item.media_not_found");
  });

  it("resolves a local item within the configured root", async () => {
    findPlaylistItemById.mockResolvedValue({ id: "i2", sourceType: "local", mediaAssetId: null, relativePath: "clips/intro.mp4" });
    stat.mockResolvedValue({ size: 12345 });

    const { resolveStreamableItem } = await import("./service");
    const result = await resolveStreamableItem({ itemId: "i2" });

    expect(result).toEqual({
      success: true,
      data: { kind: "local", absolutePath: path.join(ROOT, "clips", "intro.mp4"), contentType: "video/mp4", size: 12345 },
    });
  });

  it("rejects a local item whose stored relativePath would escape the configured root", async () => {
    findPlaylistItemById.mockResolvedValue({ id: "i3", sourceType: "local", mediaAssetId: null, relativePath: "../../outside.mp4" });

    const { resolveStreamableItem } = await import("./service");
    const result = await resolveStreamableItem({ itemId: "i3" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.resolve-streamable-item.path_escape");
    expect(stat).not.toHaveBeenCalled();
  });

  it("fails when the file is no longer on disk", async () => {
    findPlaylistItemById.mockResolvedValue({ id: "i4", sourceType: "local", mediaAssetId: null, relativePath: "clips/gone.mp4" });
    stat.mockRejectedValue(new Error("ENOENT"));

    const { resolveStreamableItem } = await import("./service");
    const result = await resolveStreamableItem({ itemId: "i4" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.resolve-streamable-item.file_not_found");
  });
});

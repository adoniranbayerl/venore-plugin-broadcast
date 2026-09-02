import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@venore/plugin-sdk/observability", () => ({
  beginOperation: vi.fn(() => ({ operationId: "op-1", useCase: "test", actor: { id: "actor-1", type: "user" }, kind: "write", startedAt: new Date() })),
  endOperation: vi.fn(),
}));

const publishOutputEvent = vi.fn();
vi.mock("../../../runtime/output-bus", () => ({
  publishOutputEvent: (...args: unknown[]) => publishOutputEvent(...args),
}));

const findOutputById = vi.fn();
const findVideoLayerBySceneId = vi.fn();
const applyVideoLayerPlaylist = vi.fn();
vi.mock("./store", () => ({
  findOutputById: (...args: unknown[]) => findOutputById(...args),
  findVideoLayerBySceneId: (...args: unknown[]) => findVideoLayerBySceneId(...args),
  applyVideoLayerPlaylist: (...args: unknown[]) => applyVideoLayerPlaylist(...args),
}));

describe("setOutputPlaylist", () => {
  beforeEach(() => {
    findOutputById.mockReset();
    findVideoLayerBySceneId.mockReset();
    applyVideoLayerPlaylist.mockReset();
    publishOutputEvent.mockReset();
  });

  it("fails when the output does not exist", async () => {
    findOutputById.mockResolvedValue(null);

    const { setOutputPlaylist } = await import("./service");
    const result = await setOutputPlaylist({ outputId: "missing", playlistId: "p2", actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-playlist.not_found");
    expect(publishOutputEvent).not.toHaveBeenCalled();
  });

  it("fails when the output has no scene", async () => {
    findOutputById.mockResolvedValue({ id: "o1", currentSceneId: null });

    const { setOutputPlaylist } = await import("./service");
    const result = await setOutputPlaylist({ outputId: "o1", playlistId: "p2", actorId: "actor-1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.set-output-playlist.no_scene");
    expect(publishOutputEvent).not.toHaveBeenCalled();
  });

  it("preserves the rest of the video layer's config while swapping the playlist", async () => {
    findOutputById.mockResolvedValue({ id: "o1", currentSceneId: "s1", token: "recepcao" });
    findVideoLayerBySceneId.mockResolvedValue({
      id: "l1",
      config: { playlistId: "p1", agendaOpenVariant: { x: 0, y: 0, width: 80, height: 100 } },
    });
    applyVideoLayerPlaylist.mockResolvedValue({ id: "o1", token: "recepcao" });

    const { setOutputPlaylist } = await import("./service");
    const result = await setOutputPlaylist({ outputId: "o1", playlistId: "p2", actorId: "actor-1" });

    expect(result.success).toBe(true);
    expect(applyVideoLayerPlaylist).toHaveBeenCalledWith(
      "o1",
      "l1",
      { playlistId: "p1", agendaOpenVariant: { x: 0, y: 0, width: 80, height: 100 } },
      "p2",
    );
  });

  it("returns the record from the store (post-update) and publishes a playlist-changed event", async () => {
    findOutputById.mockResolvedValue({ id: "o1", currentSceneId: "s1", token: "recepcao", updatedAt: new Date("2020-01-01") });
    findVideoLayerBySceneId.mockResolvedValue({ id: "l1", config: { playlistId: "p1" } });
    const updatedOutput = { id: "o1", token: "recepcao", updatedAt: new Date("2026-08-28") };
    applyVideoLayerPlaylist.mockResolvedValue(updatedOutput);

    const { setOutputPlaylist } = await import("./service");
    const result = await setOutputPlaylist({ outputId: "o1", playlistId: "p2", actorId: "actor-1" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(updatedOutput);
    expect(publishOutputEvent).toHaveBeenCalledWith("recepcao", { type: "playlist-changed" });
  });
});

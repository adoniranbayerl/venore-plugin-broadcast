import { beforeEach, describe, expect, it, vi } from "vitest";

// company-metrics é dependência OPCIONAL, carregada por importActivePluginBarrel: o mock devolve
// o barrel (com listMetricsBoards) ou null quando "inativo".
const importActivePluginBarrel = vi.fn();
vi.mock("@venore/plugin-sdk", () => ({
  importActivePluginBarrel: (...a: unknown[]) => importActivePluginBarrel(...a),
}));

const listMetricsBoards = vi.fn();
const activeBarrel = { listMetricsBoards: (...a: unknown[]) => listMetricsBoards(...a) };

const addWebpagePlaylistItem = vi.fn();
vi.mock("../add-webpage-playlist-item/service", () => ({
  addWebpagePlaylistItem: (...a: unknown[]) => addWebpagePlaylistItem(...a),
}));

describe("addMetricsBoardPlaylistItem", () => {
  beforeEach(() => {
    importActivePluginBarrel.mockReset();
    listMetricsBoards.mockReset();
    addWebpagePlaylistItem.mockReset();
  });

  it("refuses when the company-metrics plugin is not active", async () => {
    importActivePluginBarrel.mockResolvedValue(null);

    const { addMetricsBoardPlaylistItem } = await import("./service");
    const result = await addMetricsBoardPlaylistItem({ playlistId: "p1", boardToken: "tok", actorId: "a1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.add-metrics-board-playlist-item.plugin_inactive");
    expect(addWebpagePlaylistItem).not.toHaveBeenCalled();
  });

  it("refuses when the token does not match any board", async () => {
    importActivePluginBarrel.mockResolvedValue(activeBarrel);
    listMetricsBoards.mockResolvedValue({ success: true, data: [{ token: "other", label: "Recepção" }] });

    const { addMetricsBoardPlaylistItem } = await import("./service");
    const result = await addMetricsBoardPlaylistItem({ playlistId: "p1", boardToken: "tok", actorId: "a1" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("broadcast.add-metrics-board-playlist-item.board_not_found");
  });

  it("delegates to the webpage item path with the resolved TV url", async () => {
    importActivePluginBarrel.mockResolvedValue(activeBarrel);
    listMetricsBoards.mockResolvedValue({ success: true, data: [{ token: "tok123", label: "TV do comercial" }] });
    addWebpagePlaylistItem.mockResolvedValue({ success: true, data: { id: "item-1" } });

    const { addMetricsBoardPlaylistItem } = await import("./service");
    const result = await addMetricsBoardPlaylistItem({ playlistId: "p1", boardToken: "tok123", durationSeconds: 45, actorId: "a1" });

    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    expect(addWebpagePlaylistItem).toHaveBeenCalledWith({
      playlistId: "p1",
      url: "/company-metrics/tv/tok123",
      title: "TV do comercial",
      durationSeconds: 45,
      withAudio: false,
      actorId: "a1",
    });
  });
});

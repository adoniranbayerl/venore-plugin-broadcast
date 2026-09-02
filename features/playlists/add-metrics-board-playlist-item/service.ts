import { importActivePluginBarrel } from "@venore/plugin-sdk";
import { addWebpagePlaylistItem } from "../add-webpage-playlist-item/service";
import type { AddMetricsBoardPlaylistItemCommand, AddMetricsBoardPlaylistItemResult } from "./types";

// Só a fatia do barrel do company-metrics que o broadcast consome — o contrato é este tipo
// mínimo, não os tipos internos do outro plugin (dependência OPCIONAL, ver manifest.ts / §9.3).
type CompanyMetricsBarrel = {
  listMetricsBoards: () => Promise<
    | { success: true; data: { token: string; label: string }[] }
    | { success: false; error: { code: string; message: string } }
  >;
};

// Resolve o token num painel real do company-metrics e delega ao mesmo caminho do item "webpage"
// (a view de saída renderiza os dois com o mesmo <iframe>). Se o plugin company-metrics não está
// instalado/ativo, recusa com erro claro.
export async function addMetricsBoardPlaylistItem(
  command: AddMetricsBoardPlaylistItemCommand,
): Promise<AddMetricsBoardPlaylistItemResult> {
  const companyMetrics = await importActivePluginBarrel<CompanyMetricsBarrel>("company-metrics");
  if (!companyMetrics) {
    return {
      success: false,
      error: {
        code: "broadcast.add-metrics-board-playlist-item.plugin_inactive",
        message: "O plugin Métricas Internas não está instalado.",
      },
    };
  }

  const boards = await companyMetrics.listMetricsBoards();
  if (!boards.success) {
    return { success: false, error: boards.error };
  }
  const board = boards.data.find((entry) => entry.token === command.boardToken);
  if (!board) {
    return {
      success: false,
      error: {
        code: "broadcast.add-metrics-board-playlist-item.board_not_found",
        message: "Painel de métricas não encontrado.",
      },
    };
  }

  return addWebpagePlaylistItem({
    playlistId: command.playlistId,
    url: `/company-metrics/tv/${board.token}`,
    title: command.title?.trim() || board.label,
    durationSeconds: command.durationSeconds ?? null,
    withAudio: false,
    actorId: command.actorId,
  });
}

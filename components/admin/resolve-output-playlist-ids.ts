import { listLayers } from "../../index";
import type { BroadcastOutputRecord } from "../../contracts/types";

// Compartilhado por page.tsx (admin completo) e telas/page.tsx (rota enxuta do editor de tela) —
// cada saída já nasce com sua cena/camadas fixas provisionadas (create-output/store.ts), a
// playlist que ela toca mora na config da camada "video" dessa cena, não é um campo direto da
// saída, então precisa resolver por saída pra pré-preencher o seletor de troca de playlist.
export async function resolveOutputPlaylistIds(outputs: BroadcastOutputRecord[]): Promise<Record<string, string | null>> {
  return Object.fromEntries(
    await Promise.all(
      outputs.map(async (output) => {
        if (!output.currentSceneId) return [output.id, null] as const;
        const result = await listLayers({ sceneId: output.currentSceneId });
        const videoLayer = result.success ? result.data.find((layer) => layer.type === "video") : undefined;
        const playlistId = videoLayer && typeof videoLayer.config.playlistId === "string" ? (videoLayer.config.playlistId as string) : null;
        return [output.id, playlistId] as const;
      }),
    ),
  );
}

import { getMediaAsset } from "@venore/plugin-sdk/media";
import type { PickableMedia } from "@venore/plugin-sdk/ui";

// Compartilhado por page.tsx (admin completo) e agenda/page.tsx (rota enxuta do editor de agenda)
// — mesma resolução (id cru -> filename/url/contentType) pro MediaPickerField dos formulários de
// edição nascerem preenchidos, evitando a mesma lógica duas vezes.
export async function resolvePickableMediaById<T extends { id: string }>(
  records: T[],
  getAssetId: (record: T) => string | null,
): Promise<Record<string, PickableMedia | null>> {
  const entries = await Promise.all(
    records
      .filter((record) => getAssetId(record))
      .map(async (record): Promise<[string, PickableMedia | null]> => {
        const assetId = getAssetId(record) as string;
        const asset = await getMediaAsset({ id: assetId });
        return [
          record.id,
          asset.success && asset.data
            ? { id: asset.data.id, filename: asset.data.filename, url: asset.data.url, contentType: asset.data.contentType }
            : null,
        ];
      }),
  );
  return Object.fromEntries(entries);
}

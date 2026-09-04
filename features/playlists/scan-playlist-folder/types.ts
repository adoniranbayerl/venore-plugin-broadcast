import type { OperationResult } from "@venore/plugin-sdk";

// "video" escaneia BROADCAST_VIDEOS_FOLDER_PATH (via playlist.folderPath, sempre esse valor hoje);
// "image" escaneia BROADCAST_IMAGES_FOLDER_PATH direto — pedido explícito: "Vídeos da pasta, vamos
// fazer algo similar para 'Imagens na pasta'". Reexportado por add-scanned-playlist-items (mesmo
// vocabulário nos dois lados do fluxo scan -> confirmar).
export type PlaylistFolderScanKind = "video" | "image";

export type ScanPlaylistFolderCommand = { playlistId: string; kind: PlaylistFolderScanKind; actorId: string };
export type ScanPlaylistFolderInput = { playlistId: string; kind: PlaylistFolderScanKind };
export type ScanPlaylistFolderMissingItem = { id: string; relativePath: string };
// Preview de leitura: toAdd é o que a pasta tem e a playlist ainda não (candidato a entrar, via
// add-scanned-playlist-items); toRemove é o que a playlist tem mas sumiu da pasta (candidato a
// sair, via o botão de apagar já existente por item). Nada é gravado aqui — o operador decide.
export type ScanPlaylistFolderPreview = { toAdd: string[]; toRemove: ScanPlaylistFolderMissingItem[] };
export type ScanPlaylistFolderResult = OperationResult<ScanPlaylistFolderPreview>;

import type { OperationResult } from "@venore/plugin-sdk";

export type ScanPlaylistFolderCommand = { playlistId: string; actorId: string };
export type ScanPlaylistFolderInput = { playlistId: string };
export type ScanPlaylistFolderMissingItem = { id: string; relativePath: string };
// Preview de leitura: toAdd é o que a pasta tem e a playlist ainda não (candidato a entrar, via
// add-scanned-playlist-items); toRemove é o que a playlist tem mas sumiu da pasta (candidato a
// sair, via o botão de apagar já existente por item). Nada é gravado aqui — o operador decide.
export type ScanPlaylistFolderPreview = { toAdd: string[]; toRemove: ScanPlaylistFolderMissingItem[] };
export type ScanPlaylistFolderResult = OperationResult<ScanPlaylistFolderPreview>;

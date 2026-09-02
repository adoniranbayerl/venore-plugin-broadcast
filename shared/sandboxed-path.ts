import path from "node:path";

// Resolve um caminho relativo contra uma raiz configurada, rejeitando qualquer resultado que
// escape da raiz (".." , path absoluto disfarçado de relativo). Usado tanto no scan de pasta
// (scan-playlist-folder) quanto na resolução de stream (resolve-streamable-playlist-item) —
// defesa em profundidade: mesmo um relativePath já gravado no banco é reconferido, nunca confiado
// cegamente.
export function resolveWithinRoot(root: string, relativePath: string): string | null {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, relativePath);
  const isWithinRoot = resolvedTarget === resolvedRoot || resolvedTarget.startsWith(resolvedRoot + path.sep);
  return isWithinRoot ? resolvedTarget : null;
}

// Normaliza pra separador "/" antes de gravar no banco — path.relative devolve "\\" no Windows,
// e o valor precisa ser estável entre sistemas operacionais (o servidor que roda o scan e o que
// serve o stream não são garantidos ser o mesmo SO em todo deploy).
export function toStoredRelativePath(root: string, absolutePath: string): string {
  return path.relative(path.resolve(root), absolutePath).split(path.sep).join("/");
}

// Tira "/" no fim de um folderPath de playlist antes de gravar/comparar — bug real observado:
// "videos/" (barra sobrando, fácil de digitar sem querer no formulário) quebra qualquer checagem
// de prefixo tipo `relativePath.startsWith(`${folderPath}/`)` (vira "videos//", nunca bate com
// nada), mesmo o arquivo existindo de verdade no disco.
export function normalizePlaylistFolderPath(folderPath: string): string {
  return folderPath.replace(/\/+$/, "");
}

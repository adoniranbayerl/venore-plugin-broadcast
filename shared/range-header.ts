export type ParsedRange = { start: number; end: number };

// Parseia o header HTTP "Range: bytes=start-end" (RFC 7233, só o subconjunto de um único range
// que <video> realmente envia). Retorna null pra qualquer forma inválida ou fora dos limites do
// arquivo — quem chama decide o 416 (Range Not Satisfiable) nesse caso.
export function parseRangeHeader(rangeHeader: string, size: number): ParsedRange | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const [, startText, endText] = match;
  if (startText === "" && endText === "") return null;

  // "bytes=-500" (sufixo): os últimos 500 bytes do arquivo.
  if (startText === "") {
    const suffixLength = Number(endText);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    const start = Math.max(0, size - suffixLength);
    return { start, end: size - 1 };
  }

  const start = Number(startText);
  const end = endText === "" ? size - 1 : Number(endText);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || end < start || end >= size) return null;

  return { start, end };
}

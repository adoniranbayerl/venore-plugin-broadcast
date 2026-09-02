import { createReadStream } from "node:fs";
import { NextResponse } from "next/server";
import { parseRangeHeader, resolveStreamableItem } from "../../../index";
import { attachAbortCleanup, statusForStreamErrorCode, toWebReadableStream } from "../../../runtime/video-stream";
import { isPluginActive } from "@venore/plugin-sdk";

// Sem checagem de sessão/RBAC de propósito: quem embute esta URL é a view de saída (Fase 4),
// acessada por token, não por login — a TV não faz fluxo de autenticação interativo. A superfície
// de exposição (qualquer um na rede local com o itemId consegue baixar o vídeo sem o token) é uma
// troca deliberada pro cenário "servidor local, rede local apenas" (ver plano da Fase 0) — não
// serve pra um deploy exposto à internet.
export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }): Promise<NextResponse> {
  if (!(await isPluginActive("broadcast"))) {
    return NextResponse.json({ error: "O plugin Broadcast Studio está desabilitado." }, { status: 404 });
  }

  const { itemId } = await params;
  const resolved = await resolveStreamableItem({ itemId });
  if (!resolved.success) {
    return NextResponse.json({ error: resolved.error.message }, { status: statusForStreamErrorCode(resolved.error.code) });
  }

  if (resolved.data.kind === "redirect") {
    return NextResponse.redirect(resolved.data.url, 302);
  }

  const { absolutePath, contentType, size } = resolved.data;
  const rangeHeader = request.headers.get("range");

  if (!rangeHeader) {
    const nodeStream = createReadStream(absolutePath);
    attachAbortCleanup(nodeStream, request.signal);
    const stream = toWebReadableStream(nodeStream);
    return new NextResponse(stream, {
      status: 200,
      headers: { "Content-Type": contentType, "Content-Length": String(size), "Accept-Ranges": "bytes" },
    });
  }

  const range = parseRangeHeader(rangeHeader, size);
  if (!range) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const rangeNodeStream = createReadStream(absolutePath, { start: range.start, end: range.end });
  attachAbortCleanup(rangeNodeStream, request.signal);
  const stream = toWebReadableStream(rangeNodeStream);
  return new NextResponse(stream, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(range.end - range.start + 1),
      "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      "Accept-Ranges": "bytes",
    },
  });
}

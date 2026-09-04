import { createReadStream } from "node:fs";
import { NextResponse } from "next/server";
import { parseRangeHeader, resolveStreamableItem } from "../../../index";
import { attachAbortCleanup, statusForStreamErrorCode, toWebReadableStream } from "../../../runtime/video-stream";
import { beginStream } from "../../../runtime/diagnostics-bus";
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

  // Fonte "server" da tela de diagnóstico (Fase 13) — contadores de stream em memória, nunca em
  // banco. `stream.end(...)` precisa rodar em TODO caminho de saída desta rota (early return de
  // erro incluso), senão streamsActive nunca desce — por isso cada `return` abaixo passa por ele.
  // Nunca pode lançar (ver diagnostics-bus.ts): um bug aqui não pode derrubar o vídeo de verdade.
  const streamStartedAt = performance.now();
  const stream = beginStream();

  const { itemId } = await params;
  const resolved = await resolveStreamableItem({ itemId });
  if (!resolved.success) {
    stream.end(false);
    return NextResponse.json({ error: resolved.error.message }, { status: statusForStreamErrorCode(resolved.error.code) });
  }

  if (resolved.data.kind === "redirect") {
    stream.end(false);
    return NextResponse.redirect(resolved.data.url, 302);
  }

  const { absolutePath, contentType, size } = resolved.data;
  const rangeHeader = request.headers.get("range");

  // TTFB aproximado: tempo do início do handler até a Response ser devolvida (o Next começa a
  // puxar o ReadableStream a partir daí) — não é o TTFB de rede real até a TV, mas já isola
  // "engasgo do servidor pra montar a resposta" de "engasgo da rede/decoder", que é a pergunta que
  // esta métrica existe pra responder (ver comentário em VideoSlide, layer-renderer.tsx).
  stream.recordTtfb(performance.now() - streamStartedAt);

  if (!rangeHeader) {
    const nodeStream = createReadStream(absolutePath);
    attachAbortCleanup(nodeStream, request.signal);
    nodeStream.on("close", () => stream.end(request.signal.aborted));
    const webStream = toWebReadableStream(nodeStream);
    return new NextResponse(webStream, {
      status: 200,
      headers: { "Content-Type": contentType, "Content-Length": String(size), "Accept-Ranges": "bytes" },
    });
  }

  const range = parseRangeHeader(rangeHeader, size);
  if (!range) {
    stream.end(false);
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const rangeNodeStream = createReadStream(absolutePath, { start: range.start, end: range.end });
  attachAbortCleanup(rangeNodeStream, request.signal);
  rangeNodeStream.on("close", () => stream.end(request.signal.aborted));
  const webStream = toWebReadableStream(rangeNodeStream);
  return new NextResponse(webStream, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(range.end - range.start + 1),
      "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      "Accept-Ranges": "bytes",
    },
  });
}

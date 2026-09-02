import { type ReadStream } from "node:fs";

// Vídeo com scrub/seek agressivo (o player TV/admin abre uma nova range request e aborta a
// anterior) deixava o fs.ReadStream anterior tentando empurrar bytes pro controller do
// ReadableStream web já cancelado pelo consumidor — Readable.toWeb() não destrói sozinho o stream
// Node quando o lado web é cancelado por desconexão do client, então o próximo 'data'/'end' do fs
// stream chamava controller.enqueue()/close() num controller já fechado ("Invalid state:
// Controller is already closed"), subindo como uncaughtException (derruba a request E deixa o
// file handle aberto — origem real da lentidão observada, não só do erro no log).
//
// destroy() no abort do request.signal (attachAbortCleanup) já cobria o caso comum, mas a doc do
// Next.js (node_modules/next/dist/docs) não documenta se/quando request.signal dispara pra um GET
// de Route Handler com corpo em stream — não dá pra confiar só nisso. toWebReadableStream() abaixo
// troca Readable.toWeb() por um ReadableStream próprio cujo cancel() é o contrato garantido do lado
// consumidor (chamado pelo runtime exatamente quando ele para de ler, sem depender de signal
// nenhum) e destrói o fs stream ali; e cada chamada em controller (enqueue/close/error) fica em
// try/catch — mesmo que um 'data' já enfileirado vença a corrida contra o destroy(), a exceção é
// engolida ali, nunca sobe como uncaughtException.
export function attachAbortCleanup(nodeStream: ReadStream, signal: AbortSignal): void {
  const onAbort = () => {
    if (!nodeStream.destroyed) nodeStream.destroy();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  nodeStream.once("close", () => signal.removeEventListener("abort", onAbort));
  // ERR_STREAM_PREMATURE_CLOSE é esperado quando destroy() (daqui ou do cancel() do ReadableStream)
  // interrompe uma leitura em andamento — sem este handler, o 'error' sem listener também vira
  // uncaughtException.
  nodeStream.on("error", (error) => {
    if ((error as NodeJS.ErrnoException).code !== "ERR_STREAM_PREMATURE_CLOSE") {
      console.error("[broadcast/stream] erro inesperado lendo arquivo de vídeo:", error);
    }
  });
}

export function toWebReadableStream(nodeStream: ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk: string | Buffer) => {
        try {
          controller.enqueue(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        } catch {
          // Controller já fechado por um cancel() que venceu o 'data' — a leitura correspondente
          // do fs stream é descartada, sem propagar (ver comentário acima de attachAbortCleanup).
        }
      });
      nodeStream.once("end", () => {
        try {
          controller.close();
        } catch {
          // Idem — cancel() pode ter fechado o controller entre o 'end' disparar e chegar aqui.
        }
      });
      nodeStream.once("error", (error) => {
        if ((error as NodeJS.ErrnoException).code === "ERR_STREAM_PREMATURE_CLOSE") return;
        try {
          controller.error(error);
        } catch {
          // Mesmo racional.
        }
      });
    },
    cancel() {
      if (!nodeStream.destroyed) nodeStream.destroy();
    },
  });
}

// Mapeia código de erro de domínio (resolveStreamableItem, ver barrel) pro status HTTP — só a
// rota (app/api/broadcast/stream/[itemId]/route.ts) usa isto, mas é conhecimento do vocabulário
// de erro do plugin, não de como Next.js monta uma Response, por isso mora aqui.
export function statusForStreamErrorCode(code: string): number {
  if (code.endsWith("not_found") || code.endsWith("file_not_found") || code.endsWith("media_not_found")) return 404;
  return 400;
}

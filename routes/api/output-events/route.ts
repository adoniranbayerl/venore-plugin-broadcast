import { NextResponse } from "next/server";
import { getOutputState, subscribeToOutputEvents, verifyOutputPin, type BroadcastOutputEvent } from "../../../index";
import { readOutputPinCookie } from "../../../shared/output-pin-cookie";
import { isPluginActive } from "@venore/plugin-sdk";

// `export const dynamic` (stream vivo, nunca cache estático) precisa ficar declarado direto no
// arquivo de rota dentro de app/ — Next.js só lê route segment config de export direto no arquivo
// de rota, não segue re-export (ver app/api/broadcast/output/[token]/events/route.ts).
//
// x-forwarded-for — mesmo padrão já usado em app/api/media/upload/route.ts (getClientIp local,
// não compartilhado entre os dois arquivos, por enquanto só duas ocorrências). "desconhecido" é o
// mesmo default de subscribeToOutputEvents (runtime/output-bus.ts) quando o cabeçalho não vem
// (acesso direto sem proxy na frente, por exemplo).
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "desconhecido";
}

// Um evento de controle real (troca de cena/playlist/aviso) pode não vir por horas. Sem nenhum
// byte no fio, um proxy/switch no meio de uma LAN corta a conexão ociosa depois de alguns minutos
// e a reconexão automática do EventSource às vezes falha em silêncio — a TV congela sem ninguém
// perceber e só o poll de fallback segura. O heartbeat abaixo manda uma linha de comentário SSE
// (`:` inicial, o browser ignora) a cada 20s: mantém o caminho vivo e faz o Node detectar cedo um
// socket já morto (a escrita falha -> cancel() roda -> unsubscribe).
const HEARTBEAT_INTERVAL_MS = 20_000;

// Sem checagem de sessão/RBAC de propósito — mesmo racional de app/api/broadcast/stream: acesso
// por token (o mesmo token da URL da view de saída), não por login (ver contracts/types.ts). PIN
// opcional (verifyOutputPin) é checado à parte — não substitui o token, é uma camada A MAIS sobre
// ele quando a saída tem um configurado (ver routes/out/page.tsx, mesma checagem).
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  if (!(await isPluginActive("broadcast"))) {
    return NextResponse.json({ error: "O plugin Broadcast Studio está desabilitado." }, { status: 404 });
  }

  const { token } = await params;

  const pinCookie = await readOutputPinCookie(token);
  const pinCheck = await verifyOutputPin({ token, candidate: pinCookie });
  if (pinCheck.success && pinCheck.data.required && !pinCheck.data.valid) {
    return NextResponse.json({ error: "PIN necessário." }, { status: 401 });
  }

  const initialState = await getOutputState({ token });
  if (!initialState.success) {
    return NextResponse.json({ error: initialState.error.message }, { status: 404 });
  }

  const clientIp = getClientIp(request);
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  const stopHeartbeat = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      // Dica de reconexão logo no primeiro byte: se o proxy derrubar o socket, o EventSource
      // espera 5s antes de tentar de novo (o default do agente varia; deixamos explícito).
      controller.enqueue(encoder.encode("retry: 5000\n\n"));

      // Primeiro evento é sempre o snapshot completo (hydration) — inclusive numa reconexão
      // automática do EventSource depois de horas de TV ligada, nunca só deltas a partir daí.
      send({ type: "state", state: initialState.data });

      // Ver HEARTBEAT_INTERVAL_MS. `try/catch`: se o controller já fechou entre um tick e o
      // cancel() chegar, para o timer aqui mesmo em vez de estourar.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          stopHeartbeat();
        }
      }, HEARTBEAT_INTERVAL_MS);

      unsubscribe = subscribeToOutputEvents(
        token,
        (event: BroadcastOutputEvent) => {
          send(event);
        },
        clientIp,
        () => {
          // Evictado pelo teto de conexões por token no output-bus (esta era a mais antiga).
          // Encerra o stream — a TV reconecta sozinha (retry acima).
          stopHeartbeat();
          unsubscribe?.();
          try {
            controller.close();
          } catch {
            // Já fechado.
          }
        },
      );
    },
    cancel() {
      stopHeartbeat();
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Desliga o buffer de resposta do nginx/proxies reversos comuns — sem isso o proxy segura o
      // heartbeat e os eventos até encher um bloco, matando o efeito de "conexão viva".
      "X-Accel-Buffering": "no",
    },
  });
}

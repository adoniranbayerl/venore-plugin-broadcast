import { NextResponse } from "next/server";
import { reportBrowserDiagnostics } from "../../../index";
import { isPluginActive } from "@venore/plugin-sdk";
import type { BroadcastBrowserDiagnosticsSnapshot } from "../../../contracts/types";

// Chamada pelo reporter em components/output/output-canvas.tsx (fire-and-forget, ver o
// comentário lá) — sem checagem de sessão/PIN de propósito, mesmo racional das outras rotas de
// output/:token: acesso por token, não por login. Sempre responde 200 mesmo em erro de negócio
// (saída não encontrada, snapshot grande demais) — o client descarta a resposta, não há UI de erro
// pra telemetria; só um plugin desabilitado vira 404, igual às outras rotas.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }): Promise<NextResponse> {
  if (!(await isPluginActive("broadcast"))) {
    return NextResponse.json({ error: "O plugin Broadcast Studio está desabilitado." }, { status: 404 });
  }

  const { token } = await params;

  let snapshot: BroadcastBrowserDiagnosticsSnapshot;
  try {
    snapshot = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const result = await reportBrowserDiagnostics({ token, snapshot });
  return NextResponse.json({ ok: result.success });
}

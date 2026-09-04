import { NextResponse } from "next/server";
import { generateAgentScript } from "../../../index";
import { isPluginActive } from "@venore/plugin-sdk";

// Baixa scripts/broadcast-diag-agent.ps1 já preenchido pra ESTA saída (token na URL) — pedido
// explícito: "no PC eu posso entrar na rota e baixar o script", pública de propósito (sem
// checagem de sessão/PIN — mesmo racional de output/:token/state|events). $ServerUrl vem do
// próprio Host da request (não de env var do core, que o plugin não pode ler) — o navegador do PC
// da TV já está acessando pela origem certa.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  if (!(await isPluginActive("broadcast"))) {
    return NextResponse.json({ error: "O plugin Broadcast Studio está desabilitado." }, { status: 404 });
  }

  const { token } = await params;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") ?? "";
  const serverUrl = `${forwardedProto ?? "http"}://${host}`;

  const result = await generateAgentScript({ token, serverUrl });
  if (!result.success) {
    const status = result.error.code.endsWith("not_found") ? 404 : 409;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return new Response(result.data.content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.data.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

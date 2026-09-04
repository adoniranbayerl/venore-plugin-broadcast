import { asPluginApiHandler, asPluginPage, type PluginRouteTable } from "@venore/plugin-sdk";
import AdminPage from "./admin/page";
import DiagnosticsPage from "./admin/diagnostics/page";
import OutPage from "./out/page";
import { GET as streamGET } from "./api/stream/route";
import { GET as outputEventsGET } from "./api/output-events/route";
import { GET as outputStateGET } from "./api/output-state/route";
import { POST as outputDiagnosticsBrowserPOST } from "./api/output-diagnostics-browser/route";
import { POST as outputDiagnosticsAgentPOST } from "./api/output-diagnostics-agent/route";
import { GET as outputDiagnosticsAgentScriptGET } from "./api/output-diagnostics-agent-script/route";
import { GET as broadcastExportGET } from "./api/broadcast-export/route";
import { POST as broadcastImportPOST } from "./api/broadcast-import/route";

// A view de saída foge por completo da shell do (platform) — área `standalone` (caminho após
// /ext/), casada pelo dispatcher genérico src/app/ext/[...slug]/ do core. URL: /ext/broadcast/out/:token.
export const broadcastRouteTable: PluginRouteTable = {
  admin: [
    { pattern: "", Component: asPluginPage(AdminPage) },
    // Sub-rota própria (não uma aba dentro da página principal, ver comentário em routes/admin/
    // diagnostics/page.tsx) — única exceção deliberada ao "não separe os links na navegação admin"
    // do manifest.ts: é monitoramento, não edição, alcançada por um botão "Voltar"/"Diagnóstico"
    // dentro da página principal, não por uma entrada própria na sidebar.
    { pattern: "diagnostics", Component: asPluginPage(DiagnosticsPage) },
  ],
  standalone: [{ pattern: "broadcast/out/:token", Component: asPluginPage(OutPage) }],
  api: [
    { pattern: "stream/:itemId", handlers: { GET: asPluginApiHandler(streamGET) } },
    { pattern: "output/:token/events", handlers: { GET: asPluginApiHandler(outputEventsGET) } },
    { pattern: "output/:token/state", handlers: { GET: asPluginApiHandler(outputStateGET) } },
    { pattern: "output/:token/diagnostics/browser", handlers: { POST: asPluginApiHandler(outputDiagnosticsBrowserPOST) } },
    { pattern: "output/:token/diagnostics/agent", handlers: { POST: asPluginApiHandler(outputDiagnosticsAgentPOST) } },
    // Pública de propósito (pedido explícito: "no PC eu posso entrar na rota e baixar o script") —
    // devolve o .ps1 já preenchido pra esta saída, ver comentário no handler.
    { pattern: "output/:token/diagnostics/agent-script", handlers: { GET: asPluginApiHandler(outputDiagnosticsAgentScriptGET) } },
    // Pacote único (telas + playlists + agenda + mídia) — gateado por sessão admin dentro do
    // handler (BROADCAST_BUNDLE_REQUIRED_PERMISSIONS), não público como as rotas acima.
    { pattern: "export", handlers: { GET: asPluginApiHandler(broadcastExportGET) } },
    { pattern: "import", handlers: { POST: asPluginApiHandler(broadcastImportPOST) } },
  ],
};

import Link from "next/link";
import { ArrowLeft, Cpu, MonitorSmartphone, Server as ServerIcon } from "lucide-react";
import { AdminAccessDenied } from "@venore/plugin-sdk/ui";
import { AdminPageHeader } from "@venore/plugin-sdk/ui";
import { getPluginAdminPageData } from "@venore/plugin-sdk/admin";
import { Button } from "@venore/plugin-sdk/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@venore/plugin-sdk/ui";
import { getOutputDiagnostics, listDiagnosticEvents, listOutputs } from "../../../index";
import type {
  BroadcastDiagEventRecord,
  BroadcastOutputDiagnosticsRecord,
  BroadcastOutputRecord,
  BroadcastServerDiagnosticsSnapshot,
} from "../../../contracts/types";
import { getBroadcastDiagnosticsAgentKey } from "../../../components/admin/actions";
import { DiagnosticsAgentKeyForm } from "../../../components/admin/diagnostics-agent-key-form";
import { StatusBadge, StatusDot } from "../../../components/admin/status-dot";

// Sub-rota própria (não painel dentro da aba "Telas") — pedido explícito, ver
// docs/broadcast-plano-correcoes.md (Fase 13, perdida na extração do plugin, retomada de memória
// de sessão). Server-rendered simples, sem polling: "estado agora" via getOutputDiagnostics a cada
// carregamento da página — o operador atualiza a página quando quer um retrato novo, não precisa
// de tempo real pra um diagnóstico (diferente do controle ao vivo em outputs-section.tsx).
function relativeTime(date: Date | null): string {
  if (!date) return "nunca";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `há ${seconds}s`;
  if (seconds < 3600) return `há ${Math.round(seconds / 60)}min`;
  return `há ${Math.round(seconds / 3600)}h`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function formatSeconds(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`;
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(0)}%`;
}

function ServerDiagnosticsCard({ server }: { server: BroadcastServerDiagnosticsSnapshot }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="size-4" aria-hidden="true" />
          Servidor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Uptime do processo</dt>
            <dd className="text-foreground">{formatSeconds(server.uptimeSeconds)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Memória (RSS)</dt>
            <dd className="text-foreground">{formatBytes(server.rssBytes)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Lag do event loop (p50 / p99)</dt>
            <dd className="text-foreground">
              {server.eventLoopLagP50Ms.toFixed(1)}ms / {server.eventLoopLagP99Ms.toFixed(1)}ms
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Streams ativos / total</dt>
            <dd className="text-foreground">
              {server.streamsActive} / {server.streamsTotal}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">TTFB médio do streaming</dt>
            <dd className="text-foreground">{server.avgTtfbMs === null ? "—" : `${server.avgTtfbMs.toFixed(0)}ms`}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Streams abortados</dt>
            <dd className="text-foreground">{server.streamsAbortedTotal}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Coletas de lixo (GC)</dt>
            <dd className="text-foreground">
              {Object.entries(server.gcCountByKind).length === 0
                ? "—"
                : Object.entries(server.gcCountByKind)
                    .map(([kind, count]) => `${kind}: ${count}`)
                    .join(" · ")}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function OutputDiagnosticsCard({ output, diagnostics }: { output: BroadcastOutputRecord; diagnostics: BroadcastOutputDiagnosticsRecord }) {
  const browserTone = !diagnostics.browserReportedAt ? "muted" : diagnostics.browserStale ? "warning" : "success";
  const agentTone = !diagnostics.agentReportedAt ? "muted" : diagnostics.agentStale ? "warning" : "success";

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="truncate">{output.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Browser (a TV)</p>
            <StatusBadge tone={browserTone}>
              {!diagnostics.browserReportedAt ? "sem report ainda" : diagnostics.browserStale ? "desatualizado" : "ao vivo"}
            </StatusBadge>
          </div>
          {diagnostics.browserSnapshot ? (
            <p className="text-xs text-muted-foreground">
              Última vez visto {relativeTime(diagnostics.browserReportedAt)} ·{" "}
              {diagnostics.browserSnapshot.disconnected ? "desconectado do servidor" : "conectado"} ·{" "}
              {diagnostics.browserSnapshot.hasVideo
                ? `frames dropados: ${formatPercent(
                    diagnostics.browserSnapshot.droppedRatio === null ? null : diagnostics.browserSnapshot.droppedRatio * 100,
                  )}`
                : "sem vídeo tocando agora"}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum report ainda — abra a URL desta saída numa TV.</p>
          )}
        </div>

        <div className="space-y-1.5 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <Cpu className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Agent (o PC)</p>
            {diagnostics.agentReportedAt && (
              <StatusBadge tone={agentTone}>{diagnostics.agentStale ? "desatualizado" : "ao vivo"}</StatusBadge>
            )}
          </div>
          {diagnostics.agentSnapshot ? (
            <p className="text-xs text-muted-foreground">
              {diagnostics.agentStationLabel && `${diagnostics.agentStationLabel} · `}
              última vez visto {relativeTime(diagnostics.agentReportedAt)} · CPU {formatPercent(diagnostics.agentSnapshot.cpuLoadPercent)} ·
              RAM {formatPercent(diagnostics.agentSnapshot.ramUsedPercent)}
              {diagnostics.agentSnapshot.gpuName && ` · ${diagnostics.agentSnapshot.gpuName}`}
            </p>
          ) : (
            // O fallback pedido explicitamente: nunca erro/vermelho, só um aviso mudo de que o
            // agent ainda não foi configurado nesta estação.
            <p className="text-xs text-muted-foreground">
              Agent não instalado nesta tela — rode <code>scripts/broadcast-diag-agent.ps1</code> no PC desta TV pra ver CPU/RAM/rede aqui.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DiagEventsList({ events }: { events: BroadcastDiagEventRecord[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-2 text-sm">
          <StatusDot tone={event.level === "warning" ? "warning" : "muted"} className="mt-1.5" />
          <div className="min-w-0">
            <p className="text-foreground">{event.message}</p>
            <p className="text-xs text-muted-foreground">
              {event.source} · {event.createdAt.toLocaleString("pt-BR")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function BroadcastDiagnosticsPage() {
  const gate = await getPluginAdminPageData("broadcast");
  if (!gate.granted) {
    return <AdminAccessDenied message="Você não tem permissão para ver o Broadcast Studio." />;
  }

  const hasFullAccess = gate.actor.isSuperadmin || gate.actor.permissions.includes("broadcast.manage");
  const hasOutputsAccess = hasFullAccess || gate.actor.permissions.includes("broadcast.outputs.manage");
  if (!hasOutputsAccess) {
    return <AdminAccessDenied message="Você não tem permissão para ver o diagnóstico do Broadcast Studio." />;
  }

  const [outputsResult, diagnosticsResult, eventsResult, agentKey] = await Promise.all([
    listOutputs(),
    getOutputDiagnostics(),
    hasFullAccess ? listDiagnosticEvents() : Promise.resolve(null),
    hasFullAccess ? getBroadcastDiagnosticsAgentKey() : Promise.resolve(""),
  ]);

  const outputs = outputsResult.success ? outputsResult.data : [];
  const diagnosticsByOutputId = new Map(
    diagnosticsResult.success ? diagnosticsResult.data.outputs.map((entry) => [entry.outputId, entry]) : [],
  );
  const server = diagnosticsResult.success ? diagnosticsResult.data.server : null;
  const events = eventsResult?.success ? eventsResult.data : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Diagnóstico do Broadcast"
        description="Saúde de cada TV (browser + PC) e do próprio servidor — pra descobrir se um travamento é do vídeo, do PC da estação ou do servidor."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/broadcast">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
          </Button>
        }
      />

      {server && <ServerDiagnosticsCard server={server} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {outputs.map((output) => {
          const diagnostics = diagnosticsByOutputId.get(output.id);
          return diagnostics ? <OutputDiagnosticsCard key={output.id} output={output} diagnostics={diagnostics} /> : null;
        })}
        {outputs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tela cadastrada ainda.</p>}
      </div>

      {hasFullAccess && (
        <>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Chave do agent</CardTitle>
            </CardHeader>
            <CardContent>
              <DiagnosticsAgentKeyForm currentKey={agentKey} />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Eventos recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <DiagEventsList events={events} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

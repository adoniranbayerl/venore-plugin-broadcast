import { monitorEventLoopDelay, PerformanceObserver } from "node:perf_hooks";
import type { BroadcastServerDiagnosticsSnapshot } from "../contracts/types";

// Métricas do processo Next.js inteiro, pra "fonte server" da tela de diagnóstico — mesmo padrão
// de runtime/output-bus.ts (guardado em globalThis, singleton por processo, sem handler/service/
// store: é infraestrutura, não feature). NUNCA persistido em banco — sampleServerDiagnostics() lê
// ao vivo quando a página carrega, e reinicia do zero a cada restart do processo (não faz sentido
// "histórico" de um número que só descreve o processo atual).

const TTFB_SAMPLE_LIMIT = 50;

type DiagnosticsBusGlobal = typeof globalThis & {
  __broadcastDiagnosticsBus?: {
    eventLoopHistogram: ReturnType<typeof monitorEventLoopDelay>;
    gcObserver: PerformanceObserver;
    gcCountByKind: Record<string, number>;
    streamsActive: number;
    streamsTotal: number;
    streamsAbortedTotal: number;
    ttfbSamplesMs: number[];
    processStartedAt: number;
  };
};

// Nomes de PerformanceEntry.kind pra GC no Node (perf_hooks) — number cru (1-4), não string;
// mapeado só pra ficar legível na tela de diagnóstico, sem precisar decorar o enum do V8 ali.
const GC_KIND_LABELS: Record<number, string> = {
  1: "scavenge",
  2: "mark-sweep-compact",
  4: "incremental-marking",
  8: "weak-callbacks",
};

function getBus() {
  const globalWithBus = globalThis as DiagnosticsBusGlobal;
  if (!globalWithBus.__broadcastDiagnosticsBus) {
    const eventLoopHistogram = monitorEventLoopDelay();
    eventLoopHistogram.enable();

    const gcCountByKind: Record<string, number> = {};
    const gcObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // `kind` só existe em PerformanceEntry de tipo "gc" (não faz parte do tipo base do
        // perf_hooks) — cast local, mesmo racional de `getVideoPlaybackQuality` em layer-
        // renderer.tsx (API que nem toda versão/engine expõe do mesmo jeito).
        const kind = (entry as { kind?: number }).kind;
        const label = (kind !== undefined && GC_KIND_LABELS[kind]) || "desconhecido";
        gcCountByKind[label] = (gcCountByKind[label] ?? 0) + 1;
      }
    });
    try {
      gcObserver.observe({ entryTypes: ["gc"] });
    } catch {
      // Ambiente sem suporte a entryTypes "gc" (raro) — gcCountByKind fica sempre {}.
    }

    globalWithBus.__broadcastDiagnosticsBus = {
      eventLoopHistogram,
      gcObserver,
      gcCountByKind,
      streamsActive: 0,
      streamsTotal: 0,
      streamsAbortedTotal: 0,
      ttfbSamplesMs: [],
      processStartedAt: Date.now(),
    };
  }
  return globalWithBus.__broadcastDiagnosticsBus;
}

// Chamado no início de routes/api/stream/route.ts — devolve uma função de fechamento que a rota
// SEMPRE chama (sucesso ou abort), nunca podendo lançar (telemetria não pode derrubar o streaming
// de vídeo de verdade, ver comentário lá).
export function beginStream(): { recordTtfb: (ms: number) => void; end: (aborted: boolean) => void } {
  const bus = getBus();
  bus.streamsActive += 1;
  bus.streamsTotal += 1;
  let ended = false;

  return {
    recordTtfb(ms: number) {
      try {
        bus.ttfbSamplesMs.push(ms);
        if (bus.ttfbSamplesMs.length > TTFB_SAMPLE_LIMIT) bus.ttfbSamplesMs.shift();
      } catch {
        // best-effort
      }
    },
    end(aborted: boolean) {
      if (ended) return;
      ended = true;
      try {
        bus.streamsActive = Math.max(0, bus.streamsActive - 1);
        if (aborted) bus.streamsAbortedTotal += 1;
      } catch {
        // best-effort
      }
    },
  };
}

export function sampleServerDiagnostics(): BroadcastServerDiagnosticsSnapshot {
  const bus = getBus();
  const avgTtfbMs =
    bus.ttfbSamplesMs.length > 0 ? bus.ttfbSamplesMs.reduce((sum, ms) => sum + ms, 0) / bus.ttfbSamplesMs.length : null;

  return {
    uptimeSeconds: Math.round((Date.now() - bus.processStartedAt) / 1000),
    rssBytes: process.memoryUsage().rss,
    eventLoopLagP50Ms: bus.eventLoopHistogram.percentile(50) / 1e6,
    eventLoopLagP99Ms: bus.eventLoopHistogram.percentile(99) / 1e6,
    gcCountByKind: { ...bus.gcCountByKind },
    streamsActive: bus.streamsActive,
    streamsTotal: bus.streamsTotal,
    streamsAbortedTotal: bus.streamsAbortedTotal,
    avgTtfbMs,
  };
}

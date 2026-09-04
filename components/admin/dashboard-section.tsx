"use client";

import { useActionState, useRef } from "react";
import { CalendarDays, ListVideo, Tv } from "lucide-react";
import { Button } from "@venore/plugin-sdk/ui";
import { Input } from "@venore/plugin-sdk/ui";
import { useActionToast } from "@venore/plugin-sdk/ui";
import { clearAlertAction, publishAlertAction, type BroadcastActionState } from "./actions";

const initialState: BroadcastActionState = { error: null };

// Movido de components/admin/outputs-section.tsx (era QuickAlertPanel lá) — pedido explícito:
// "o card Aviso rápido vamos separar ele em outro lugar [...] o aviso rápido pode estar lá" (no
// novo dashboard). Sem mudança de comportamento — mesmo formulário, mesmas actions. Global (não
// por saída) — aparece em toda saída, e some sozinho quando a duração passa; "Remover agora" força
// isso antes do tempo, se precisar.
function QuickAlertPanel() {
  const publishFormRef = useRef<HTMLFormElement>(null);
  const [publishState, publishFormAction, publishPending] = useActionState(publishAlertAction, initialState);
  // Sem revalidatePath (a TV reage via SSE) — limpa o campo no sucesso pra não parecer que a
  // mensagem já publicada continua na fila.
  useActionToast({
    pending: publishPending,
    error: publishState.error,
    successMessage: "Aviso publicado.",
    onSuccess: () => publishFormRef.current?.reset(),
  });

  const [clearState, clearFormAction, clearPending] = useActionState(clearAlertAction, initialState);
  useActionToast({ pending: clearPending, error: clearState.error, successMessage: "Aviso removido." });

  return (
    <div className="space-y-2 rounded-panel border border-border bg-card p-3">
      <p className="text-sm font-medium text-foreground">Aviso rápido</p>
      <p className="text-xs text-muted-foreground">
        Aparece em cima do conteúdo (empurrando, sem cobrir nada) em qualquer tela, e some sozinho depois do tempo.
      </p>
      <form ref={publishFormRef} action={publishFormAction} className="flex flex-wrap items-end gap-2">
        <div className="min-w-64 flex-1 space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="alert-message">Mensagem</label>
          <Input id="alert-message" name="message" placeholder="Reunião às 15h no auditório" required />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="alert-duration">Segundos na tela</label>
          <Input id="alert-duration" name="durationSeconds" type="number" defaultValue={30} className="w-24" />
        </div>
        <Button type="submit" disabled={publishPending}>Publicar aviso</Button>
      </form>
      <form action={clearFormAction}>
        <Button type="submit" variant="outline" size="sm" disabled={clearPending}>Remover agora</Button>
      </form>
    </div>
  );
}

// Contagem simples (sem clique-pra-navegar, sem status colorido) — os cards grandes com status já
// existem acima da Tabs (AdminOverviewNav, sempre visíveis independente da aba ativa); repetir o
// mesmo cartão aqui dentro do Dashboard seria redundante. Isto é só um resumo textual rápido de
// "quanto tem de cada coisa" pra acompanhar o aviso rápido.
function SummaryStat({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 rounded-panel border border-border bg-card p-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// Nova aba "Dashboard" (pedido explícito: "vamos criar um dashboard do broadcast com resumo — hoje
// ele abre direto em Telas") — primeira entrada de tabs em routes/admin/page.tsx, então vira a aba
// padrão ao abrir /admin/broadcast, no lugar de "Telas". Só pra hasFullAccess (mesmo gate de
// Configurações/Administradores) — o aviso rápido que morava aqui já era exclusivo desse nível de
// acesso dentro de OutputsSection.
export function DashboardSection({
  outputsCount,
  playlistsCount,
  agendasCount,
}: {
  outputsCount: number;
  playlistsCount: number;
  agendasCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryStat icon={<Tv className="size-5" aria-hidden="true" />} label="Telas cadastradas" count={outputsCount} />
        <SummaryStat icon={<ListVideo className="size-5" aria-hidden="true" />} label="Playlists" count={playlistsCount} />
        <SummaryStat icon={<CalendarDays className="size-5" aria-hidden="true" />} label="Agendas" count={agendasCount} />
      </div>
      <QuickAlertPanel />
    </div>
  );
}

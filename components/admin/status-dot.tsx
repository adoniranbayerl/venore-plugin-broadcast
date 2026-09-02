import type { ReactNode } from "react";
import type { StatusTone } from "./status";

// Classes completas por tom (nunca concatenadas em runtime) — mesmo padrão de
// ACTIVE_TOGGLE_CLASSNAME em outputs-section.tsx, pro Tailwind conseguir detectar a classe no
// código-fonte. Vocabulário shadcn já oficial (success/warning, AGENTS.md seção 3) — "muted" usa
// muted-foreground/40 por não ter token semântico "neutro" próprio.
const DOT_TONE_CLASSNAME: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  muted: "bg-muted-foreground/40",
};

const BADGE_TONE_CLASSNAME: Record<StatusTone, string> = {
  success: "border-success-border bg-success-soft text-success",
  warning: "border-warning-border bg-warning-soft text-warning",
  muted: "border-border bg-muted text-muted-foreground",
};

// Faixa lateral colorida (border-l-4) de card — usada tanto pelos cards grandes do
// AdminOverviewNav quanto pelo grid de Telas (outputs-section.tsx), mesmo tom em ambos.
export const STATUS_BORDER_CLASSNAME: Record<StatusTone, string> = {
  success: "border-l-success",
  warning: "border-l-warning",
  muted: "border-l-border",
};

// Ponto colorido isolado — pra lugares apertados (TabsTrigger, cabeçalho de card) onde só a cor já
// basta pra dar o sinal luminoso; o texto do status mora ao lado, no StatusBadge ou num parágrafo
// próprio.
export function StatusDot({ tone, className = "" }: { tone: StatusTone; className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-2.5 shrink-0 rounded-full ${DOT_TONE_CLASSNAME[tone]} ${className}`} />;
}

// Badge com o texto do status já colorido pelo tom — substitui os badges neutros
// (bg-muted/text-muted-foreground) que existiam antes em cada seção, carregando o mesmo texto
// (contagem de itens, "vazia" etc.) mas agora com o sinal de cor embutido em vez de um parágrafo
// à parte.
export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-normal ${BADGE_TONE_CLASSNAME[tone]}`}
    >
      <StatusDot tone={tone} className="size-1.5" />
      {children}
    </span>
  );
}

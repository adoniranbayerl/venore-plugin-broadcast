import type { ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@venore/plugin-sdk/ui";
import { StatusBadge } from "./status-dot";
import type { StatusTone } from "./status";

// Badge cujo próprio corpo é o gatilho de um dropdown listando os itens por trás da contagem —
// mesmo padrão nasceu em outputs-section.tsx (ConnectedTvsBadge, "N TVs conectadas" → lista de
// IPs) e é reaproveitado por playlists-section.tsx ("N telas" → lista de nomes de tela). Sem
// itens, o badge fica só informativo — não abre menu vazio. DropdownMenuTrigger sem asChild já
// renderiza um <button> de verdade em volta do que for passado como children, então o StatusBadge
// (que é só um <span>) não precisa de wrapper próprio pra virar clicável.
export function ListDropdownBadge({
  tone,
  label,
  items,
  itemClassName = "text-foreground",
}: {
  tone: StatusTone;
  label: ReactNode;
  items: string[];
  itemClassName?: string;
}) {
  const badge = <StatusBadge tone={tone}>{label}</StatusBadge>;

  if (items.length === 0) return badge;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full">{badge}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-28">
        {items.map((item) => (
          <div key={item} className={`px-1.5 py-1 text-xs ${itemClassName}`}>
            {item}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

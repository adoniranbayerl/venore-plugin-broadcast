"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@venore/plugin-sdk/ui";
import { useActionToast } from "@venore/plugin-sdk/ui";
import { regenerateDiagnosticsAgentKeyAction, type BroadcastActionState } from "./actions";

const initialState: BroadcastActionState = { error: null };

// Chave mascarada por padrão (mesmo racional de nunca deixar segredo visível na tela por acaso) —
// revelar/copiar são ações explícitas do operador. Sem input de digitar: a única forma de trocar a
// chave é gerar uma nova (regenerateDiagnosticsAgentKeyAction), nunca escrever uma à mão.
export function DiagnosticsAgentKeyForm({ currentKey }: { currentKey: string }) {
  const [state, formAction, pending] = useActionState(regenerateDiagnosticsAgentKeyAction, initialState);
  useActionToast({ pending, error: state.error, successMessage: "Nova chave gerada." });
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(currentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem clipboard (HTTP sem contexto seguro, engine antiga) — o operador seleciona o texto à
      // mão; sem fallback de prompt aqui de propósito, diferente do "Copiar link da TV" (essa
      // chave nunca precisa sair pra fora do PC do admin, não há pressa em cobrir todo navegador).
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground">
          {currentKey ? (revealed ? currentKey : "•".repeat(Math.min(currentKey.length, 36))) : "(nenhuma chave gerada ainda)"}
        </code>
        {currentKey && (
          <>
            <Button type="button" variant="ghost" size="icon" onClick={() => setRevealed((value) => !value)} aria-label={revealed ? "Ocultar chave" : "Revelar chave"}>
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={copyKey} aria-label="Copiar chave">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </>
        )}
      </div>
      <form action={formAction}>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {currentKey ? "Gerar nova chave" : "Gerar chave"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        O link &quot;Baixar script do agent pra esta tela&quot;, em cada card de tela abaixo, já baixa o script com esta chave preenchida
        — não precisa copiar o valor à mão. Gerar uma chave nova invalida instantaneamente qualquer agent rodando com a chave antiga
        (baixe o script de novo pra cada PC depois de trocar).
      </p>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@venore/plugin-sdk/ui";
import { Input } from "@venore/plugin-sdk/ui";
import { submitOutputPinAction, type SubmitOutputPinState } from "./actions";

const initialState: SubmitOutputPinState = { error: null };

// Tela de PIN — mesma estética "canvas preto" da view de saída (ver output-canvas.tsx), cores em
// hex via style (não className) de propósito: esta rota fica fora da shell/tema do site (ver
// comentário em page.tsx), então não usa o vocabulário de cor shadcn — mesmo racional já
// documentado em layer-renderer.tsx (TV_ACCENT_COLOR etc).
//
// Escala em `vmin`, não em `rem`/px de formulário de admin: esta tela NÃO passa pelo palco
// escalado de output-canvas.tsx (aquele `transform: scale` só envolve o canvas de camadas, não
// esta rota), então `rem` resolveria contra o <html> (16px fixo, que o plugin não pode tocar) e o
// cartão sairia do tamanho de um formulário de tela — ilegível numa TV vista de longe em 1080p, e
// minúsculo em 4K. `vmin` é proporcional à tela em qualquer resolução (720p/1080p/4K, todas 16:9)
// sem depender de medir a janela em JS nem do font-size do root. As primitivas shadcn (Input/
// Button) trazem altura/tipografia fixas em `rem`; o `style` inline abaixo sobrepõe as duas com o
// mesmo `vmin`.
const CARD_WIDTH = "42vmin";
const CARD_PADDING = "4.5vmin";
const CARD_GAP = "3vmin";
const CARD_RADIUS = "1.6vmin";
const TITLE_SIZE = "3.4vmin";
const SUBTITLE_SIZE = "2vmin";
const FIELD_SIZE = "3vmin";
const FIELD_HEIGHT = "8vmin";
const ERROR_SIZE = "2vmin";
const BUTTON_SIZE = "2.4vmin";
const BUTTON_HEIGHT = "7vmin";

export function OutputPinGate({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(submitOutputPinAction, initialState);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#000000" }}>
      <form
        action={formAction}
        className="flex w-full flex-col"
        style={{
          width: CARD_WIDTH,
          maxWidth: "90vw",
          gap: CARD_GAP,
          padding: CARD_PADDING,
          borderRadius: CARD_RADIUS,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <input type="hidden" name="token" value={token} />
        <div className="text-center" style={{ display: "flex", flexDirection: "column", gap: "0.6vmin" }}>
          <p className="font-semibold" style={{ color: "#FFFFFF", fontSize: TITLE_SIZE }}>
            PIN de acesso
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: SUBTITLE_SIZE }}>
            Esta tela está protegida. Digite o PIN pra continuar.
          </p>
        </div>
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          autoFocus
          placeholder="PIN"
          className="h-auto text-center tracking-widest"
          style={{
            height: FIELD_HEIGHT,
            fontSize: FIELD_SIZE,
            background: "rgba(255,255,255,0.08)",
            color: "#FFFFFF",
            borderColor: "rgba(255,255,255,0.2)",
          }}
        />
        {state.error && (
          <p className="text-center" style={{ color: "#F87171", fontSize: ERROR_SIZE }}>
            {state.error}
          </p>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="h-auto w-full"
          style={{ height: BUTTON_HEIGHT, fontSize: BUTTON_SIZE }}
        >
          {pending ? "Verificando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

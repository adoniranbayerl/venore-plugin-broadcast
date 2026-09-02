"use client";

export type StandbyReason = "admin" | "no-content" | "disconnected";

// Um texto por motivo — pedido explícito da Fase 11. Um só componente parametrizado.
const STANDBY_STATUS_TEXT: Record<StandbyReason, string> = {
  admin: "Tela em modo de espera",
  "no-content": "Nenhum conteúdo programado",
  disconnected: "Sem conexão com o servidor — reconectando…",
};

// Legenda secundária, calma, por motivo — só preenche a composição abaixo do título; nunca promete
// um tempo de retorno (a tela pode ficar horas assim).
const STANDBY_CAPTION_TEXT: Record<StandbyReason, string> = {
  admin: "Transmissão pausada pelo operador",
  "no-content": "Aguardando a próxima programação",
  disconnected: "Tentando restabelecer o sinal",
};

// Fallback branded pra quando a saída não está exibindo conteúdo (Fase 11) — três motivos, um só
// componente (ver components/output/output-canvas.tsx pros três pontos de uso):
//  - "admin": o operador ligou "Tela offline" no card da tela (output.offline, via SSE);
//  - "no-content": a camada de vídeo não tem playlist cadastrada, ou a playlist não tem nenhum
//    item de vídeo (só imagem/página/notícia) — o canal é essencialmente vídeo (ver PlaylistLayer
//    em layer-renderer.tsx); substitui o texto cru que a PlaylistLayer mostrava antes;
//  - "disconnected": a TV perdeu contato com o servidor (SSE + poll falhando) — entra como overlay
//    sobre o último quadro e sai sozinha quando a sincronização volta.
//
// COR = TEMA (pedido explícito: "as cores dessa tela devem seguir o tema"). Diferente do resto
// deste canvas (que usa hex cru de propósito), a StandbyScreen consome só o vocabulário shadcn do
// tema ativo via `var(--...)`: `--background`, `--foreground`, `--muted-foreground`, `--primary`,
// `--accent`. Esses tokens são declarados pelo tema em src/themes/<tema>/theme.css e resolvem
// nesta rota porque o root layout (src/app/layout.tsx) põe `data-theme` no <html> e importa o
// globals.css — inclusive na saída da TV, que fica fora de `(platform)` mas ainda sob `app/`.
// Trocar o tema/paleta do site, ou o modo claro/escuro, muda esta tela junto, sem tocar aqui.
//
// Layout premium (pedidos anteriores): o FOCO é a mensagem (coluna única centrada — indicador →
// título → legenda → trilho); a LOGO é assinatura discreta no rodapé; auroras coloridas em deriva
// lenta + grelha de pontos + ruído de filme dão a textura. Tudo isso é decorativo: num motor sem
// `radial-gradient` / `color-mix` / filtro SVG / `@keyframes`, cada camada some e sobra
// `var(--background)` sólido + `var(--foreground)` no título, legível e estático.
// `prefers-reduced-motion` zera as animações (ver <style>).
//
// Vive sobre o palco escalado das Fases 1-2 (`absolute inset-0` preenche a caixa do palco):
// unidade proporcional em px de composição (referência 1920×1080), sem breakpoints. Os
// `@keyframes` e a regra de inversão da logo no modo escuro são locais a este componente pra ele
// continuar íntegro renderizado fora do canvas (ex.: SSR direto).

// Ruído fractal como data URI SVG — textura de filme fina, estática (mais barata que animar), sem
// asset externo. `feTurbulence` degrada pra nada em motores que não o suportam.
const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const STANDBY_STYLE =
  "@keyframes broadcast-standby-breathe { 0%, 100% { opacity: 0.82; transform: scale(1); } 50% { opacity: 1; transform: scale(1.015); } }" +
  "@keyframes broadcast-standby-fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }" +
  // Flutuar de leve o bloco herói inteiro — 6px, sem mexer em opacidade (um pulse de opacidade
  // num título de 84px lê como flicker na TV).
  "@keyframes broadcast-standby-hero { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }" +
  // Auroras: deriva ampla, escala pulsando de leve — ciclo de 18-24s: presença perceptível sem
  // virar um movimento nervoso numa tela ligada por horas.
  "@keyframes broadcast-standby-drift-a { 0% { transform: translate3d(0,0,0) scale(1); } 33% { transform: translate3d(6%,-4%,0) scale(1.12); } 66% { transform: translate3d(-4%,5%,0) scale(1.04); } 100% { transform: translate3d(0,0,0) scale(1); } }" +
  "@keyframes broadcast-standby-drift-b { 0% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-7%,-6%,0) scale(1.2); } 100% { transform: translate3d(0,0,0) scale(1.05); } }" +
  // Grelha de pontos rastejando 1 célula por ciclo — movimento contínuo, imperceptível quadro a
  // quadro, mas mantém a textura "viva".
  "@keyframes broadcast-standby-grid-pan { from { background-position: 0 0; } to { background-position: 56px 56px; } }" +
  // Brilho correndo no trilho de status.
  "@keyframes broadcast-standby-sheen { 0% { transform: translateX(-160%); } 100% { transform: translateX(260%); } }" +
  "@keyframes broadcast-standby-pulse-dot { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }" +
  "@keyframes broadcast-standby-pulse-ring { 0% { opacity: 0.5; transform: scale(0.6); } 80%, 100% { opacity: 0; transform: scale(4.6); } }" +
  // Assinatura: sombra suave no claro; no modo escuro do tema (classe `.dark` no <html>, posta
  // pelo next-themes) a logo — em geral tinta escura — é achatada e invertida pra não sumir sobre
  // o `--background` escuro, mesma inversão que a BrandFooterBar já faz (layer-renderer.tsx).
  "[data-broadcast-standby] .broadcast-standby-signature { filter: drop-shadow(0 8px 22px rgba(0,0,0,0.18)); }" +
  ".dark [data-broadcast-standby] .broadcast-standby-signature { filter: drop-shadow(0 8px 22px rgba(0,0,0,0.4)) brightness(0) invert(1); }" +
  "@media (prefers-reduced-motion: reduce) { [data-broadcast-standby], [data-broadcast-standby] * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; } }";

const EDGE_MASK = "radial-gradient(ellipse 75% 75% at 50% 45%, #000 0%, transparent 78%)";

export function StandbyScreen({
  reason,
  brandLogoUrl,
}: {
  reason: StandbyReason;
  brandLogoUrl: string | null;
}) {
  return (
    <div
      data-broadcast-standby
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      <style>{STANDBY_STYLE}</style>

      {/* Brilhos de acento do tema nos cantos — bem sutis, opacidade baixa no elemento (não na
          cor) pra funcionar sem `color-mix`. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.14,
          backgroundImage: [
            "radial-gradient(120% 120% at 20% 8%, var(--primary) 0%, transparent 46%)",
            "radial-gradient(130% 120% at 88% 96%, var(--accent) 0%, transparent 54%)",
          ].join(", "),
        }}
      />

      {/* Auroras — cor do tema (`--primary` / `--accent`), muito desfocadas, deriva lenta. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "-24%",
            left: "-14%",
            width: "64%",
            height: "74%",
            background: "radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)",
            opacity: 0.42,
            filter: "blur(90px)",
            animation: "broadcast-standby-drift-a 18s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-28%",
            right: "-16%",
            width: "68%",
            height: "80%",
            background: "radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 70%)",
            opacity: 0.4,
            filter: "blur(100px)",
            animation: "broadcast-standby-drift-b 22s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "16%",
            left: "50%",
            width: "46%",
            height: "46%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 68%)",
            opacity: 0.22,
            filter: "blur(80px)",
            animation: "broadcast-standby-drift-a 24s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Grelha de pontos — textura fina no tom do texto do tema, some nas bordas, rasteja. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklch, var(--foreground) 9%, transparent) 1px, transparent 1.6px)",
          backgroundSize: "56px 56px",
          maskImage: EDGE_MASK,
          WebkitMaskImage: EDGE_MASK,
          animation: "broadcast-standby-grid-pan 44s linear infinite",
        }}
      />

      {/* Ruído — textura de filme, estática, misturada com o campo. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: NOISE_TEXTURE,
          backgroundSize: "180px 180px",
          opacity: 0.2,
          mixBlendMode: "overlay",
        }}
      />

      {/* Vinheta — leve escurecimento fotográfico das bordas, foca o centro (efeito de lente,
          neutro em claro e escuro). */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 94% 94% at 50% 42%, transparent 32%, rgba(0,0,0,0.4) 100%)",
          opacity: 0.55,
        }}
      />

      {/* Conteúdo central — coluna única centrada, o foco da tela. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ padding: "0 8%", animation: "broadcast-standby-fade-in 1.1s ease both" }}
      >
        <div
          className="flex flex-col items-center text-center"
          style={{ zIndex: 1, gap: 34, animation: "broadcast-standby-hero 7s ease-in-out infinite" }}
        >
          {/* Indicador de status — ponto + anel expandindo, na cor de destaque do tema. */}
          <span style={{ position: "relative", width: 16, height: 16, flex: "none" }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                border: "2px solid var(--primary)",
                animation: "broadcast-standby-pulse-ring 2.4s ease-out infinite",
              }}
            />
            <span
              style={{
                position: "absolute",
                inset: 4,
                borderRadius: 999,
                background: "var(--primary)",
                animation: "broadcast-standby-pulse-dot 2.4s ease-in-out infinite",
              }}
            />
          </span>

          <p
            className="font-semibold"
            style={{
              color: "var(--foreground)",
              fontSize: 84,
              lineHeight: 1.1,
              maxWidth: 1360,
              letterSpacing: "-0.01em",
            }}
          >
            {STANDBY_STATUS_TEXT[reason]}
          </p>

          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: 26,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            {STANDBY_CAPTION_TEXT[reason]}
          </p>

          {/* Trilho de status: brilho na cor de destaque correndo — rápido reconectando, calmo
              nos demais motivos. O overflow recorta o brilho dentro do trilho. */}
          <div
            style={{
              position: "relative",
              width: 360,
              height: 3,
              borderRadius: 999,
              background: "color-mix(in oklch, var(--foreground) 14%, transparent)",
              overflow: "hidden",
              marginTop: 18,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "42%",
                background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
                animation: `broadcast-standby-sheen ${reason === "disconnected" ? "1.9s" : "4.6s"} ease-in-out infinite`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Assinatura da marca — pequena e discreta no rodapé, não o herói central. Inversão no
          modo escuro fica no <style> acima (.broadcast-standby-signature). */}
      {brandLogoUrl ? (
        <div className="absolute flex justify-center" style={{ left: 0, right: 0, bottom: 80, zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo vem de contexts/media (Blob), domínio arbitrário. */}
          <img
            src={brandLogoUrl}
            alt=""
            className="broadcast-standby-signature"
            style={{
              width: "auto",
              height: 60,
              maxWidth: "40%",
              objectFit: "contain",
              opacity: 0.7,
              animation: "broadcast-standby-breathe 6s ease-in-out infinite",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

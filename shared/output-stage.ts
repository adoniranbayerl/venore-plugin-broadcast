// "Palco" (stage) da view de saída: toda a view (output-canvas.tsx + layer-renderer.tsx) é
// composta contra uma LARGURA DE REFERÊNCIA FIXA em CSS px e depois escalada uniformemente pro
// viewport real via `transform: scale(...)`. Assim 1280x720, 1920x1080 e 3840x2160 (todos 16:9)
// renderizam exatamente o MESMO layout, só em tamanhos diferentes — nenhuma régua de px/%/classe
// Tailwind precisa ser recalibrada por resolução, e não sobra faixa preta na zona de vídeo que já
// não sobrava em 1080p.
//
// Por que `transform: scale` e não uma unidade fluida (rem/em)? `rem` sempre resolve contra o
// <html>, nunca contra um ancestral — e o plugin não pode tocar em globals.css / font-size do
// root (regra de fronteira). Escalar o próprio elemento do canvas é a única forma de manter a
// composição resolução-independente sem sair do plugin.
export const OUTPUT_STAGE_WIDTH_PX = 1920;
export const OUTPUT_STAGE_FALLBACK_HEIGHT_PX = 1080;

export type OutputStageTransform = {
  // Fator passado direto pro `transform: scale(...)` — uniforme nos dois eixos, nunca distorce.
  scale: number;
  // Dimensões do elemento do palco, em CSS px, ANTES da escala. `stageWidthPx` é sempre
  // OUTPUT_STAGE_WIDTH_PX; `stageHeightPx` acompanha a proporção real do viewport (normalizada
  // pra essa largura), então uma tela fora de 16:9 não ganha letterbox — o palco fica mais
  // baixo/alto e o layout flex interno se ajusta, igual já acontecia antes do palco existir.
  stageWidthPx: number;
  stageHeightPx: number;
};

const FALLBACK: OutputStageTransform = {
  scale: 1,
  stageWidthPx: OUTPUT_STAGE_WIDTH_PX,
  stageHeightPx: OUTPUT_STAGE_FALLBACK_HEIGHT_PX,
};

// `viewportWidth`/`viewportHeight` são as dimensões do lugar onde a view É pintada. Pro palco
// visual, isso é `window.innerWidth`/`innerHeight` (em TV/kiosk = a tela inteira; em devtools = o
// tamanho simulado). O cálculo de largura da agenda (useZeroBarAgendaWidthPercent) reaproveita
// esta mesma função, mas passando `window.screen.width`/`height` — a proporção FÍSICA do monitor,
// estável a F11 — em vez do viewport; só o `scale` do resultado deixa de fazer sentido nesse uso,
// `stageWidthPx`/`stageHeightPx` continuam sendo a régua de composição.
//
// Entradas degeneradas (0, negativo, NaN — SSR e o primeiro render antes de medir) caem no palco
// 1920x1080 sem escala: a view aparece composta e legível, só não ajustada ainda, nunca em branco
// (mesmo princípio dos comentários de estabilidade de mount em output-canvas.tsx).
export function resolveOutputStageTransform(viewportWidth: number, viewportHeight: number): OutputStageTransform {
  if (!(viewportWidth > 0) || !(viewportHeight > 0)) return FALLBACK;

  const scale = viewportWidth / OUTPUT_STAGE_WIDTH_PX;
  // == OUTPUT_STAGE_WIDTH_PX * (viewportHeight / viewportWidth): o palco escalado cobre o
  // viewport EXATAMENTE nos dois eixos, sem sobra pro fundo #333 aparecer (a menos de
  // arredondamento sub-pixel).
  const stageHeightPx = viewportHeight / scale;

  return { scale, stageWidthPx: OUTPUT_STAGE_WIDTH_PX, stageHeightPx };
}

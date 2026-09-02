// Paleta derivada de uma cor de fundo escolhida pelo operador (agenda.backgroundColor ou
// broadcast.brandColor, ambas hex livres) — luminância relativa decide se o texto vai em branco
// ou quase-preto, pra uma cor clara escolhida por engano não virar texto branco ilegível.
// Compartilhada por AgendaLayer / BrandFooterBar (layer-renderer.tsx) e pela StandbyScreen
// (standby-screen.tsx) — vive num módulo próprio (função pura, sem JSX) pra os dois componentes
// client importarem sem criar dependência circular entre eles.
export function resolveContrastPalette(backgroundColor: string) {
  const clean = backgroundColor.replace("#", "");
  const valid = /^[0-9a-fA-F]{6}$/.test(clean);
  const r = valid ? parseInt(clean.slice(0, 2), 16) : 15;
  const g = valid ? parseInt(clean.slice(2, 4), 16) : 15;
  const b = valid ? parseInt(clean.slice(4, 6), 16) : 15;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isLight = luminance > 0.6;
  return {
    isLight,
    foreground: isLight ? "#14142b" : "#FFFFFF",
    muted: isLight ? "rgba(20,20,43,0.6)" : "rgba(255,255,255,0.55)",
    subtle: isLight ? "rgba(20,20,43,0.08)" : "rgba(255,255,255,0.1)",
    todayBg: isLight ? "rgba(20,20,43,0.14)" : "rgba(255,255,255,0.12)",
  };
}

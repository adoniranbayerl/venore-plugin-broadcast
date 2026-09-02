// Duração padrão (segundos) de um item "imagem" numa playlist quando o operador não informa uma —
// vídeo nunca usa isso, toca pela duração natural do arquivo (onEnded). Usado por get-output-state
// (fallback de leitura) e pelos formulários de admin (placeholder do campo).
export const DEFAULT_SLIDE_DURATION_SECONDS = 15;

// "webpage" precisa de mais tempo que uma imagem pra alguém conseguir ler a página (pedido direto:
// "a página do site pode ficar 1 min") — default próprio, maior que o de imagem.
export const DEFAULT_WEBPAGE_SLIDE_DURATION_SECONDS = 60;

// Teto do bloco de notícias inteiro dentro do rodízio da playlist (todas as manchetes rodando
// juntas), não por manchete — pedido direto: "a notícia... ficar uns 30s no máximo".
export const DEFAULT_NEWS_BLOCK_DURATION_SECONDS = 30;

// Quanto tempo o card de um evento "em destaque" (item "agenda-event") fica sozinho na tela entre
// os vídeos — mesma ordem de grandeza de um slide de imagem (tempo de leitura de um card único),
// não o displaySeconds da agenda (que é por LISTA inteira, não se aplica aqui).
export const DEFAULT_AGENDA_EVENT_SLIDE_DURATION_SECONDS = 20;
